import { NextRequest, NextResponse } from "next/server";

import { readSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null,
  );

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  if (pathname.startsWith("/app")) {
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  if (pathname.startsWith("/api/admin")) {
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/app/:path*", "/api/admin/:path*"],
};
