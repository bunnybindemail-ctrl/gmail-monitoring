"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          void fetch("/api/auth/logout", {
            method: "POST",
          }).finally(() => {
            router.replace("/");
            router.refresh();
          });
        });
      }}
      type="button"
    >
      {isPending ? "Logging out..." : "Logout"}
    </button>
  );
}
