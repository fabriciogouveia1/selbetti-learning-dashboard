import { DashboardHeader } from "@/components/dashboard-header";
import { Delta } from "@/components/delta";
import { SnapshotButton } from "@/components/snapshot-button";
import { StatusBadge } from "@/components/status-badge";
import { PILOT_CLIENTS } from "@/data/pilot-clients";
import { scopeSnapshot, totalsFor } from "@/lib/learning/aggregate";
import { classifyClient, daysBetween, getLiveSnapshot } from "@/lib/learning/compute";
import { diffSnapshots, type CourseDiff, type MoveKind } from "@/lib/learning/diff";
import { listSnapshotDates, loadSnapshot, storageMode } from "@/lib/learning/storage";
import type { Snapshot } from "@/lib/learning/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const card =
  "rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6";
const field =
  "rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50";

function formatDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

function formatShort(date: string): string {
  const [, m, d] = date.split("-");
  return `${d}/${m}`;
}

/** Base padrão: o snapshot mais recente com 5+ dias; senão o mais recente anterior a hoje. */
function defaultBase(dates: string[], today: string): string | null {
  return (
    dates.find((d) => daysBetween(d, today) >= 5) ?? dates.find((d) => d < today) ?? null
  );
}

const MOVE_LABEL: Record<MoveKind, string> = {
  novo: "Novo usuário",
  matriculou: "Matrícula",
  iniciou: "Passou a ter progresso",
  avancou: "Novo conteúdo iniciado",
  concluiu: "Conclusão",
};

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ base?: string; empresa?: string }>;
}) {
  const params = await searchParams;
  const mode = storageMode();

  const current = await getLiveSnapshot();

  let dates: string[] = [];
  let storageError: string | null = null;
  try {
    dates = await listSnapshotDates();
  } catch (error) {
    storageError = (error as Error).message;
  }

  const baseDate =
    params.base === "none"
      ? null
      : params.base && dates.includes(params.base)
        ? params.base
        : defaultBase(dates, current.date);

  let base: Snapshot | null = null;
  if (baseDate) {
    try {
      base = await loadSnapshot(baseDate);
    } catch (error) {
      storageError = (error as Error).message;
    }
  }

  const companyKey = PILOT_CLIENTS.some((c) => c.key === params.empresa) ? params.empresa! : null;
  const cur = scopeSnapshot(current, companyKey);
  const prev = base ? scopeSnapshot(base, companyKey) : null;
  const diff = diffSnapshots(cur, prev);
  const show = diff.hasBase;
  const t = totalsFor(cur.companies);
  const dt = diff.totals;
  const scopeName = companyKey ? PILOT_CLIENTS.find((c) => c.key === companyKey)!.name : "todo o piloto";

  const prevCompanies = new Map((prev?.companies ?? []).map((c) => [c.key, c]));
  const pct = (n: number) => (t.users ? Math.round((n / t.users) * 100) : 0);

  const funnel = [
    { label: "Usuários cadastrados", value: t.users, delta: dt.users },
    { label: "Matriculados em curso/trilha", value: t.enrolled, delta: dt.enrolled },
    { label: "Com progresso registrado", value: t.started, delta: dt.started },
    { label: "Concluíram ao menos 1 conteúdo", value: t.concludedAny, delta: dt.concludedAny },
  ];

  const courseList = diff.courses;
  const topCourses = courseList.slice(0, 8);
  const risingCourses = [...courseList]
    .filter((c) => c.dStarted > 0 || c.dEnrolled > 0 || c.dConcluded > 0)
    .sort(
      (a, b) =>
        b.dConcluded + b.dStarted + b.dEnrolled - (a.dConcluded + a.dStarted + a.dEnrolled)
    )
    .slice(0, 8);

  const engagedNow = diff.moves.filter(
    (m) => m.kind === "iniciou" || m.kind === "concluiu" || m.kind === "matriculou"
  );

  const companyRows = cur.companies
    .map((c) => ({
      company: c,
      status: classifyClient(c, current.date),
      days: daysBetween(c.cadastro, current.date),
      client: PILOT_CLIENTS.find((p) => p.key === c.key)!,
      d: diff.companies[c.key],
    }))
    .sort((a, b) => b.company.courses - a.company.courses || b.company.startedUsers - a.company.startedUsers);

  const selectedCompany = companyKey ? cur.companies[0] : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardHeader
        active="/status"
        title="Status semanal do piloto"
        subtitle={
          base
            ? `Hoje (${formatDate(current.date)}) comparado com ${formatDate(base.date)} · ${scopeName}`
            : `Hoje (${formatDate(current.date)}) · ${scopeName} · sem base de comparação`
        }
      />

      <main className="max-w-6xl mx-auto p-8 flex flex-col gap-6">
        <form className={card + " flex flex-wrap items-end gap-4"} method="get">
          <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            Comparar com
            <select name="base" defaultValue={baseDate ?? "none"} className={field}>
              <option value="none">Sem comparação</option>
              {dates
                .filter((d) => d < current.date)
                .map((d) => (
                  <option key={d} value={d}>
                    {formatDate(d)}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            Empresa
            <select name="empresa" defaultValue={companyKey ?? ""} className={field}>
              <option value="">Todas as empresas</option>
              {PILOT_CLIENTS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-selbetti-green px-4 py-2 text-sm font-medium text-white"
          >
            Aplicar
          </button>
          <div className="ml-auto">
            <SnapshotButton />
          </div>
        </form>

        {storageError && (
          <p className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-400">
            Não consegui ler os snapshots salvos: {storageError}
          </p>
        )}
        {mode === "local" && process.env.VERCEL && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 text-sm text-amber-800 dark:text-amber-300">
            O armazenamento (Vercel Blob) ainda não está configurado neste ambiente — snapshots não
            podem ser salvos. Crie um Blob Store privado no projeto da Vercel e faça o redeploy.
          </p>
        )}
        {!base && !storageError && (
          <p className="rounded-lg border border-sky-300 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-900 p-4 text-sm text-sky-800 dark:text-sky-300">
            Ainda não há snapshot anterior para comparar. Clique em <b>Salvar snapshot agora</b> —
            a partir da próxima semana (o snapshot automático roda toda segunda, 8h) este painel
            mostra o que avançou.
          </p>
        )}

        {diff.newClients.length > 0 && (
          <p className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 p-4 text-sm text-emerald-800 dark:text-emerald-300">
            <b>Cliente novo na semana:</b> {diff.newClients.join(", ")}
          </p>
        )}
        {!companyKey && current.unmapped.length > 0 && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 text-sm text-amber-800 dark:text-amber-300">
            <b>Empresas na Twygo fora do piloto mapeado:</b>{" "}
            {current.unmapped.map((u) => `${u.name} (${u.users})`).join(", ")}. Se for cliente novo,
            peça para incluir em <code>src/data/pilot-clients.ts</code>.
          </p>
        )}

        <section>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
            Panorama · {scopeName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi label="Empresas com usuários" value={t.companiesWithUsers} of={t.companies} delta={dt.companiesWithUsers} show={show} />
            <Kpi label="Usuários cadastrados" value={t.users} delta={dt.users} show={show} />
            <Kpi label="Empresas com matrícula" value={t.companiesEnrolled} of={t.companies} delta={dt.companiesEnrolled} show={show} />
            <Kpi label="Matriculados" value={t.enrolled} hint={`${pct(t.enrolled)}% dos usuários`} delta={dt.enrolled} show={show} />
            <Kpi label="Com progresso" value={t.started} hint={`${pct(t.started)}% dos usuários`} delta={dt.started} show={show} />
            <Kpi label="Cursos concluídos" value={t.courses} hint="proxy de certificados" delta={dt.courses} show={show} />
            <Kpi label="Horas concluídas" value={`${t.hours}h`} delta={dt.hours} show={show} unit="h" />
            <Kpi label="Outros conteúdos concluídos" value={t.others} hint="microconteúdos, cases, PDFs" delta={dt.others} show={show} />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={card}>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Funil de engajamento
            </h2>
            <div className="flex flex-col gap-4">
              {funnel.map((f) => (
                <div key={f.label}>
                  <div className="flex justify-between text-sm mb-1 gap-2">
                    <span className="text-zinc-700 dark:text-zinc-300">{f.label}</span>
                    <span className="text-zinc-500 dark:text-zinc-400 shrink-0">
                      {f.value} · {pct(f.value)}% <Delta value={f.delta} show={show} />
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-selbetti-green to-selbetti-orange"
                      style={{ width: `${pct(f.value)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={card}>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Licenças (Twygo)
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Contratadas</p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{current.licenses.contracted}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Consumidas</p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{current.licenses.used}</p>
                <Delta value={base ? current.licenses.used - base.licenses.used : 0} show={!!base} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Disponíveis</p>
                <p className="text-2xl font-semibold text-selbetti-green">{current.licenses.available}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Uso interno (Selbetti): <b>{current.licenses.internal}</b> · Externo (clientes e demais):{" "}
              <b>{current.licenses.external}</b>
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Licenças são da conta toda; não mudam com o filtro de empresa.
            </p>
          </div>
        </section>

        <section className={card + " overflow-x-auto"}>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Visão por cliente
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                {["Cliente", "Cadastro", "Dias", "Ref. comercial", "Usuários", "Matric.", "Progresso", "Cursos concl.", "Status", "Na semana"].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companyRows.map(({ company: c, status, days, client, d }) => {
                const before = prevCompanies.get(c.key);
                const wasStatus = before ? classifyClient(before, base!.date) : null;
                return (
                  <tr key={c.key} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 align-top">
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50 font-medium">{c.name}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{formatShort(c.cadastro)}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{days}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{client.refComercial}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{c.users}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {c.enrolledUsers}
                      {show && d.dEnrolledUsers !== 0 && <Sup value={d.dEnrolledUsers} />}
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {c.startedUsers}
                      {show && d.dStartedUsers !== 0 && <Sup value={d.dStartedUsers} />}
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {c.courses}
                      {show && d.dCourses !== 0 && <Sup value={d.dCourses} />}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <StatusBadge status={status} />
                      {wasStatus && wasStatus !== status && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">antes: {wasStatus}</p>
                      )}
                    </td>
                    <td
                      className={
                        "px-3 py-2 " +
                        (show && d.moves.length > 0
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-zinc-500 dark:text-zinc-400")
                      }
                    >
                      {d.note}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
            Status: <b>Engajado</b> = ao menos 1 curso concluído · <b>Iniciando</b> = tem progresso, sem curso concluído ·{" "}
            <b>Onboarding</b> = sem progresso nos primeiros 14 dias · <b>Sem uso</b> = sem progresso após 14 dias. Números
            pequenos ao lado = variação desde {base ? formatShort(base.date) : "a base"}.
          </p>
        </section>

        {show && (
          <section className={card}>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
              O que mudou na semana
            </h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
              Quem passou a ter progresso, se matriculou ou concluiu desde {formatDate(base!.date)}.
            </p>
            {diff.moves.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhuma movimentação no período.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {[...engagedNow, ...diff.moves.filter((m) => !engagedNow.includes(m))].map((m, i) => (
                  <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="inline-flex rounded-full bg-selbetti-green/10 px-2 py-0.5 text-xs font-medium text-selbetti-green whitespace-nowrap">
                      {MOVE_LABEL[m.kind]}
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-50">{m.user}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">· {m.company} — {m.detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CourseTable title={`Cursos mais procurados · ${scopeName}`} rows={topCourses} show={show} />
          {show && <CourseTable title="Em alta na semana" rows={risingCourses} show={show} rising />}
        </section>

        {selectedCompany && (
          <section className={card + " overflow-x-auto"}>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Pessoas · {selectedCompany.name}
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                  {["Nome", "Matriculado em", "Iniciou", "Cursos concl.", "Outros concl.", "Última atividade"].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedCompany.userRows.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0">
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{u.name}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{u.enrolled}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{u.started}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{u.courses}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{u.others}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {u.lastActivityAt ? formatDate(u.lastActivityAt.slice(0, 10)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Base: API Twygo (usuários, conteúdos e atividades), lida em {formatDate(current.date)}. A API não informa
          login: quem só navegou na Central de Conhecimento não aparece. “Cursos concluídos” = conteúdos do tipo
          Curso finalizados (a Twygo não expõe certificados pela API).
        </p>
      </main>
    </div>
  );
}

function Sup({ value }: { value: number }) {
  return (
    <sup className={"ml-1 text-xs font-medium " + (value > 0 ? "text-emerald-600" : "text-red-600")}>
      {value > 0 ? `+${value}` : value}
    </sup>
  );
}

function Kpi({
  label,
  value,
  of,
  hint,
  delta,
  show,
  unit,
}: {
  label: string;
  value: number | string;
  of?: number;
  hint?: string;
  delta: number;
  show: boolean;
  unit?: string;
}) {
  return (
    <div className={card}>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 mt-1">
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
        {of !== undefined && (
          <span className="text-base font-normal text-zinc-400 dark:text-zinc-500"> / {of}</span>
        )}
      </p>
      {hint && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{hint}</p>}
      <div className="mt-1">
        <Delta value={delta} show={show} unit={unit} />
      </div>
    </div>
  );
}

function CourseTable({
  title,
  rows,
  show,
  rising,
}: {
  title: string;
  rows: CourseDiff[];
  show: boolean;
  rising?: boolean;
}) {
  return (
    <div className={card}>
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sem dados.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <th className="py-2 font-medium">Conteúdo</th>
              <th className="py-2 font-medium text-right">Matric.</th>
              <th className="py-2 font-medium text-right">Iniciaram</th>
              <th className="py-2 font-medium text-right">Concluíram</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.contentId} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0">
                <td className="py-2 pr-2 text-zinc-900 dark:text-zinc-50">
                  {c.name ?? <span className="text-zinc-400">Conteúdo fora do catálogo (#{c.contentId})</span>}
                </td>
                <td className="py-2 text-right text-zinc-600 dark:text-zinc-400">
                  {c.enrolled}
                  {show && c.dEnrolled !== 0 && <Sup value={c.dEnrolled} />}
                </td>
                <td className="py-2 text-right text-zinc-600 dark:text-zinc-400">
                  {c.started}
                  {show && c.dStarted !== 0 && <Sup value={c.dStarted} />}
                </td>
                <td className="py-2 text-right text-zinc-600 dark:text-zinc-400">
                  {c.concluded}
                  {show && c.dConcluded !== 0 && <Sup value={c.dConcluded} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {rising && (
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">Ordenado pela soma das novas matrículas, inícios e conclusões.</p>
      )}
    </div>
  );
}
