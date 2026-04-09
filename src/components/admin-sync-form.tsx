type AdminSyncFormProps = {
  buttonClassName?: string;
  email?: string;
  label: string;
};

export function AdminSyncForm({
  buttonClassName,
  email,
  label,
}: AdminSyncFormProps) {
  return (
    <form action="/api/admin/sync" method="post">
      {email ? <input name="email" type="hidden" value={email} /> : null}
      <button
        className={
          buttonClassName ??
          "rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
        }
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
