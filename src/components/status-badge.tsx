import type { ClientStatus } from "@/lib/learning/types";

const STYLES: Record<ClientStatus, string> = {
  Engajado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  Iniciando: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  "Sem uso": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  Onboarding: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
  "Sem cadastro": "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function StatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap " +
        STYLES[status]
      }
    >
      ● {status}
    </span>
  );
}
