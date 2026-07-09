import { NextResponse } from "next/server";
import { enrollParticipants } from "@/lib/twygo";

export async function POST(request: Request) {
  const body = await request.json();
  const { contentIds, email, firstName, lastName } = body as {
    contentIds: number[];
    email: string;
    firstName: string;
    lastName: string;
  };

  if (!contentIds?.length || !email || !firstName || !lastName) {
    return NextResponse.json(
      { ok: false, error: "Preencha curso, e-mail, nome e sobrenome." },
      { status: 400 }
    );
  }

  try {
    const result = await enrollParticipants(contentIds, [
      { email, first_name: firstName, last_name: lastName },
    ]);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
