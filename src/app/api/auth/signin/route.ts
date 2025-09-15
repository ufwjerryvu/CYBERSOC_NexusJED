import { NextResponse } from "next/server";
import { db } from "@/server/db";
import jwt from "jsonwebtoken";
import { env } from "@/env";
import { randomUUID } from 'crypto';
// dynamically import bcrypt at runtime to avoid TS declaration errors in some environments
let bcrypt: typeof import("bcrypt");

async function getBcrypt() {
  if (!bcrypt) bcrypt = (await import("bcrypt")) as typeof import("bcrypt");
  return bcrypt;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : undefined;
    const password = typeof body?.password === 'string' ? body.password : undefined;

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Missing email or password' }, { status: 400 });
    }

    // find user case-insensitively
    const rows: Array<{ id: string; password: string | null }> = await db.$queryRaw`
      SELECT id, password FROM User WHERE lower(email) = lower(${email}) LIMIT 1`;

    if (!Array.isArray(rows) || rows.length === 0) {
      // do not reveal which part failed
      return NextResponse.json({ ok: false, authenticated: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const user = rows[0];

    if (!user || !user.password) {
      return NextResponse.json({ ok: false, authenticated: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const b = await getBcrypt();
    const match = await b.compare(password, user.password);

    if (!match) {
      return NextResponse.json({ ok: false, authenticated: false, error: 'Invalid credentials' }, { status: 401 });
    }

      // create JWT access token (short-lived) and refresh token (longer-lived)
      const accessToken = jwt.sign({ sub: user.id, email }, env.AUTH_SECRET || "dev-secret", { expiresIn: '15m' });
    const refreshToken = jwt.sign({ sub: user.id }, env.AUTH_SECRET || "dev-secret", { expiresIn: '7d' });

    // persist refresh token server-side
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  // persist refresh token via raw SQL to avoid needing prisma generate in this session
  const rtId = randomUUID();
  const createdAt = new Date().toISOString();
  await db.$executeRaw`INSERT INTO RefreshToken (id, token, userId, revoked, expiresAt, createdAt) VALUES (${rtId}, ${refreshToken}, ${user.id}, 0, ${expiresAt.toISOString()}, ${createdAt})`;

    // set HttpOnly cookies
    const res = NextResponse.json({ ok: true, authenticated: true });

    // cookie options: HttpOnly, Secure in production, Path=/, SameSite=Lax
    const secure = env.NODE_ENV === 'production';

    res.cookies.set({ name: 'access_token', value: accessToken, httpOnly: true, path: '/', sameSite: 'lax', secure, maxAge: 15 * 60 });
    res.cookies.set({ name: 'refresh_token', value: refreshToken, httpOnly: true, path: '/', sameSite: 'lax', secure, maxAge: 7 * 24 * 60 * 60 });

    return res;
  } catch (err) {
    console.error('signin error', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
