import { NextRequest, NextResponse } from "next/server";

import { extractOtpCode, getEmailCategory } from "@/lib/email-categories";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  const where = email ? { mailboxEmail: email } : undefined;

  const [users, emails] = await Promise.all([
    prisma.user.findMany({
      where: email ? { email } : undefined,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastEmailSyncAt: true,
        lastSyncError: true,
      },
      orderBy: {
        email: "asc",
      },
    }),
    prisma.syncedEmail.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        receivedAt: "desc",
      },
      take: 100,
    }),
  ]);

  return NextResponse.json({
    users,
    emails: emails.map((message) => ({
      ...message,
      category: getEmailCategory(message),
      otpCode: extractOtpCode(message),
    })),
  });
}
