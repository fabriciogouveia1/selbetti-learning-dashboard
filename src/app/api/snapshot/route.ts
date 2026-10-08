import { NextResponse } from "next/server";
import { computeSnapshot } from "@/lib/learning/compute";
import { saveSnapshot } from "@/lib/learning/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Snapshot manual (botão "Salvar snapshot agora"). Protegido pelo login do
// dashboard (middleware).
export async function POST() {
  try {
    const snapshot = await computeSnapshot();
    await saveSnapshot(snapshot);
    return NextResponse.json({ ok: true, date: snapshot.date });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
