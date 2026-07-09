import Link from "next/link";
import { listContentsPage, listUsersPage } from "@/lib/twygo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [contentsResult, usersResult] = await Promise.all([
    listContentsPage({ per_page: "1" }),
    listUsersPage({ per_page: "1" }),
  ]);

  const totalCourses = contentsResult.data.pagination.total_entries;
  const totalUsers = usersResult.data.pagination.total_entries;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-8 py-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Selbetti Learning — Dashboard
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Gestão de cursos e usuários (Twygo)
        </p>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total de conteúdos" value={totalCourses} />
          <StatCard label="Total de usuários" value={totalUsers} />
        </div>
        <nav className="flex gap-3">
          <Link
            href="/cursos"
            className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium"
          >
            Ver cursos
          </Link>
          <Link
            href="/inscrever"
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50"
          >
            Inscrever usuário
          </Link>
        </nav>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 mt-1">
        {value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
