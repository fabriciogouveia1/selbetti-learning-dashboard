import { listAllContents } from "@/lib/twygo";
import { EnrollForm } from "./enroll-form";

export const dynamic = "force-dynamic";

export default async function InscreverPage() {
  const contents = await listAllContents();
  const releasedContents = contents
    .filter((c) => c.situation === "released")
    .map((c) => ({ content_id: c.content_id, name: c.name, content_type: c.content_type }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-8 py-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Inscrever usuário em curso
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cria a inscrição diretamente na Twygo
        </p>
      </header>

      <main className="p-8 max-w-xl">
        <EnrollForm contents={releasedContents} />
      </main>
    </div>
  );
}
