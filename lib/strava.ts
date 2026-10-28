// Strava: connecting the one athlete (OAuth), keeping its token fresh, and importing activities.
//
// The site's own Strava API app supplies STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET (created at
// strava.com/settings/api, with the site's domain as the Authorization Callback Domain).
// STRAVA_BASE_URL exists only to point at a local stand-in for testing.

import { db } from "@/lib/db";
import { fromStrava, type StravaActivity } from "@/lib/health";

const BASE = (process.env.STRAVA_BASE_URL ?? "https://www.strava.com").replace(/\/$/, "");

/** Activities per page — Strava's maximum — and how many pages one sync may read. */
const PER_PAGE = 200;
const MAX_PAGES = 10;
/** A sync re-reads the week before the last one, for activities uploaded late or edited since. */
const OVERLAP_SECONDS = 7 * 24 * 3600;

export const STRAVA_SCOPE = "read,activity:read_all";

/** The one-time OAuth state, kept in a cookie from connect to callback. */
export const STATE_COOKIE = "strava_state";

export function stravaConfigured(): boolean {
  return Boolean(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET);
}

export class StravaError extends Error {}

export function authorizeUrl(redirectUri: string, state: string): string {
  const qs = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: STRAVA_SCOPE,
    state,
  });
  return `${BASE}/oauth/authorize?${qs}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  /** Unix seconds. */
  expires_at: number;
  athlete?: { id: number; firstname?: string; lastname?: string };
}

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID ?? "",
      client_secret: process.env.STRAVA_CLIENT_SECRET ?? "",
      ...params,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("[strava] token", res.status, await res.text().catch(() => ""));
    throw new StravaError(res.status === 400 || res.status === 401
      ? "Strava refused the sign-in. Connect again."
      : "Couldn't reach Strava. Try again in a minute.");
  }
  return (await res.json()) as TokenResponse;
}

/** Finishes connecting: trades the code from Strava's redirect for tokens and stores them. */
export async function connect(code: string, scope: string | null): Promise<void> {
  // The athlete can untick "View data about your private activities" on Strava's screen; without
  // activity:read there is nothing to import.
  if (scope !== null && !scope.split(",").some((s) => s === "activity:read" || s === "activity:read_all")) {
    throw new StravaError("Strava was connected without access to your activities. Connect again and leave that box ticked.");
  }
  const t = await tokenRequest({ code, grant_type: "authorization_code" });
  const name = [t.athlete?.firstname, t.athlete?.lastname].filter(Boolean).join(" ") || null;
  const data = {
    athleteId: String(t.athlete?.id ?? ""),
    athleteName: name,
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: new Date(t.expires_at * 1000),
  };
  await db.stravaAccount.upsert({ where: { id: "me" }, create: { id: "me", ...data }, update: { ...data, lastSyncAt: null } });
}

export async function stravaAccount() {
  return db.stravaAccount.findUnique({
    where: { id: "me" },
    select: { athleteName: true, lastSyncAt: true, createdAt: true },
  });
}

/** An access token good for at least a minute, refreshed (and stored) when it isn't. */
async function accessToken(): Promise<string> {
  const account = await db.stravaAccount.findUnique({ where: { id: "me" } });
  if (!account) throw new StravaError("Strava isn't connected.");
  if (account.expiresAt.getTime() > Date.now() + 60_000) return account.accessToken;
  const t = await tokenRequest({ refresh_token: account.refreshToken, grant_type: "refresh_token" });
  await db.stravaAccount.update({
    where: { id: "me" },
    data: { accessToken: t.access_token, refreshToken: t.refresh_token, expiresAt: new Date(t.expires_at * 1000) },
  });
  return t.access_token;
}

async function activitiesPage(token: string, after: number, page: number): Promise<StravaActivity[]> {
  const qs = new URLSearchParams({ after: String(after), page: String(page), per_page: String(PER_PAGE) });
  const res = await fetch(`${BASE}/api/v3/athlete/activities?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) throw new StravaError("Strava no longer accepts this connection. Disconnect and connect again.");
  if (res.status === 429) throw new StravaError("Strava's rate limit was reached. Try again in 15 minutes.");
  if (!res.ok) {
    console.error("[strava] activities", res.status, await res.text().catch(() => ""));
    throw new StravaError("Couldn't read your Strava activities. Try again in a minute.");
  }
  const body = await res.json();
  return Array.isArray(body) ? (body as StravaActivity[]) : [];
}

/**
 * Imports activities since the last sync (everything, the first time). An activity already
 * imported is updated, never doubled. Returns how many were read and whether more are left.
 */
export async function syncStrava(): Promise<{ imported: number; more: boolean }> {
  const account = await db.stravaAccount.findUnique({ where: { id: "me" }, select: { lastSyncAt: true } });
  if (!account) throw new StravaError("Strava isn't connected.");
  const token = await accessToken();
  const startedAt = new Date();
  const after = account.lastSyncAt ? Math.max(0, Math.floor(account.lastSyncAt.getTime() / 1000) - OVERLAP_SECONDS) : 0;

  let imported = 0;
  let page = 1;
  for (; page <= MAX_PAGES; page++) {
    const activities = await activitiesPage(token, after, page);
    for (const a of activities) {
      if (typeof a?.id !== "number" || typeof a.start_date_local !== "string") continue;
      const { stravaId, ...data } = fromStrava(a);
      const row = { ...data, date: new Date(`${data.date}T00:00:00Z`) };
      await db.workout.upsert({ where: { stravaId }, create: { ...row, stravaId }, update: row });
      imported++;
    }
    if (activities.length < PER_PAGE) break;
  }
  const more = page > MAX_PAGES;
  // Only move the bookmark once everything up to now is in; otherwise the next sync starts over
  // from the same point and the upserts make the repeat harmless.
  if (!more) await db.stravaAccount.update({ where: { id: "me" }, data: { lastSyncAt: startedAt } });
  return { imported, more };
}

/** Revokes the site's access on Strava and forgets the tokens. Imported workouts stay. */
export async function disconnect(): Promise<void> {
  const account = await db.stravaAccount.findUnique({ where: { id: "me" } });
  if (!account) return;
  try {
    await fetch(`${BASE}/oauth/deauthorize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${account.accessToken}` },
      cache: "no-store",
    });
  } catch (e) {
    // Forgetting the tokens matters more than telling Strava; the athlete can also revoke the app
    // from Strava's own settings.
    console.error("[strava] deauthorize", e);
  }
  await db.stravaAccount.deleteMany({ where: { id: "me" } });
}
