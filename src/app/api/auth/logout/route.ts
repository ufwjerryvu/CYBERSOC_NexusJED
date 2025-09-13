import { NextResponse } from "next/server";
import { env } from "@/env";
import { db } from "@/server/db";

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.split(';').map(c=>c.trim()).find(c=>c.startsWith('refresh_token='));
    const token = match ? match.replace('refresh_token=', '') : null;

    if (token) {
      try {
        await db.$executeRaw`UPDATE RefreshToken SET revoked = 1 WHERE token = ${token}`;
      } catch (e) {
        // ignore DB errors during logout
      }
    }

    const res = NextResponse.json({ ok: true });
    const secure = env.NODE_ENV === 'production';

    res.cookies.set({ name: 'access_token', value: '', httpOnly: true, path: '/', sameSite: 'lax', secure, maxAge: 0 });
    res.cookies.set({ name: 'refresh_token', value: '', httpOnly: true, path: '/', sameSite: 'lax', secure, maxAge: 0 });

    return res;
  } catch (err) {
    console.error('logout error', err);
    const res = NextResponse.json({ ok: false }, { status: 500 });
    return res;
  }
}
