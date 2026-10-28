import { NextResponse, type NextRequest } from "next/server";
import { STATE_COOKIE, authorizeUrl, stravaConfigured } from "@/lib/strava";

/** Sends the browser to Strava's consent screen, with a one-time state to check on the way back. */
export function GET(request: NextRequest) {
  const back = new URL("/self-care/exercise", request.url);
  if (!stravaConfigured()) {
    back.searchParams.set("strava", "not-configured");
    return NextResponse.redirect(back);
  }
  const state = crypto.randomUUID();
  const redirectUri = new URL("/api/health/strava/callback", request.url).toString();
  const res = NextResponse.redirect(authorizeUrl(redirectUri, state));
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/health/strava",
    maxAge: 600,
  });
  return res;
}
