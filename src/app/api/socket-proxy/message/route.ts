import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { env } from '@/env';
import { db } from '@/server/db';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const cookie = req.headers.get('cookie') || '';
    // Try to verify access_token cookie and compute admin on the server (trusted)
    let verifiedSub: string | null = null;
    let verifiedEmail: string | null = null;
    let verifiedAdmin: boolean | null = null;
    try {
      const tokenMatch = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('access_token='));
      const access = tokenMatch ? tokenMatch.replace('access_token=', '') : null;
      if (access) {
        const decoded = jwt.verify(access, env.AUTH_SECRET || 'dev-secret') as any;
        if (decoded && typeof decoded === 'object') {
          verifiedSub = decoded.sub ? String(decoded.sub) : null;
          verifiedEmail = decoded.email ? String(decoded.email) : null;
          if (verifiedSub) {
            const rows: Array<{ isAdmin: number }>
              = await db.$queryRaw`SELECT isAdmin FROM User WHERE id = ${verifiedSub} LIMIT 1`;
            verifiedAdmin = Array.isArray(rows) && rows[0] ? Boolean(rows[0].isAdmin) : false;
          }
        }
      }
    } catch { /* ignore and allow fallback on socket server */ }

    const resp = await fetch('http://localhost:8080/api/message', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // forward auth cookies so socket server can derive admin from JWT
        'cookie': cookie,
        // forward trusted verification headers if available
        ...(verifiedSub ? { 'x-verified-user-id': verifiedSub } : {}),
        ...(verifiedEmail ? { 'x-verified-email': verifiedEmail } : {}),
        ...(verifiedAdmin !== null ? { 'x-verified-admin': String(verifiedAdmin) } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await resp.text();
    const contentType = resp.headers.get('content-type') || 'application/json';
    return new NextResponse(data, { status: resp.status, headers: { 'content-type': contentType } });
  } catch (err: any) {
    console.error('socket proxy error', err);
    return NextResponse.json({ error: 'socket proxy failed' }, { status: 502 });
  }
}
