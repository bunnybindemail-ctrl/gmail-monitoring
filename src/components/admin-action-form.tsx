type AdminActionFormProps = {
  action: string;
  buttonClassName?: string;
  email: string;
  label: string;
};

export function AdminActionForm({
  action,
  buttonClassName,
  email,
  label,
}: AdminActionFormProps) {
  return (
    <form action="/api/admin/accounts" method="post">
      <input name="email" type="hidden" value={email} />
      <input name="action" type="hidden" value={action} />
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
