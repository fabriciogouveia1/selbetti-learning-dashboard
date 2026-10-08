"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SnapshotButton() {
  const router = useRouter();
  const [state, setState] = useState<{ status: "idle" | "loading" | "ok" | "error"; message?: string }>({
    status: "idle",
  });

  async function save() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/snapshot", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setState({ status: "error", message: data.error ?? "Erro ao salvar." });
        return;
      }
      setState({ status: "ok", message: `Snapshot de ${data.date} salvo.` });
      router.refresh();
    } catch {
      setState({ status: "error", message: "Falha de rede ao salvar." });
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={save}
        disabled={state.status === "loading"}
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50 disabled:opacity-50"
      >
        {state.status === "loading" ? "Salvando..." : "Salvar snapshot agora"}
      </button>
      {state.message && (
        <span
          className={
            "text-xs " +
            (state.status === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-600 dark:text-emerald-400")
          }
        >
          {state.message}
        </span>
      )}
    </div>
  );
}
