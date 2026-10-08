import { coursesFor, totalsFor } from "./aggregate";
import type { CompanySnap, CourseSnap, Snapshot, Totals, UserSnap } from "./types";

export type MoveKind = "novo" | "matriculou" | "iniciou" | "avancou" | "concluiu";

export type UserMove = {
  companyKey: string;
  company: string;
  user: string;
  kind: MoveKind;
  detail: string;
};

export type CompanyDiff = {
  dUsers: number;
  dEnrolledUsers: number;
  dStartedUsers: number;
  dConcludedUsers: number;
  dCourses: number;
  dOthers: number;
  dHours: number;
  isNewClient: boolean;
  moves: UserMove[];
  note: string;
};

export type CourseDiff = CourseSnap & {
  dEnrolled: number;
  dStarted: number;
  dConcluded: number;
};

export type SnapshotDiff = {
  hasBase: boolean;
  totals: Record<keyof Totals, number>;
  licensesUsed: number;
  companies: Record<string, CompanyDiff>;
  moves: UserMove[];
  newClients: string[];
  courses: CourseDiff[];
};

const EMPTY_USER: Omit<UserSnap, "id" | "name"> = {
  enrolled: 0,
  started: 0,
  courses: 0,
  others: 0,
  lastActivityAt: null,
};

function userMoves(company: CompanySnap, prev: CompanySnap | undefined): UserMove[] {
  const moves: UserMove[] = [];
  const prevUsers = new Map((prev?.userRows ?? []).map((u) => [u.id, u]));
  for (const user of company.userRows) {
    const before = prevUsers.get(user.id);
    const base = { companyKey: company.key, company: company.name, user: user.name };
    if (!before) {
      moves.push({ ...base, kind: "novo", detail: "Novo usuário cadastrado" });
    }
    const b = before ?? { ...EMPTY_USER, id: user.id, name: user.name };
    const dConcluded = user.courses + user.others - (b.courses + b.others);
    if (dConcluded > 0) {
      moves.push({
        ...base,
        kind: "concluiu",
        detail:
          user.courses > b.courses
            ? `Concluiu ${user.courses - b.courses} curso(s)`
            : `Concluiu ${dConcluded} conteúdo(s)`,
      });
    } else if (b.started === 0 && user.started > 0) {
      moves.push({ ...base, kind: "iniciou", detail: "Passou a ter progresso (antes sem uso)" });
    } else if (user.started > b.started) {
      moves.push({ ...base, kind: "avancou", detail: "Iniciou um novo conteúdo" });
    } else if (b.enrolled === 0 && user.enrolled > 0) {
      moves.push({ ...base, kind: "matriculou", detail: "Fez a 1ª matrícula (ainda sem iniciar)" });
    } else if (user.enrolled > b.enrolled) {
      moves.push({ ...base, kind: "matriculou", detail: "Matriculou-se em novo conteúdo" });
    }
  }
  return moves;
}

function companyNote(company: CompanySnap, d: Omit<CompanyDiff, "note">): string {
  if (d.isNewClient) return "Cliente novo na semana";
  if (d.moves.length === 0) return "Sem atividade";
  const parts: string[] = [];
  if (d.dCourses > 0) parts.push(`+${d.dCourses} curso(s) concluído(s)`);
  else if (d.dConcludedUsers > 0) parts.push("Novo conteúdo concluído");
  if (d.dStartedUsers > 0) parts.push(`+${d.dStartedUsers} com progresso`);
  if (d.dEnrolledUsers > 0) parts.push(`+${d.dEnrolledUsers} matriculado(s)`);
  if (d.dUsers > 0) parts.push(`+${d.dUsers} usuário(s)`);
  return parts.length ? parts.join(" · ") : "Avanço em conteúdos";
}

export function diffSnapshots(current: Snapshot, base: Snapshot | null): SnapshotDiff {
  const prevCompanies = new Map((base?.companies ?? []).map((c) => [c.key, c]));
  const companies: Record<string, CompanyDiff> = {};
  const allMoves: UserMove[] = [];
  const newClients: string[] = [];

  for (const company of current.companies) {
    const prev = prevCompanies.get(company.key);
    const isNewClient = !!base && (prev?.users ?? 0) === 0 && company.users > 0;
    const moves = base ? userMoves(company, prev) : [];
    const partial = {
      dUsers: company.users - (prev?.users ?? 0),
      dEnrolledUsers: company.enrolledUsers - (prev?.enrolledUsers ?? 0),
      dStartedUsers: company.startedUsers - (prev?.startedUsers ?? 0),
      dConcludedUsers: company.concludedUsers - (prev?.concludedUsers ?? 0),
      dCourses: company.courses - (prev?.courses ?? 0),
      dOthers: company.others - (prev?.others ?? 0),
      dHours: Math.round((company.hours - (prev?.hours ?? 0)) * 10) / 10,
      isNewClient,
      moves,
    };
    companies[company.key] = {
      ...partial,
      note: base ? companyNote(company, partial) : "—",
    };
    allMoves.push(...moves);
    if (isNewClient) newClients.push(company.name);
  }

  const t = totalsFor(current.companies);
  const p = base ? totalsFor(base.companies) : undefined;
  const totals = Object.fromEntries(
    (Object.keys(t) as (keyof Totals)[]).map((k) => [k, base ? t[k] - (p?.[k] ?? 0) : 0])
  ) as Record<keyof Totals, number>;

  const prevCourses = new Map(coursesFor(base?.companies ?? []).map((c) => [c.contentId, c]));
  const courses: CourseDiff[] = coursesFor(current.companies).map((c) => {
    const before = prevCourses.get(c.contentId);
    return {
      ...c,
      dEnrolled: base ? c.enrolled - (before?.enrolled ?? 0) : 0,
      dStarted: base ? c.started - (before?.started ?? 0) : 0,
      dConcluded: base ? c.concluded - (before?.concluded ?? 0) : 0,
    };
  });

  return {
    hasBase: !!base,
    totals,
    licensesUsed: base ? current.licenses.used - base.licenses.used : 0,
    companies,
    moves: allMoves,
    newClients,
    courses,
  };
}
