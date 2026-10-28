import { NextResponse, type NextRequest } from "next/server";
import { STATE_COOKIE, StravaError, connect, syncStrava } from "@/lib/strava";

/**
 * Where Strava sends the browser back. Checks the state, stores the tokens and runs a first
 * sync, then returns to the Exercise page with the outcome in the query string.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const back = new URL("/self-care/exercise", request.url);
  const finish = (outcome: string, message?: string) => {
    back.searchParams.set("strava", outcome);
    if (message) back.searchParams.set("message", message);
    const res = NextResponse.redirect(back);
    res.cookies.delete({ name: STATE_COOKIE, path: "/api/health/strava" });
    return res;
  };

  // "Cancel" on Strava's screen comes back with error=access_denied.
  if (url.searchParams.get("error")) return finish("cancelled");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== request.cookies.get(STATE_COOKIE)?.value) {
    return finish("error", "That sign-in link expired or didn't come from this site. Connect again.");
  }
  try {
    await connect(code, url.searchParams.get("scope"));
    const { imported, more } = await syncStrava();
    return finish("connected", `${imported} activit${imported === 1 ? "y" : "ies"} imported${more ? " — sync again for the rest" : ""}.`);
  } catch (e) {
    if (e instanceof StravaError) return finish("error", e.message);
    console.error("[strava] callback", e);
    return finish("error", "Something went wrong connecting Strava.");
  }
}
