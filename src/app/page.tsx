import { redirect } from "next/navigation";

import { GoogleLoginButton } from "@/components/google-login-button";
import { getEnv, isGoogleConfigured } from "@/lib/env";
import { getSession } from "@/lib/session";

const errorMessages: Record<string, string> = {
  google_not_configured:
    "Google OAuth is not configured yet. Update the .env values before signing in.",
  missing_refresh_token:
    "Google did not return a refresh token. Please sign in again and approve the requested Gmail access.",
  oauth_denied: "Permission was denied, so the login flow was stopped.",
  oauth_failed: "Google sign-in could not be completed. Please try again.",
  oauth_profile: "The Google account profile could not be read after login.",
  oauth_state: "The Google login session expired. Please start the login flow again.",
  account_disabled:
    "This account has been disabled by an admin, so login and sync access are blocked.",
};

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const session = await getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/app");
  }

  const resolvedSearchParams = await searchParams;
  const error =
    typeof resolvedSearchParams.error === "string"
      ? errorMessages[resolvedSearchParams.error] ?? "The request could not be completed."
      : null;
  const env = getEnv();
  const googleReady = isGoogleConfigured();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-8 sm:px-10 lg:py-12">
      <section className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="panel rounded-[2.25rem] px-7 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
              Team Monitoring
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[var(--foreground)]">
              Partner-Ready Account Linking
            </span>
          </div>

          <h1 className="mt-7 font-serif text-5xl leading-[0.92] tracking-tight text-balance text-[var(--foreground)] sm:text-6xl">
            Connect your account to the collab-ready support portal.
          </h1>
          <p className="muted mt-6 max-w-3xl text-base leading-7 sm:text-lg">
            This portal is built to keep connected accounts organized, protected,
            and ready for support-side review. The same connection layer can be
            used later for partner workflows, account record handling, and
            future collab-side integrations.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-[0.72rem] font-bold uppercase tracking-[0.22em]">
            <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-[var(--accent-strong)]">
              Google OAuth
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-[var(--foreground)]">
              Encrypted Backend
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-[var(--foreground)]">
              Admin Review Flow
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-[var(--foreground)]">
              Partner API Ready
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="panel-strong rounded-3xl p-5">
              <p className="eyebrow">Account Link</p>
              <p className="mt-3 text-lg font-semibold">Google-based ID connection</p>
              <p className="muted mt-2 text-sm leading-6">
                Users connect once through Google so the backend can keep each
                account linked to the monitoring system in a clean record flow.
              </p>
            </div>
            <div className="panel-strong rounded-3xl p-5">
              <p className="eyebrow">Secure Storage</p>
              <p className="mt-3 text-lg font-semibold">Protected backend record handling</p>
              <p className="muted mt-2 text-sm leading-6">
                Sensitive tokens stay on the backend only and are encrypted
                before they are written into the account database.
              </p>
            </div>
            <div className="panel-strong rounded-3xl p-5">
              <p className="eyebrow">Support Review</p>
              <p className="mt-3 text-lg font-semibold">Restricted admin-side visibility</p>
              <p className="muted mt-2 text-sm leading-6">
                Admins can review synced mailbox records. Standard users do not
                get inbox visibility inside the app.
              </p>
            </div>
            <div className="panel-strong rounded-3xl p-5">
              <p className="eyebrow">Future Integrations</p>
              <p className="mt-3 text-lg font-semibold">Collab-ready account infrastructure</p>
              <p className="muted mt-2 text-sm leading-6">
                The connection layer is being prepared so future partner-side
                systems can plug into the same account-save and account-link flow.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[1.9rem] border border-[var(--line)] bg-white/70 p-6 sm:p-7">
            <p className="eyebrow">Connection Flow</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Three-step account linking
            </h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-[var(--line)] bg-[rgba(255,248,236,0.75)] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--foreground)] text-sm font-bold text-white">
                  1
                </div>
                <p className="mt-4 text-lg font-semibold">Connect your Google account</p>
                <p className="muted mt-2 text-sm leading-6">
                  Accept the requested access once and continue through the official Google sign-in flow.
                </p>
              </div>
              <div className="rounded-3xl border border-[var(--line)] bg-[rgba(255,248,236,0.75)] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--foreground)] text-sm font-bold text-white">
                  2
                </div>
                <p className="mt-4 text-lg font-semibold">Save the account securely</p>
                <p className="muted mt-2 text-sm leading-6">
                  The backend encrypts connection data and keeps the linked account ready for monitored sync.
                </p>
              </div>
              <div className="rounded-3xl border border-[var(--line)] bg-[rgba(255,248,236,0.75)] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--foreground)] text-sm font-bold text-white">
                  3
                </div>
                <p className="mt-4 text-lg font-semibold">Support and partner-ready review</p>
                <p className="muted mt-2 text-sm leading-6">
                  Admin-side review stays available for support operations and future partner integration workflows.
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="panel-strong rounded-[2.25rem] px-7 py-8 sm:px-8 sm:py-10">
          <p className="eyebrow">Secure Connection</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight">
            Continue account linking
          </h2>
          <p className="muted mt-4 text-sm leading-7">
            Review the access below, accept the terms once, and continue to the
            official Google account-link step.
          </p>

          {error ? (
            <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {error}
            </div>
          ) : null}

          <div className="mt-6 rounded-[1.75rem] border border-[var(--line)] bg-white/75 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
              Google Access Request
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--foreground)]">
              <div className="rounded-2xl border border-[var(--line)] bg-[rgba(255,248,236,0.65)] px-4 py-3">
                Name and profile picture
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[rgba(255,248,236,0.65)] px-4 py-3">
                Email address
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[rgba(255,248,236,0.65)] px-4 py-3">
                Gmail read access for connected account monitoring
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[rgba(255,248,236,0.65)] px-4 py-3">
                Synced email review by authorized admins
              </div>
            </div>
          </div>

          <GoogleLoginButton disabled={!googleReady} />

          {!googleReady ? (
            <p className="muted mt-4 text-sm leading-6">
              Current app URL: <code>{env.APP_URL}</code>. Replace the Google
              OAuth values inside <code>.env</code> before testing the sign-in
              flow.
            </p>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
