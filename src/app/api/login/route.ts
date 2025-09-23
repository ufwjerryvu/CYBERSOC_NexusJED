import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null) as
      | { email?: unknown; password?: unknown }
      | null;

    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ ok: false, message: "Invalid request" }, { status: 400 });
    }

    const { email, password } = body;

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
    }

    if (user.password !== password) {
      return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
