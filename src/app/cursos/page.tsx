import { listAllContents } from "@/lib/twygo";
import { CoursesTable } from "./courses-table";

export const dynamic = "force-dynamic";

export default async function CursosPage() {
  const contents = await listAllContents();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-8 py-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Cursos e conteúdos
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {contents.length.toLocaleString("pt-BR")} conteúdos na Twygo
        </p>
      </header>

      <main className="p-8">
        <CoursesTable contents={contents} />
      </main>
    </div>
  );
}
