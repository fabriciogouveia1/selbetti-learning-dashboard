export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 mt-1">
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
      </p>
      {hint && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{hint}</p>
      )}
    </div>
  );
}
