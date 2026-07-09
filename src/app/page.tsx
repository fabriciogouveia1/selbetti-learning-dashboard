import Link from "next/link";
import { getExecutiveOverview } from "@/lib/twygo";

export const dynamic = "force-dynamic";

const OTHER_TABS = [
  "Catálogo & Pacotes",
  "Gestão de Planos",
  "Usuários & Empresas",
  "Alertas",
  "Automação",
];

export default async function Home() {
  const overview = await getExecutiveOverview();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="relative overflow-hidden bg-gradient-to-br from-selbetti-green-dark via-selbetti-green to-selbetti-green-dark px-8 py-10">
        <div className="relative max-w-6xl">
          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            Selbetti Learning · Dashboard
          </span>
          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold text-white max-w-2xl leading-snug">
            Visão executiva para acompanhar cursos, trilhas, usuários e
            engajamento
          </h1>
          <p className="mt-2 text-sm text-white/70 max-w-xl">
            Dados em tempo real da Twygo — atualizado a cada carregamento da
            página.
          </p>

          <nav className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-selbetti-orange px-4 py-1.5 text-sm font-medium text-white">
              Visão Executiva
            </span>
            {OTHER_TABS.map((tab) => (
              <span
                key={tab}
                title="Em breve"
                className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/50 cursor-not-allowed"
              >
                {tab}
              </span>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <StatCard label="Cursos cadastrados" value={overview.totalCourses} />
          <StatCard
            label="Horas totais disponíveis"
            value={`${overview.totalHoursAvailable}h`}
          />
          <StatCard label="Usuários cadastrados" value={overview.totalUsers} />
          <StatCard label="Trilhas cadastradas" value={overview.totalTrilhas} />
          <StatCard label="Pacotes comerciais" value={overview.totalPacotes} />
          <StatCard
            label="Taxa de conclusão de atividades"
            value={`${overview.completionRate}%`}
            hint="concluídas / iniciadas na Twygo"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Engajamento por trilha
            </h2>
            {overview.trilhaEngagement.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Sem dados de atividade nas trilhas ainda.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {overview.trilhaEngagement.map((t) => (
                  <div key={t.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-700 dark:text-zinc-300 truncate pr-2">
                        {t.name}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400 shrink-0">
                        {t.pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-selbetti-green to-selbetti-orange"
                        style={{ width: `${t.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
              % dos cursos da trilha com pelo menos uma conclusão registrada
              (algum usuário).
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Cursos nunca assistidos
            </h2>
            <p className="text-3xl font-semibold text-selbetti-orange">
              {overview.neverWatchedCourses}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 mb-6">
              de {overview.totalCourses} cursos cadastrados, sem nenhuma
              atividade registrada — candidatos a curadoria.
            </p>
            <div className="mt-auto flex flex-wrap gap-3">
              <Link
                href="/cursos"
                className="rounded-lg bg-selbetti-green px-4 py-2 text-sm font-medium text-white"
              >
                Ver cursos
              </Link>
              <Link
                href="/inscrever"
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50"
              >
                Inscrever usuário
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
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
