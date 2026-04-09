import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type AccountAction =
  | "stop_sync"
  | "resume_sync"
  | "delete_synced"
  | "demote_admin"
  | "promote_admin"
  | "disable_account"
  | "enable_account";

function redirectToAdmin(request: NextRequest, key: "notice" | "error", value: string) {
  const url = new URL("/admin", request.url);
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
  const action = formData.get("action");
  const email = normalizeEmail(formData.get("email"));

  if (!email || typeof action !== "string") {
    return redirectToAdmin(request, "error", "Missing email or action.");
  }

  if (
    (action === "demote_admin" || action === "disable_account") &&
    email === session.email
  ) {
    return redirectToAdmin(
      request,
      "error",
      "You cannot remove or disable your own admin access from this screen.",
    );
  }

  switch (action as AccountAction) {
    case "stop_sync": {
      await prisma.accountControl.upsert({
        where: { email },
        update: { syncEnabled: false },
        create: {
          email,
          syncEnabled: false,
        },
      });
      await prisma.user.updateMany({
        where: { email },
        data: { syncEnabled: false },
      });
      return redirectToAdmin(request, "notice", `Sync stopped for ${email}.`);
    }

    case "resume_sync": {
      await prisma.accountControl.upsert({
        where: { email },
        update: { syncEnabled: true, loginEnabled: true },
        create: {
          email,
          syncEnabled: true,
          loginEnabled: true,
        },
      });
      await prisma.user.updateMany({
        where: { email },
        data: { syncEnabled: true },
      });
      return redirectToAdmin(request, "notice", `Sync resumed for ${email}.`);
    }

    case "delete_synced": {
      await prisma.syncedEmail.deleteMany({
        where: { mailboxEmail: email },
      });
      await prisma.user.updateMany({
        where: { email },
        data: {
          gmailHistoryId: null,
          lastEmailSyncAt: null,
          lastSyncError: null,
        },
      });
      return redirectToAdmin(request, "notice", `Stored synced emails deleted for ${email}.`);
    }

    case "demote_admin": {
      await prisma.accountControl.upsert({
        where: { email },
        update: { roleOverride: "USER" },
        create: {
          email,
          roleOverride: "USER",
        },
      });
      await prisma.user.updateMany({
        where: { email },
        data: { role: "USER" },
      });
      return redirectToAdmin(request, "notice", `${email} is now treated as a user.`);
    }

    case "promote_admin": {
      await prisma.accountControl.upsert({
        where: { email },
        update: { roleOverride: "ADMIN", loginEnabled: true },
        create: {
          email,
          roleOverride: "ADMIN",
          loginEnabled: true,
        },
      });
      await prisma.user.updateMany({
        where: { email },
        data: { role: "ADMIN" },
      });
      return redirectToAdmin(request, "notice", `${email} is now treated as an admin.`);
    }

    case "disable_account": {
      await prisma.accountControl.upsert({
        where: { email },
        update: {
          loginEnabled: false,
          syncEnabled: false,
          roleOverride: "USER",
        },
        create: {
          email,
          loginEnabled: false,
          syncEnabled: false,
          roleOverride: "USER",
        },
      });
      await prisma.syncedEmail.deleteMany({
        where: { mailboxEmail: email },
      });
      await prisma.user.deleteMany({
        where: { email },
      });
      return redirectToAdmin(
        request,
        "notice",
        `${email} was disabled, removed, and its synced mail was cleared.`,
      );
    }

    case "enable_account": {
      await prisma.accountControl.upsert({
        where: { email },
        update: {
          loginEnabled: true,
          syncEnabled: true,
        },
        create: {
          email,
          loginEnabled: true,
          syncEnabled: true,
        },
      });
      return redirectToAdmin(
        request,
        "notice",
        `${email} can log in again. If the user signs in, the account will be recreated.`,
      );
    }

    default:
      return redirectToAdmin(request, "error", "Unsupported admin action.");
  }
}
