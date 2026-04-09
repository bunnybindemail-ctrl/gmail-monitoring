import { NextRequest, NextResponse } from "next/server";

import { getAdminEmailSet, resolveAppUrl } from "@/lib/env";
import { syncMailboxByUserId } from "@/lib/gmail-sync";
import { exchangeCodeForTokens, fetchGoogleProfile } from "@/lib/google";
import { prisma } from "@/lib/prisma";
import {
  OAUTH_STATE_COOKIE_NAME,
  applySessionCookie,
  clearOAuthStateCookie,
  createSessionToken,
} from "@/lib/session";
import { encryptSecret } from "@/lib/security";

function redirectHome(request: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/?error=${error}`, resolveAppUrl(request)));
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const oauthError = params.get("error");
  const code = params.get("code");
  const state = params.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;

  if (oauthError) {
    const response = redirectHome(
      request,
      oauthError === "access_denied" ? "oauth_denied" : "oauth_failed",
    );
    clearOAuthStateCookie(response);
    return response;
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    const response = redirectHome(request, "oauth_state");
    clearOAuthStateCookie(response);
    return response;
  }

  try {
    const tokens = await exchangeCodeForTokens(code, request);

    if (!tokens.access_token) {
      const response = redirectHome(request, "oauth_failed");
      clearOAuthStateCookie(response);
      return response;
    }

    const profile = await fetchGoogleProfile(tokens);
    const accountControl = await prisma.accountControl.findUnique({
      where: {
        email: profile.email,
      },
    });

    if (accountControl && !accountControl.loginEnabled) {
      const response = redirectHome(request, "account_disabled");
      clearOAuthStateCookie(response);
      return response;
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: profile.email,
      },
      select: {
        encryptedRefreshToken: true,
      },
    });

    const encryptedRefreshToken =
      tokens.refresh_token != null
        ? encryptSecret(tokens.refresh_token)
        : existingUser?.encryptedRefreshToken ?? null;

    if (!encryptedRefreshToken) {
      const response = redirectHome(request, "missing_refresh_token");
      clearOAuthStateCookie(response);
      return response;
    }

    const role =
      accountControl?.roleOverride ??
      (getAdminEmailSet().has(profile.email) ? "ADMIN" : "USER");
    const syncEnabled = accountControl?.syncEnabled ?? true;
    const accessTokenExpiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 55 * 60 * 1000);

    const user = await prisma.user.upsert({
      where: {
        email: profile.email,
      },
      update: {
        name: profile.name,
        role,
        syncEnabled,
        encryptedAccessToken: encryptSecret(tokens.access_token),
        encryptedRefreshToken,
        accessTokenExpiresAt,
        lastSyncError: null,
      },
      create: {
        email: profile.email,
        name: profile.name,
        role,
        syncEnabled,
        encryptedAccessToken: encryptSecret(tokens.access_token),
        encryptedRefreshToken,
        accessTokenExpiresAt,
      },
    });

    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await syncMailboxByUserId(user.id).catch(() => null);

    const destination = user.role === "ADMIN" ? "/admin" : "/app";
    const response = NextResponse.redirect(new URL(destination, resolveAppUrl(request)));
    applySessionCookie(response, sessionToken);
    clearOAuthStateCookie(response);

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const response = redirectHome(
      request,
      message.includes("email address") ? "oauth_profile" : "oauth_failed",
    );
    clearOAuthStateCookie(response);
    return response;
  }
}
