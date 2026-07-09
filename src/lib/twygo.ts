const BASE_URL = process.env.TWYGO_API_BASE_URL as string;
const API_KEY = process.env.TWYGO_API_KEY as string;

async function twygoFetch<T>(
  path: string,
  params?: Record<string, string>,
  init?: RequestInit
): Promise<T> {
  const url = new URL(BASE_URL + path);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Twygo API error ${res.status} on ${path}: ${body}`);
  }

  return res.json();
}

export type Pagination = {
  next_page: number | null;
  previous_page: number | null;
  current_page: number;
  total_pages: number;
  total_entries: number;
};

export type TwygoContent = {
  content_id: number;
  content_type: string;
  name: string;
  situation: string;
  hours: string;
  synchronism: string;
  link: string;
  categories: { category_id: number; name: string }[];
  learning_experience: { name: string };
  activities?: { activity_id: number; activity_type: string; situation: string }[];
};

export type TwygoActivityAttendee = {
  activity_attendee_id: number;
  user_id: number;
  content_id: number;
  activity_id: number;
  started_at: string | null;
  concluded_at: string | null;
};

export type TwygoUser = {
  user_id: number;
  name: string;
  email: string;
  situation?: string;
  is_manager?: boolean;
  department?: string | null;
  created_at?: string;
};

export function listContentsPage(params?: Record<string, string>) {
  return twygoFetch<{ data: { pagination: Pagination; contents: TwygoContent[] } }>(
    "/contents",
    params
  );
}

export function listUsersPage(params?: Record<string, string>) {
  return twygoFetch<{ data: { pagination: Pagination; users: TwygoUser[] } }>(
    "/users",
    params
  );
}

export async function listAllContents(): Promise<TwygoContent[]> {
  const first = await listContentsPage({ per_page: "100", page: "1" });
  const all = [...first.data.contents];
  const totalPages = first.data.pagination.total_pages;

  for (let page = 2; page <= totalPages; page++) {
    const next = await listContentsPage({ per_page: "100", page: String(page) });
    all.push(...next.data.contents);
  }

  return all;
}

export async function listAllUsers(): Promise<TwygoUser[]> {
  const first = await listUsersPage({ per_page: "100", page: "1" });
  const all = [...first.data.users];
  const totalPages = first.data.pagination.total_pages;

  for (let page = 2; page <= totalPages; page++) {
    const next = await listUsersPage({ per_page: "100", page: String(page) });
    all.push(...next.data.users);
  }

  return all;
}

export function listAttendees(params?: Record<string, string>) {
  return twygoFetch<unknown>("/attendees", params);
}

export function listActivitiesAttendeesPage(params?: Record<string, string>) {
  return twygoFetch<{
    data: { pagination: Pagination; activities_attendees: TwygoActivityAttendee[] };
  }>("/activities_attendees", params);
}

export async function listAllActivitiesAttendees(): Promise<TwygoActivityAttendee[]> {
  const first = await listActivitiesAttendeesPage({ per_page: "100", page: "1" });
  const all = [...first.data.activities_attendees];
  const totalPages = first.data.pagination.total_pages;

  for (let page = 2; page <= totalPages; page++) {
    const next = await listActivitiesAttendeesPage({ per_page: "100", page: String(page) });
    all.push(...next.data.activities_attendees);
  }

  return all;
}

export function parseHoursToDecimal(hours: string): number {
  const [h, m, s] = hours.split(":").map(Number);
  if ([h, m, s].some((n) => Number.isNaN(n))) return 0;
  return h + m / 60 + s / 3600;
}

export type ExecutiveOverview = {
  totalCourses: number;
  totalTrilhas: number;
  totalPacotes: number;
  totalHoursAvailable: number;
  totalUsers: number;
  completionRate: number;
  neverWatchedCourses: number;
  trilhaEngagement: { name: string; pct: number }[];
};

export async function getExecutiveOverview(): Promise<ExecutiveOverview> {
  const [contents, users, activitiesAttendees] = await Promise.all([
    listAllContents(),
    listAllUsers(),
    listAllActivitiesAttendees(),
  ]);

  const courses = contents.filter((c) => c.content_type === "course");
  const trilhas = contents.filter((c) => c.content_type === "learning_path");
  const pacotes = contents.filter((c) => c.content_type === "package");

  const totalHoursAvailable = courses.reduce(
    (sum, c) => sum + parseHoursToDecimal(c.hours),
    0
  );

  const completionRate =
    activitiesAttendees.length === 0
      ? 0
      : activitiesAttendees.filter((a) => a.concluded_at).length /
        activitiesAttendees.length;

  const contentIdsWithActivity = new Set(activitiesAttendees.map((a) => a.content_id));
  const neverWatchedCourses = courses.filter(
    (c) => !contentIdsWithActivity.has(c.content_id)
  ).length;

  // Em trilhas/pacotes, `activities[].activity_id` é, na prática, o
  // content_id dos cursos que compõem a trilha (não o activity_id de
  // rastreamento individual usado em /activities_attendees).
  const concludedContentIds = new Set(
    activitiesAttendees.filter((a) => a.concluded_at).map((a) => a.content_id)
  );

  const trilhaEngagement = trilhas
    .map((t) => {
      const courseIds = t.activities?.map((a) => a.activity_id) ?? [];
      if (courseIds.length === 0) return { name: t.name, pct: 0 };
      const concludedCount = courseIds.filter((id) => concludedContentIds.has(id)).length;
      return { name: t.name, pct: Math.round((concludedCount / courseIds.length) * 100) };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  return {
    totalCourses: courses.length,
    totalTrilhas: trilhas.length,
    totalPacotes: pacotes.length,
    totalHoursAvailable: Math.round(totalHoursAvailable),
    totalUsers: users.length,
    completionRate: Math.round(completionRate * 100),
    neverWatchedCourses,
    trilhaEngagement,
  };
}

export function listQuestionnaires(params?: Record<string, string>) {
  return twygoFetch<unknown>("/questionnaires", params);
}

export type EnrollParticipant = {
  email: string;
  first_name: string;
  last_name: string;
};

export type EnrollResult = {
  participants: {
    contents: Record<
      string,
      {
        error: unknown[];
        success: { email: string; cpf?: string; content_id: number }[];
      }
    >;
  };
};

export function enrollParticipants(contentIds: number[], participants: EnrollParticipant[]) {
  return twygoFetch<EnrollResult>("/attendees", undefined, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content_ids: contentIds,
      participants,
    }),
  });
}
