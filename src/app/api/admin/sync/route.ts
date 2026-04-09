import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { syncAllMailboxes, syncMailboxByUserId } from "@/lib/gmail-sync";

function redirectToAdmin(
  request: NextRequest,
  key: "notice" | "error",
  value: string,
  email?: string,
) {
  const url = new URL("/admin", request.url);

  if (email) {
    url.searchParams.set("user", email);
  }

  url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const email = normalizeEmail(formData.get("email"));

  try {
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!user) {
        return redirectToAdmin(request, "error", `No connected account found for ${email}.`, email);
      }

      const result = await syncMailboxByUserId(user.id);
      return redirectToAdmin(
        request,
        "notice",
        `Sync complete for ${email}: ${result.syncedEmails} new, ${result.skippedEmails} skipped.`,
        email,
      );
    }

    const result = await syncAllMailboxes();
    const failedCount = result.failedUsers.length;
    const summary = `Sync complete: ${result.syncedEmails} new, ${result.skippedEmails} skipped, ${failedCount} failed.`;
    return redirectToAdmin(request, failedCount > 0 ? "error" : "notice", summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    return redirectToAdmin(request, "error", message, email || undefined);
  }
}
