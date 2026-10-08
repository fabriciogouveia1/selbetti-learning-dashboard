export function Delta({
  value,
  show = true,
  unit = "",
}: {
  value: number;
  show?: boolean;
  unit?: string;
}) {
  if (!show) return null;
  if (value === 0) {
    return <span className="text-xs text-zinc-400 dark:text-zinc-500">sem mudança</span>;
  }
  const positive = value > 0;
  return (
    <span
      className={
        "text-xs font-medium " +
        (positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")
      }
    >
      {positive ? "▲ +" : "▼ "}
      {value.toLocaleString("pt-BR")}
      {unit} na semana
    </span>
  );
}
