import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 sm:px-10 lg:py-12">
      <header className="panel rounded-[2rem] px-7 py-8 sm:px-10">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-5 font-serif text-5xl leading-[0.98] tracking-tight sm:text-6xl">
          Terms of Use
        </h1>
        <p className="muted mt-5 max-w-3xl text-base leading-7">
          These terms explain the basic rules for using Support Team Monitoring
          and connecting a Gmail account to the service.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium text-[var(--accent-strong)]">
          <Link href="/">Back to login</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
        </div>
      </header>

      <section className="panel rounded-[2rem] p-6 sm:p-8">
        <p className="eyebrow">Consent</p>
        <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--foreground)] sm:text-base">
          <p>By connecting your Google account, you authorize the app to access the Google scopes shown on the login screen.</p>
          <p>You understand that authorized admins may review synced mailbox information inside the monitoring dashboard.</p>
        </div>
      </section>

      <section className="panel rounded-[2rem] p-6 sm:p-8">
        <p className="eyebrow">Use Of Service</p>
        <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--foreground)] sm:text-base">
          <p>The service is intended for account monitoring, review, and support operations.</p>
          <p>You agree not to use the service for unlawful, abusive, or unauthorized activity.</p>
        </div>
      </section>

      <section className="panel rounded-[2rem] p-6 sm:p-8">
        <p className="eyebrow">Account Control</p>
        <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--foreground)] sm:text-base">
          <p>Admins may enable or disable sync, remove connected accounts, and manage admin/user roles.</p>
          <p>Access to the service may be suspended or removed if an account is disabled by an admin.</p>
        </div>
      </section>

      <section className="panel rounded-[2rem] p-6 sm:p-8">
        <p className="eyebrow">Service Availability</p>
        <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--foreground)] sm:text-base">
          <p>The service aims to stay available, but uninterrupted operation, permanent retention, or lifetime availability is not guaranteed.</p>
          <p>Users should keep their own account credentials secure and maintain their own Google account recovery methods.</p>
        </div>
      </section>
    </main>
  );
}
