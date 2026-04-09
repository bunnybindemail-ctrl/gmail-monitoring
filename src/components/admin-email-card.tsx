import { extractOtpCode, getEmailCategory } from "@/lib/email-categories";
import { OtpReveal } from "@/components/otp-reveal";

type EmailCardRecord = {
  id: string;
  mailboxEmail?: string;
  receivedAt: Date;
  sender: string;
  snippet: string;
  subject: string;
  user?: {
    email: string;
    name: string | null;
  } | null;
};

type AdminEmailCardProps = {
  email: EmailCardRecord;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function AdminEmailCard({ email }: AdminEmailCardProps) {
  const category = getEmailCategory(email);
  const otpCode = extractOtpCode(email);
  const mailboxLabel = email.user?.name ?? email.user?.email ?? email.mailboxEmail ?? "Unknown mailbox";

  return (
    <article className="rounded-[1.75rem] border border-[var(--line)] bg-white/78 p-5 shadow-[0_18px_50px_rgba(16,32,51,0.08)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-lg font-semibold leading-7">{email.subject}</p>
          <p className="muted mt-1 break-all text-sm">{email.sender}</p>
        </div>
        <span
          className={
            category === "OTP"
              ? "rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-amber-800"
              : "rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-strong)]"
          }
        >
          {category === "OTP" ? "OTP available" : "Email"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-[rgba(255,248,236,0.65)] px-4 py-3">
          <p className="eyebrow">Mailbox</p>
          <p className="mt-2 break-all font-medium">{mailboxLabel}</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[rgba(255,248,236,0.65)] px-4 py-3">
          <p className="eyebrow">Received</p>
          <p className="mt-2 font-medium">{formatDate(email.receivedAt)}</p>
        </div>
      </div>

      {otpCode ? <OtpReveal code={otpCode} /> : null}

      <div className="mt-4 rounded-[1.5rem] border border-[var(--line)] bg-white px-4 py-4">
        <p className="eyebrow">Preview</p>
        <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
          {email.snippet || "No preview text available for this email."}
        </p>
      </div>
    </article>
  );
}
