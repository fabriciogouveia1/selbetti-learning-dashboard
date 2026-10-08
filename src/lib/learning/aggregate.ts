import type { CompanySnap, CourseSnap, Snapshot, Totals } from "./types";

export function totalsFor(companies: CompanySnap[]): Totals {
  const sum = (pick: (c: CompanySnap) => number) => companies.reduce((s, c) => s + pick(c), 0);
  return {
    companies: companies.length,
    companiesWithUsers: companies.filter((c) => c.users > 0).length,
    companiesEnrolled: companies.filter((c) => c.enrolledUsers > 0).length,
    users: sum((c) => c.users),
    enrolled: sum((c) => c.enrolledUsers),
    started: sum((c) => c.startedUsers),
    concludedAny: sum((c) => c.concludedUsers),
    courses: sum((c) => c.courses),
    others: sum((c) => c.others),
    hours: Math.round(sum((c) => c.hours) * 10) / 10,
  };
}

/** Soma os conteúdos de várias empresas, do mais matriculado para o menos. */
export function coursesFor(companies: CompanySnap[]): CourseSnap[] {
  const byId = new Map<number, CourseSnap>();
  for (const company of companies) {
    for (const row of company.courseRows ?? []) {
      const acc = byId.get(row.contentId);
      if (acc) {
        acc.enrolled += row.enrolled;
        acc.started += row.started;
        acc.concluded += row.concluded;
      } else {
        byId.set(row.contentId, { ...row });
      }
    }
  }
  return Array.from(byId.values()).sort((a, b) => b.enrolled - a.enrolled);
}

/** Visão do snapshot restrita a uma empresa (ou todas, se key for null). */
export function scopeSnapshot(snapshot: Snapshot, companyKey: string | null): Snapshot {
  if (!companyKey) return snapshot;
  const companies = snapshot.companies.filter((c) => c.key === companyKey);
  return { ...snapshot, companies, totals: totalsFor(companies) };
}
