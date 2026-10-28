"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export type StravaState =
  | { kind: "not-configured" }
  | { kind: "disconnected" }
  | { kind: "connected"; athleteName: string | null; lastSyncAt: string | null };

/** What came back from Strava's redirect, shown once above the card. */
export type StravaNotice = { outcome: string; message: string | null } | null;

const NOTICES: Record<string, string> = {
  connected: "Strava is connected.",
  cancelled: "Connecting Strava was cancelled.",
  "not-configured": "Strava isn't set up for this site yet.",
};

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(iso));

/** The Strava connection: connect, sync now, disconnect. */
export default function StravaCard({ state, notice }: { state: StravaState; notice: StravaNotice }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"sync" | "disconnect" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(notice?.outcome === "error" ? notice.message : null);

  async function post(path: string, kind: "sync" | "disconnect") {
    setBusy(kind);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't reach Strava.");
        return;
      }
      if (kind === "sync") {
        setMessage(`${data.imported} activit${data.imported === 1 ? "y" : "ies"} read${data.more ? " — sync again for the rest" : ""}.`);
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the site — check your connection.");
    } finally {
      setBusy(null);
    }
  }

  const banner = notice && notice.outcome !== "error" ? [NOTICES[notice.outcome], notice.message].filter(Boolean).join(" ") : null;

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-900">Strava</h3>
        {state.kind === "connected" && (
          <span className="text-xs text-gray-500">{state.lastSyncAt ? `Last synced ${when(state.lastSyncAt)}` : "Not synced yet"}</span>
        )}
      </div>

      {banner && <p className="text-sm text-green-700">{banner}</p>}

      {state.kind === "not-configured" && (
        <div className="text-sm text-gray-700 space-y-2">
          <p>To import your runs and rides, this site needs its own Strava API app:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Create one at <a href="https://www.strava.com/settings/api" target="_blank" rel="noreferrer" className="underline underline-offset-2">strava.com/settings/api</a>, with this site&apos;s domain as the Authorization Callback Domain.</li>
            <li>Add its Client ID and Client Secret in Vercel as <code>STRAVA_CLIENT_ID</code> and <code>STRAVA_CLIENT_SECRET</code>, then redeploy.</li>
          </ol>
        </div>
      )}

      {state.kind === "disconnected" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">Connect Strava to import your activities as workouts. Only reading is asked for; nothing is posted to Strava.</p>
          <a href="/api/health/strava/connect" className="inline-block px-4 py-2 text-sm font-bold bg-gray-900 text-white">Connect Strava</a>
        </div>
      )}

      {state.kind === "connected" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Connected{state.athleteName ? <> as <strong className="text-gray-900">{state.athleteName}</strong></> : null}. New activities come in when you sync.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => post("/api/health/strava/sync", "sync")} disabled={busy !== null}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold bg-gray-900 text-white disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${busy === "sync" ? "animate-spin motion-reduce:animate-none" : ""}`} />
              {busy === "sync" ? "Syncing…" : "Sync now"}
            </button>
            <button type="button" disabled={busy !== null}
              onClick={() => window.confirm("Disconnect Strava? Workouts already imported stay.") && post("/api/health/strava/disconnect", "disconnect")}
              className="px-4 py-2 text-sm font-bold border border-gray-300 hover:border-gray-900 disabled:opacity-50">
              Disconnect
            </button>
          </div>
        </div>
      )}

      {message && <p className="text-sm text-gray-700">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </section>
  );
}
