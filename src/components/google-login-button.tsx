"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

type GoogleLoginButtonProps = {
  disabled: boolean;
};

export function GoogleLoginButton({ disabled }: GoogleLoginButtonProps) {
  const [accepted, setAccepted] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-6">
      <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-[var(--line)] bg-white/75 p-4 text-sm leading-6 text-[var(--foreground)]">
        <input
          checked={accepted}
          className="mt-1 h-4 w-4 rounded border-[var(--line)] accent-[var(--accent)]"
          onChange={(event) => setAccepted(event.target.checked)}
          type="checkbox"
        />
        <span>
          I agree to link this account through Google OAuth. I understand that
          Gmail access is requested for monitoring, and that authorized admins
          can review synced email records inside the dashboard. By continuing,
          I also agree to the Privacy Policy and Terms of Use.
        </span>
      </label>

      <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-[var(--accent-strong)]">
        <Link href="/privacy-policy">Privacy Policy</Link>
        <Link href="/terms">Terms of Use</Link>
      </div>

      <button
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-[#192a3d] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled || !accepted || isPending}
        onClick={() => {
          startTransition(() => {
            window.location.assign("/api/auth/google/login");
          });
        }}
        type="button"
      >
        {isPending ? "Redirecting to Google..." : "Login with Google"}
      </button>
    </div>
  );
}
