import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { env } from "@/env";
import { db } from "@/server/db";

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.split(';').map(c=>c.trim()).find(c=>c.startsWith('refresh_token='));
    const token = match ? match.replace('refresh_token=', '') : null;

    if (!token) return NextResponse.json({ ok: false, error: 'Missing refresh token' }, { status: 401 });

    let decoded: any;
    try { decoded = jwt.verify(token, env.AUTH_SECRET || 'dev-secret') as any; } catch (err) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 });
    }

    // check DB for stored token
    const rows: Array<any> = await db.$queryRaw`SELECT id, token, userId, revoked, expiresAt FROM RefreshToken WHERE token = ${token} LIMIT 1`;
    if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 });

    const dbToken = rows[0];
    if (dbToken.revoked) return NextResponse.json({ ok: false, error: 'Token revoked' }, { status: 401 });
    if (new Date(dbToken.expiresAt) < new Date()) return NextResponse.json({ ok: false, error: 'Token expired' }, { status: 401 });
    if (dbToken.userId !== decoded.sub) return NextResponse.json({ ok: false, error: 'Invalid token user' }, { status: 401 });

    // revoke old token
    await db.$executeRaw`UPDATE RefreshToken SET revoked = 1 WHERE id = ${dbToken.id}`;

  // fetch user email for access token payload
  const userRows: Array<any> = await db.$queryRaw`SELECT email FROM User WHERE id = ${decoded.sub} LIMIT 1`;
  const userEmail = Array.isArray(userRows) && userRows[0] ? userRows[0].email : null;

  // issue new tokens
  const accessToken = jwt.sign({ sub: decoded.sub, email: userEmail }, env.AUTH_SECRET || 'dev-secret', { expiresIn: '15m' });
    const newRefresh = jwt.sign({ sub: decoded.sub }, env.AUTH_SECRET || 'dev-secret', { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.$executeRaw`INSERT INTO RefreshToken (id, token, userId, revoked, expiresAt, createdAt) VALUES (cuid(), ${newRefresh}, ${decoded.sub}, 0, ${expiresAt.toISOString()}, datetime('now'))`;

    const res = NextResponse.json({ ok: true });
    const secure = env.NODE_ENV === 'production';
    res.cookies.set({ name: 'access_token', value: accessToken, httpOnly: true, path: '/', sameSite: 'lax', secure, maxAge: 15 * 60 });
    res.cookies.set({ name: 'refresh_token', value: newRefresh, httpOnly: true, path: '/', sameSite: 'lax', secure, maxAge: 7 * 24 * 60 * 60 });

    return res;
  } catch (err) {
    console.error('refresh error', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
