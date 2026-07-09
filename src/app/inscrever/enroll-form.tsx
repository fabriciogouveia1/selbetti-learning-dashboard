"use client";

import { useMemo, useState } from "react";

type Content = { content_id: number; name: string; content_type: string };

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function EnrollForm({ contents }: { contents: Content[] }) {
  const [search, setSearch] = useState("");
  const [contentId, setContentId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const filteredContents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contents.slice(0, 20);
    return contents.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 20);
  }, [contents, search]);

  const selectedContent = contents.find((c) => c.content_id === contentId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contentId) {
      setState({ status: "error", message: "Escolha um curso." });
      return;
    }
    setState({ status: "loading" });

    const res = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentIds: [contentId],
        email,
        firstName,
        lastName,
      }),
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      setState({ status: "error", message: data.error ?? "Erro desconhecido." });
      return;
    }

    const contentResult = data.result?.participants?.contents?.[String(contentId)];
    if (contentResult?.error?.length) {
      setState({
        status: "error",
        message: JSON.stringify(contentResult.error),
      });
      return;
    }

    setState({
      status: "success",
      message: `${email} inscrito em "${selectedContent?.name}".`,
    });
    setEmail("");
    setFirstName("");
    setLastName("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Curso
        </label>
        <input
          type="text"
          placeholder="Buscar curso..."
          value={selectedContent ? selectedContent.name : search}
          onChange={(e) => {
            setSearch(e.target.value);
            setContentId(null);
          }}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
        />
        {!contentId && search && (
          <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            {filteredContents.map((c) => (
              <button
                type="button"
                key={c.content_id}
                onClick={() => {
                  setContentId(c.content_id);
                  setSearch("");
                }}
                className="block w-full text-left px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                {c.name}{" "}
                <span className="text-zinc-500 dark:text-zinc-400">
                  ({c.content_type})
                </span>
              </button>
            ))}
            {filteredContents.length === 0 && (
              <p className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                Nenhum curso encontrado.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Nome
          </label>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Sobrenome
          </label>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          E-mail
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
        />
      </div>

      <button
        type="submit"
        disabled={state.status === "loading"}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {state.status === "loading" ? "Inscrevendo..." : "Inscrever"}
      </button>

      {state.status === "success" && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      )}
    </form>
  );
}
