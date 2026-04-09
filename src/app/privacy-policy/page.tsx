import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 sm:px-10 lg:py-12">
      <header className="panel rounded-[2rem] px-7 py-8 sm:px-10">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-5 font-serif text-5xl leading-[0.98] tracking-tight sm:text-6xl">
          Privacy Policy
        </h1>
        <p className="muted mt-5 max-w-3xl text-base leading-7">
          This page explains what Support Team Monitoring collects, how it is
          used, and how synced Gmail data is handled inside the app.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium text-[var(--accent-strong)]">
          <Link href="/">Back to login</Link>
          <Link href="/terms">Terms of Use</Link>
        </div>
      </header>

      <section className="panel rounded-[2rem] p-6 sm:p-8">
        <p className="eyebrow">What We Collect</p>
        <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--foreground)] sm:text-base">
          <p>Your name and email address from Google Sign-In.</p>
          <p>Encrypted Google access and refresh tokens used for Gmail sync.</p>
          <p>Mailbox data synced into the app database, including sender, subject, snippet, timestamp, and message identifiers.</p>
          <p>Session cookies used to keep you signed in securely.</p>
        </div>
      </section>

      <section className="panel rounded-[2rem] p-6 sm:p-8">
        <p className="eyebrow">How We Use Data</p>
        <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--foreground)] sm:text-base">
          <p>To authenticate your account with Google.</p>
          <p>To sync Gmail messages that the app is authorized to read.</p>
          <p>To display synced mailbox information to authorized admins inside the monitoring dashboard.</p>
          <p>To support account administration, monitoring, and support operations.</p>
        </div>
      </section>

      <section className="panel rounded-[2rem] p-6 sm:p-8">
        <p className="eyebrow">Security</p>
        <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--foreground)] sm:text-base">
          <p>OAuth tokens are stored on the server and encrypted before database storage.</p>
          <p>Tokens are not exposed to the frontend.</p>
          <p>Admin access is role-restricted and session protected.</p>
        </div>
      </section>

      <section className="panel rounded-[2rem] p-6 sm:p-8">
        <p className="eyebrow">Your Choices</p>
        <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--foreground)] sm:text-base">
          <p>You may stop using the app at any time.</p>
          <p>You may revoke Google access from your Google Account permissions.</p>
          <p>An admin may disable sync, remove synced records, or remove the connected account from this system.</p>
        </div>
      </section>
    </main>
  );
}
