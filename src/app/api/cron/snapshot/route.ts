import { NextResponse } from "next/server";
import { computeSnapshot } from "@/lib/learning/compute";
import { saveSnapshot } from "@/lib/learning/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Chamado pelo Vercel Cron (ver vercel.json). A Vercel envia
// "Authorization: Bearer $CRON_SECRET" automaticamente.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  try {
    const snapshot = await computeSnapshot();
    await saveSnapshot(snapshot);
    return NextResponse.json({ ok: true, date: snapshot.date });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
