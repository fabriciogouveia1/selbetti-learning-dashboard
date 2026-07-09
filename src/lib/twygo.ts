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

export function listActivitiesAttendees(params?: Record<string, string>) {
  return twygoFetch<unknown>("/activities_attendees", params);
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
