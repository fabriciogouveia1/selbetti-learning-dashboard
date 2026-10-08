import {
  listAllActivitiesAttendees,
  listAllContents,
  listAllUsers,
  parseHoursToDecimal,
  type TwygoContent,
} from "@/lib/twygo";
import {
  NON_PILOT_ENTERPRISES,
  PILOT_CLIENTS,
  findPilotClient,
  normalize,
} from "@/data/pilot-clients";
import { totalsFor } from "./aggregate";
import type { ClientStatus, CompanySnap, CourseSnap, Snapshot, UserSnap } from "./types";

/** Dias após o cadastro em que um cliente sem progresso passa de "Onboarding" para "Sem uso". */
export const ONBOARDING_DAYS = 14;

export function todayInSaoPaulo(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function daysBetween(fromDate: string, toDate: string): number {
  const ms = Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function classifyClient(company: CompanySnap, date: string): ClientStatus {
  if (company.users === 0) return "Sem cadastro";
  if (company.courses >= 1) return "Engajado";
  if (company.startedUsers >= 1) return "Iniciando";
  return daysBetween(company.cadastro, date) < ONBOARDING_DAYS ? "Onboarding" : "Sem uso";
}

function maxIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

// Conta como "curso concluído" (proxy de certificado) só o que é do tipo Curso
// no catálogo. Microconteúdos, cases e PDFs entram em "outros".
function isCertificateLike(content: TwygoContent | undefined): content is TwygoContent {
  return !!content && content.content_type === "course" && content.learning_experience?.name === "Curso";
}

export async function computeSnapshot(now = new Date()): Promise<Snapshot> {
  const [users, contents, activities] = await Promise.all([
    listAllUsers(),
    listAllContents(),
    listAllActivitiesAttendees(),
  ]);

  const date = todayInSaoPaulo(now);
  const contentById = new Map(contents.map((c) => [c.content_id, c]));

  // (usuário, conteúdo) -> linhas de atividade
  const pairs = new Map<string, typeof activities>();
  for (const row of activities) {
    const key = `${row.user_id}:${row.content_id}`;
    const list = pairs.get(key);
    if (list) list.push(row);
    else pairs.set(key, [row]);
  }

  // usuário -> estatísticas
  type UserAcc = UserSnap;
  const userAcc = new Map<number, UserAcc>();
  const hoursByUser = new Map<number, number>();
  const courseAcc = new Map<string, CourseSnap>();
  const pilotUserIds = new Set<number>();

  const companyByUser = new Map<number, string>();
  const companies = new Map<string, CompanySnap>();
  for (const client of PILOT_CLIENTS) {
    companies.set(client.key, {
      key: client.key,
      name: client.name,
      cadastro: client.cadastro,
      users: 0,
      enrolledUsers: 0,
      startedUsers: 0,
      concludedUsers: 0,
      courses: 0,
      others: 0,
      hours: 0,
      lastActivityAt: null,
      userRows: [],
      courseRows: [],
    });
  }

  const unmapped = new Map<string, number>();
  for (const user of users) {
    const client = findPilotClient(user.enterprise);
    if (client) {
      companyByUser.set(user.user_id, client.key);
      pilotUserIds.add(user.user_id);
      userAcc.set(user.user_id, {
        id: user.user_id,
        name: user.name.trim(),
        enrolled: 0,
        started: 0,
        courses: 0,
        others: 0,
        lastActivityAt: null,
      });
      continue;
    }
    const enterprise = (user.enterprise ?? "").trim();
    const norm = normalize(enterprise);
    const isKnownNonPilot = NON_PILOT_ENTERPRISES.some((n) => norm === n);
    if (!isKnownNonPilot) {
      const label = enterprise || `Sem empresa (${user.email.split("@")[1] ?? "?"})`;
      unmapped.set(label, (unmapped.get(label) ?? 0) + 1);
    }
  }

  for (const [pairKey, rows] of pairs) {
    const [userId, contentId] = pairKey.split(":").map(Number);
    if (!pilotUserIds.has(userId)) continue;
    const acc = userAcc.get(userId)!;
    const content = contentById.get(contentId);
    const started = rows.some((r) => r.started_at);
    const concluded = rows.every((r) => r.concluded_at);

    acc.enrolled += 1;
    if (started) acc.started += 1;
    for (const r of rows) {
      acc.lastActivityAt = maxIso(acc.lastActivityAt, maxIso(r.started_at, r.concluded_at));
    }
    if (concluded) {
      if (isCertificateLike(content)) {
        acc.courses += 1;
        hoursByUser.set(
          userId,
          (hoursByUser.get(userId) ?? 0) + parseHoursToDecimal(content.hours)
        );
      } else {
        acc.others += 1;
      }
    }

    const courseKey = `${companyByUser.get(userId)}:${contentId}`;
    const course =
      courseAcc.get(courseKey) ??
      ({ contentId, name: content?.name ?? null, enrolled: 0, started: 0, concluded: 0 } satisfies CourseSnap);
    course.enrolled += 1;
    if (started) course.started += 1;
    if (concluded) course.concluded += 1;
    courseAcc.set(courseKey, course);
  }

  for (const [userId, acc] of userAcc) {
    const company = companies.get(companyByUser.get(userId)!)!;
    company.users += 1;
    if (acc.enrolled > 0) company.enrolledUsers += 1;
    if (acc.started > 0) company.startedUsers += 1;
    if (acc.courses + acc.others > 0) company.concludedUsers += 1;
    company.courses += acc.courses;
    company.others += acc.others;
    company.hours += hoursByUser.get(userId) ?? 0;
    company.lastActivityAt = maxIso(company.lastActivityAt, acc.lastActivityAt);
    company.userRows.push(acc);
  }

  for (const [courseKey, course] of courseAcc) {
    companies.get(courseKey.split(":")[0])!.courseRows.push(course);
  }

  const companyList = Array.from(companies.values()).map((c) => ({
    ...c,
    hours: Math.round(c.hours * 10) / 10,
    userRows: c.userRows.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    courseRows: c.courseRows.sort((a, b) => b.enrolled - a.enrolled),
  }));

  const totals = totalsFor(companyList);

  const activeUsers = users.filter((u) => u.situation === "active");
  const internal = activeUsers.filter((u) => normalize(u.enterprise ?? "") === "selbetti").length;
  const contracted = Number(process.env.TOTAL_LICENSES_CONTRACTED ?? 0);

  return {
    date,
    generatedAt: now.toISOString(),
    totals,
    licenses: {
      contracted,
      used: activeUsers.length,
      available: Math.max(contracted - activeUsers.length, 0),
      internal,
      external: activeUsers.length - internal,
    },
    companies: companyList,
    unmapped: Array.from(unmapped.entries())
      .map(([name, count]) => ({ name, users: count }))
      .sort((a, b) => b.users - a.users),
  };
}

let liveCache: { at: number; snapshot: Snapshot } | null = null;
const LIVE_TTL_MS = 120_000;

/** Snapshot do estado atual com cache de 2 min (usado pela tela, para filtros rápidos). */
export async function getLiveSnapshot(): Promise<Snapshot> {
  if (liveCache && Date.now() - liveCache.at < LIVE_TTL_MS) return liveCache.snapshot;
  const snapshot = await computeSnapshot();
  liveCache = { at: Date.now(), snapshot };
  return snapshot;
}
