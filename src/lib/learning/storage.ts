import { promises as fs } from "node:fs";
import path from "node:path";
import { get, list, put } from "@vercel/blob";
import type { Snapshot } from "./types";

const PREFIX = "learning-snapshots/";
const LOCAL_DIR = path.join(process.cwd(), ".snapshots");
const BLOB_ACCESS = (process.env.BLOB_ACCESS === "public" ? "public" : "private") as
  | "public"
  | "private";

// Na Vercel o Store pode vir por token (BLOB_READ_WRITE_TOKEN) ou por OIDC (BLOB_STORE_ID).
const useBlob = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

export function storageMode(): "blob" | "local" {
  return useBlob() ? "blob" : "local";
}

export async function saveSnapshot(snapshot: Snapshot): Promise<void> {
  const body = JSON.stringify(snapshot);
  if (useBlob()) {
    await put(`${PREFIX}${snapshot.date}.json`, body, {
      access: BLOB_ACCESS,
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, `${snapshot.date}.json`), body, "utf8");
}

/** Datas dos snapshots salvos, da mais recente para a mais antiga. */
export async function listSnapshotDates(): Promise<string[]> {
  if (useBlob()) {
    const dates: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: PREFIX, cursor });
      for (const blob of page.blobs) {
        const match = blob.pathname.match(/(\d{4}-\d{2}-\d{2})\.json$/);
        if (match) dates.push(match[1]);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return dates.sort().reverse();
  }
  try {
    const files = await fs.readdir(LOCAL_DIR);
    return files
      .map((f) => f.match(/^(\d{4}-\d{2}-\d{2})\.json$/)?.[1])
      .filter((d): d is string => !!d)
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export async function loadSnapshot(date: string): Promise<Snapshot | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (useBlob()) {
    const result = await get(`${PREFIX}${date}.json`, {
      access: BLOB_ACCESS,
      useCache: false,
    });
    if (!result || result.statusCode !== 200) return null;
    return JSON.parse(await new Response(result.stream).text()) as Snapshot;
  }
  try {
    return JSON.parse(await fs.readFile(path.join(LOCAL_DIR, `${date}.json`), "utf8")) as Snapshot;
  } catch {
    return null;
  }
}
