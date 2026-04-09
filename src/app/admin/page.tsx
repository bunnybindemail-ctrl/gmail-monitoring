import Link from "next/link";

import { AdminActionForm } from "@/components/admin-action-form";
import { AdminEmailCard } from "@/components/admin-email-card";
import { AdminSyncForm } from "@/components/admin-sync-form";
import { LogoutButton } from "@/components/logout-button";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminDashboardPage({ searchParams }: AdminPageProps) {
  const session = await requireRole("ADMIN");
  const resolvedSearchParams = await searchParams;
  const requestedEmail =
    typeof resolvedSearchParams.user === "string"
      ? resolvedSearchParams.user.trim().toLowerCase()
      : "";
  const notice =
    typeof resolvedSearchParams.notice === "string"
      ? resolvedSearchParams.notice
      : "";
  const error =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : "";

  const [users, totalUsers, totalEmails, controls] = await Promise.all([
    prisma.user.findMany({
      orderBy: {
        email: "asc",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        syncEnabled: true,
        lastEmailSyncAt: true,
        lastSyncError: true,
        _count: {
          select: {
            emails: true,
          },
        },
      },
    }),
    prisma.user.count(),
    prisma.syncedEmail.count(),
    prisma.accountControl.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 12,
      select: {
        email: true,
        loginEnabled: true,
        syncEnabled: true,
        roleOverride: true,
        updatedAt: true,
      },
    }),
  ]);

  const activeMailboxEmail =
    (requestedEmail && users.some((user) => user.email === requestedEmail)
      ? requestedEmail
      : users[0]?.email) ?? "";

  const activeMailbox = activeMailboxEmail
    ? await prisma.user.findUnique({
        where: {
          email: activeMailboxEmail,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          syncEnabled: true,
          lastEmailSyncAt: true,
          lastSyncError: true,
          emails: {
            orderBy: {
              receivedAt: "desc",
            },
            take: 50,
          },
        },
      })
    : null;

  const activeMailboxEmails =
    activeMailbox?.emails.map((email) => ({
      ...email,
      mailboxEmail: activeMailbox.email,
      user: {
        email: activeMailbox.email,
        name: activeMailbox.name,
      },
    })) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 sm:px-10 lg:py-12">
      <header className="panel rounded-[2rem] px-7 py-7 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="eyebrow">Support Team Monitoring</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              Admin dashboard
            </h1>
            <p className="muted mt-4 max-w-3xl text-base leading-7">
              Signed in as {session.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <AdminSyncForm
              buttonClassName="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#192a3d]"
              label="Sync all now"
            />
            <LogoutButton />
          </div>
        </div>
      </header>

      {notice ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <article className="panel-strong rounded-3xl p-5">
          <p className="eyebrow">Users</p>
          <h2 className="mt-3 text-3xl font-semibold">{totalUsers}</h2>
          <p className="muted mt-2 text-sm">Connected accounts</p>
        </article>
        <article className="panel-strong rounded-3xl p-5">
          <p className="eyebrow">Synced Emails</p>
          <h2 className="mt-3 text-3xl font-semibold">{totalEmails}</h2>
          <p className="muted mt-2 text-sm">Across every connected mailbox</p>
        </article>
        <article className="panel-strong rounded-3xl p-5">
          <p className="eyebrow">Visible Mailboxes</p>
          <h2 className="mt-3 text-3xl font-semibold">{users.length}</h2>
          <p className="muted mt-2 text-sm">Separate blocks by connected email address</p>
        </article>
        <article className="panel-strong rounded-3xl p-5">
          <p className="eyebrow">Selected Mailbox</p>
          <h2 className="mt-3 truncate text-2xl font-semibold">
            {activeMailbox?.email ?? "None"}
          </h2>
          <p className="muted mt-2 text-sm">
            {activeMailbox ? `${activeMailboxEmails.length} recent emails loaded` : "No mailbox available"}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="panel rounded-[2rem] p-6 sm:p-8">
          <p className="eyebrow">Account Controls</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Manage access by email.
          </h2>
          <form action="/api/admin/accounts" className="mt-6 grid gap-3" method="post">
            <input
              className="rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              name="email"
              placeholder="Enter exact account email"
              required
              type="email"
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <button
                className="rounded-full bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192a3d]"
                name="action"
                type="submit"
                value="stop_sync"
              >
                Stop sync
              </button>
              <button
                className="rounded-full bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192a3d]"
                name="action"
                type="submit"
                value="resume_sync"
              >
                Resume sync
              </button>
              <button
                className="rounded-full bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192a3d]"
                name="action"
                type="submit"
                value="delete_synced"
              >
                Delete synced mail
              </button>
              <button
                className="rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                name="action"
                type="submit"
                value="demote_admin"
              >
                Remove admin
              </button>
              <button
                className="rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                name="action"
                type="submit"
                value="promote_admin"
              >
                Make admin
              </button>
              <button
                className="rounded-full border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                name="action"
                type="submit"
                value="disable_account"
              >
                Disable + remove user
              </button>
            </div>
          </form>
        </article>

        <article className="panel rounded-[2rem] p-6 sm:p-8">
          <p className="eyebrow">Active Rules</p>
          <div className="mt-5 space-y-3">
            {controls.length === 0 ? (
              <p className="muted text-sm">No manual account-control rules created yet.</p>
            ) : (
              controls.map((control) => (
                <div
                  className="rounded-3xl border border-[var(--line)] bg-white/75 p-4"
                  key={control.email}
                >
                  <p className="font-semibold break-all">{control.email}</p>
                  <p className="muted mt-2 text-sm">
                    Login: {control.loginEnabled ? "allowed" : "blocked"} | Sync:{" "}
                    {control.syncEnabled ? "enabled" : "stopped"} | Override:{" "}
                    {control.roleOverride ?? "none"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminSyncForm email={control.email} label="Sync now" />
                    {!control.loginEnabled ? (
                      <AdminActionForm action="enable_account" email={control.email} label="Enable account" />
                    ) : null}
                    {!control.syncEnabled ? (
                      <AdminActionForm action="resume_sync" email={control.email} label="Resume sync" />
                    ) : null}
                    <AdminActionForm action="delete_synced" email={control.email} label="Clear mail" />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <article className="panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow">Mailbox Filter</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                  Open one mailbox at a time
                </h2>
              </div>
              <Link
                className="text-sm font-semibold text-[var(--accent-strong)]"
                href="/api/admin/inbox"
              >
                Admin JSON API
              </Link>
            </div>

            <form action="/admin" className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                defaultValue={requestedEmail}
                name="user"
                placeholder="Type exact mailbox email"
                type="email"
              />
              <button
                className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#192a3d]"
                type="submit"
              >
                Apply filter
              </button>
            </form>
            <Link
              className="mt-3 inline-flex text-sm font-medium text-[var(--accent-strong)]"
              href="/admin"
            >
              Reset selection
            </Link>
          </article>

          <article className="panel rounded-[2rem] p-6 sm:p-8">
            <p className="eyebrow">Mailbox Directory</p>
            <div className="mt-5 space-y-3">
              {users.map((user) => (
                <div
                  className="rounded-3xl border border-[var(--line)] bg-white/70 p-4"
                  key={user.id}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">{user.name ?? user.email}</p>
                      <p className="muted break-all text-sm">{user.email}</p>
                    </div>
                    <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-strong)]">
                      {user.role}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p>Emails stored: {user._count.emails}</p>
                    <p>Last sync: {formatDate(user.lastEmailSyncAt)}</p>
                  </div>
                  <p className="muted mt-2 text-sm">
                    Sync status: {user.syncEnabled ? "enabled" : "stopped"}
                  </p>
                  {user.lastSyncError ? (
                    <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      Last sync error: {user.lastSyncError}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      className={
                        activeMailboxEmail === user.email
                          ? "rounded-full bg-[var(--foreground)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#192a3d]"
                          : "rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                      }
                      href={`/admin?user=${encodeURIComponent(user.email)}`}
                    >
                      {activeMailboxEmail === user.email ? "Opened" : "Open mailbox"}
                    </Link>
                    <AdminSyncForm email={user.email} label="Sync now" />
                    {user.syncEnabled ? (
                      <AdminActionForm action="stop_sync" email={user.email} label="Stop sync" />
                    ) : (
                      <AdminActionForm action="resume_sync" email={user.email} label="Resume sync" />
                    )}
                    <AdminActionForm action="delete_synced" email={user.email} label="Delete synced mail" />
                    {user.role === "ADMIN" && user.email !== session.email ? (
                      <AdminActionForm action="demote_admin" email={user.email} label="Remove admin" />
                    ) : null}
                    {user.role !== "ADMIN" ? (
                      <AdminActionForm action="promote_admin" email={user.email} label="Make admin" />
                    ) : null}
                    {user.email !== session.email ? (
                      <AdminActionForm
                        action="disable_account"
                        buttonClassName="rounded-full border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        email={user.email}
                        label="Disable + remove"
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="panel rounded-[2rem] p-6 sm:p-8">
            <p className="eyebrow">Mailbox Shortcuts</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Jump directly to the inbox you want
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {users.map((user) => (
                <Link
                  className={
                    activeMailboxEmail === user.email
                      ? "rounded-full bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#192a3d]"
                      : "rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                  }
                  href={`/admin?user=${encodeURIComponent(user.email)}`}
                  key={user.id}
                >
                  {user.email} ({user._count.emails})
                </Link>
              ))}
            </div>
          </article>

          <article className="panel rounded-[2rem] p-6 sm:p-8">
            <p className="eyebrow">Selected Mailbox</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              {activeMailbox?.name ?? activeMailbox?.email ?? "No mailbox selected"}
            </h2>
            <p className="muted mt-3 text-sm">
              {activeMailbox
                ? `${activeMailbox.email} inbox only. OTP mails stay in the normal list and show a button when a code is detected.`
                : "Connect a mailbox first to see emails here."}
            </p>
            <div className="mt-6 space-y-3">
              {!activeMailbox ? (
                <p className="muted text-sm">No mailbox is available right now.</p>
              ) : activeMailboxEmails.length === 0 ? (
                <p className="muted text-sm">No synced emails are available for this mailbox yet.</p>
              ) : (
                activeMailboxEmails.map((email) => <AdminEmailCard email={email} key={email.id} />)
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
