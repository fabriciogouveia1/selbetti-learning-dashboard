export type UserSnap = {
  id: number;
  name: string;
  /** Conteúdos em que a pessoa está matriculada. */
  enrolled: number;
  /** Conteúdos que ela iniciou. */
  started: number;
  /** Cursos do catálogo concluídos (proxy de certificado). */
  courses: number;
  /** Outros conteúdos concluídos (microconteúdos, cases, PDFs...). */
  others: number;
  lastActivityAt: string | null;
};

export type CompanySnap = {
  key: string;
  name: string;
  cadastro: string;
  users: number;
  enrolledUsers: number;
  startedUsers: number;
  /** Pessoas que concluíram ao menos 1 conteúdo (de qualquer tipo). */
  concludedUsers: number;
  courses: number;
  others: number;
  hours: number;
  lastActivityAt: string | null;
  userRows: UserSnap[];
  /** Conteúdos em que as pessoas desta empresa estão matriculadas. */
  courseRows: CourseSnap[];
};

export type CourseSnap = {
  contentId: number;
  /** null = conteúdo fora do catálogo (microconteúdo etc.). */
  name: string | null;
  enrolled: number;
  started: number;
  concluded: number;
};

export type Totals = {
  companies: number;
  companiesWithUsers: number;
  companiesEnrolled: number;
  users: number;
  enrolled: number;
  started: number;
  concludedAny: number;
  courses: number;
  others: number;
  hours: number;
};

export type Snapshot = {
  /** Dia do snapshot em America/Sao_Paulo (YYYY-MM-DD). */
  date: string;
  generatedAt: string;
  totals: Totals;
  licenses: {
    contracted: number;
    used: number;
    available: number;
    internal: number;
    external: number;
  };
  companies: CompanySnap[];
  /** Empresas na Twygo que não estão em pilot-clients.ts (cliente novo?). */
  unmapped: { name: string; users: number }[];
};

export type ClientStatus = "Engajado" | "Iniciando" | "Sem uso" | "Onboarding" | "Sem cadastro";
