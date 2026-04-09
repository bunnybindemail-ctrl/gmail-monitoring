import { NextRequest, NextResponse } from "next/server";

import { resolveAppUrl } from "@/lib/env";
import { clearOAuthStateCookie, clearSessionCookie } from "@/lib/session";

function buildResponse(request: NextRequest, redirectToRoot: boolean) {
  const response = redirectToRoot
    ? NextResponse.redirect(new URL("/", resolveAppUrl(request)))
    : NextResponse.json({ ok: true });

  clearSessionCookie(response);
  clearOAuthStateCookie(response);

  return response;
}

export async function POST(request: NextRequest) {
  return buildResponse(request, false);
}

export async function GET(request: NextRequest) {
  return buildResponse(request, true);
}
