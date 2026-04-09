import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import { NextResponse } from "next/server";

import { shouldUseSecureCookies } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "access_of_emails_session";
export const OAUTH_STATE_COOKIE_NAME = "access_of_emails_oauth_state";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type AppRole = "ADMIN" | "USER";

export type AppSession = {
  userId: string;
  email: string;
  name: string | null;
  role: AppRole;
};

function getSessionKey() {
  const secret =
    process.env.SESSION_SECRET ??
    "replace-this-session-secret-with-at-least-32-characters";

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: AppSession) {
  return new SignJWT({
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSessionKey());
}

export async function readSessionToken(token?: string | null): Promise<AppSession | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionKey());
    const email = typeof payload.email === "string" ? payload.email : null;
    const role = payload.role === "ADMIN" ? "ADMIN" : payload.role === "USER" ? "USER" : null;
    const userId =
      typeof payload.userId === "string"
        ? payload.userId
        : typeof payload.sub === "string"
          ? payload.sub
          : null;

    if (!email || !role || !userId) {
      return null;
    }

    return {
      userId,
      email,
      name: typeof payload.name === "string" ? payload.name : null,
      role,
    };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = await readSessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null,
  );

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  } satisfies AppSession;
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return session;
}

export async function requireRole(role: AppRole) {
  const session = await requireSession();

  if (session.role !== role) {
    redirect("/unauthorized");
  }

  return session;
}

export function applySessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    expires: new Date(0),
  });
}

export function setOAuthStateCookie(response: NextResponse, state: string) {
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 60 * 10,
  });
}

export function clearOAuthStateCookie(response: NextResponse) {
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    expires: new Date(0),
  });
}
