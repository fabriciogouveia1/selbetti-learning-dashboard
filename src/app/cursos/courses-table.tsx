"use client";

import { useMemo, useState } from "react";
import type { TwygoContent } from "@/lib/twygo";

const situationLabels: Record<string, string> = {
  released: "Liberado",
  draft: "Rascunho",
  blocked: "Bloqueado",
};

export function CoursesTable({ contents }: { contents: TwygoContent[] }) {
  const [search, setSearch] = useState("");
  const [situation, setSituation] = useState("all");
  const [type, setType] = useState("all");

  const types = useMemo(
    () => Array.from(new Set(contents.map((c) => c.content_type))).sort(),
    [contents]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contents.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (situation !== "all" && c.situation !== situation) return false;
      if (type !== "all" && c.content_type !== type) return false;
      return true;
    });
  }, [contents, search, situation, type]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 w-64"
        />
        <select
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
        >
          <option value="all">Todas as situações</option>
          <option value="released">Liberado</option>
          <option value="draft">Rascunho</option>
          <option value="blocked">Bloqueado</option>
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
        >
          <option value="all">Todos os tipos</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="ml-auto self-center text-sm text-zinc-500 dark:text-zinc-400">
          {filtered.length.toLocaleString("pt-BR")} resultado(s)
        </span>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              <th className="px-4 py-3 font-medium">Carga horária</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.content_id}
                className="border-b border-zinc-100 dark:border-zinc-900 last:border-0"
              >
                <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                  {c.name}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {c.content_type}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {Array.from(new Set(c.categories.map((cat) => cat.name))).join(", ") ||
                    "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium " +
                      (c.situation === "released"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400")
                    }
                  >
                    {situationLabels[c.situation] ?? c.situation}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {c.hours}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
