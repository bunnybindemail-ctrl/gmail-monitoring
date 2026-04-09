import { redirect } from "next/navigation";
import Link from "next/link";

import { ComingSoonFeaturePanel } from "@/components/coming-soon-feature-panel";
import { LogoutButton } from "@/components/logout-button";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function UserDashboardPage() {
  const session = await requireSession();

  if (session.role === "ADMIN") {
    redirect("/admin");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      email: true,
      name: true,
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8 sm:px-10 lg:py-12">
      <header className="panel rounded-[2rem] px-7 py-7 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="eyebrow">Support Team Monitoring</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              You are protected with us.
            </h1>
            <p className="muted mt-4 max-w-2xl text-base leading-7">
              Your account is connected to our monitoring network, so our
              support team can stay close, respond faster, and help you
              whenever you need assistance.
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel-strong rounded-3xl p-5">
          <p className="eyebrow">Connected Account</p>
          <h2 className="mt-3 text-2xl font-semibold">
            {user?.name ?? session.name ?? "Google User"}
          </h2>
          <p className="muted mt-2 break-all text-sm">{user?.email ?? session.email}</p>
        </article>
        <article className="panel-strong rounded-3xl p-5">
          <p className="eyebrow">Monitoring</p>
          <h2 className="mt-3 text-2xl font-semibold">Active</h2>
          <p className="muted mt-2 text-sm">
            Your account stays under active support visibility while connected.
          </p>
        </article>
        <article className="panel-strong rounded-3xl p-5">
          <p className="eyebrow">Support</p>
          <h2 className="mt-3 text-2xl font-semibold">Ready when needed</h2>
          <p className="muted mt-2 text-sm">
            Our team stays available to guide and help whenever support is needed.
          </p>
        </article>
      </section>

      <section className="panel rounded-[2rem] p-6 sm:p-8">
        <p className="eyebrow">Message</p>
        <p className="mt-4 text-lg font-semibold">
          While your account remains connected, we can keep monitoring,
          protect continuity, and support you more quickly whenever help is
          needed.
        </p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium text-[var(--accent-strong)]">
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms">Terms of Use</Link>
        </div>
      </section>

      <ComingSoonFeaturePanel />
    </main>
  );
}
