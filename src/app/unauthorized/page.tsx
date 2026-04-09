import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-6 py-10 sm:px-10">
      <section className="panel-strong w-full rounded-[2rem] px-7 py-10 text-center sm:px-10">
        <p className="eyebrow">Restricted</p>
        <h1 className="mt-5 font-serif text-5xl tracking-tight">Admin access required.</h1>
        <p className="muted mx-auto mt-5 max-w-2xl text-base leading-7">
          This area is reserved for users whose email appears in the admin list
          configured in the environment.
        </p>
        <Link
          className="mt-8 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#192a3d]"
          href="/"
        >
          Return to login
        </Link>
      </section>
    </main>
  );
}
