import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { resolveAppUrl, isGoogleConfigured } from "@/lib/env";
import { buildGoogleAuthUrl } from "@/lib/google";
import { setOAuthStateCookie } from "@/lib/session";

export async function GET(request: NextRequest) {
  const appUrl = resolveAppUrl(request);

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(new URL("/?error=google_not_configured", appUrl));
  }

  const state = randomUUID();
  const response = NextResponse.redirect(buildGoogleAuthUrl(state, request));
  setOAuthStateCookie(response, state);

  return response;
}
