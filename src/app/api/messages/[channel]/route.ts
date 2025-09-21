import { NextResponse } from "next/server";
import { db } from "@/server/db";
import jwt from "jsonwebtoken";
import { env } from "@/env";
import { randomUUID } from "node:crypto";

function getAccessToken(req: Request): string | null {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('access_token='));
  return match ? match.replace('access_token=', '') : null;
}

function requireAuth(req: Request): { sub: string; email?: string } | null {
  const token = getAccessToken(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, env.AUTH_SECRET || 'dev-secret') as any;
    if (!decoded || !decoded.sub) return null;
    return { sub: String(decoded.sub), email: decoded.email ? String(decoded.email) : undefined };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const limitRaw = url.searchParams.get('limit');
  const before = url.searchParams.get('before');
  const limit = Math.max(1, Math.min(Number(limitRaw ?? 15) || 15, 50));
  // Derive channel from URL path to avoid async params usage
  const pathParts = url.pathname.split('/').filter(Boolean);
  const messagesIdx = pathParts.findIndex(p => p === 'messages');
  const channelPart = messagesIdx >= 0 ? pathParts[messagesIdx + 1] : null;
  const channel = (channelPart || 'general').toLowerCase();

  try {
    // Build SQL with parameter binding for SQLite
    if (before) {
      const rows: Array<{ text: string; createdAt: string; username: string | null; isAdmin: number | null }>
        = await db.$queryRaw`SELECT m.text as text, m.createdAt as createdAt, u.username as username, u.isAdmin as isAdmin
                              FROM Message m LEFT JOIN User u ON u.id = m.userId
                              WHERE m.channel = ${channel} AND m.createdAt < ${new Date(before)}
                              ORDER BY m.createdAt DESC
                              LIMIT ${limit}`;
      const items = rows
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map(r => ({
          message: r.text,
          sender: r.username ?? null,
          admin: Boolean(r.isAdmin ?? false),
          timestamp: new Date(r.createdAt).toISOString(),
        }));
      return NextResponse.json({ items });
    } else {
      const rows: Array<{ text: string; createdAt: string; username: string | null; isAdmin: number | null }>
        = await db.$queryRaw`SELECT m.text as text, m.createdAt as createdAt, u.username as username, u.isAdmin as isAdmin
                              FROM Message m LEFT JOIN User u ON u.id = m.userId
                              WHERE m.channel = ${channel}
                              ORDER BY m.createdAt DESC
                              LIMIT ${limit}`;
      const items = rows
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map(r => ({
          message: r.text,
          sender: r.username ?? null,
          admin: Boolean(r.isAdmin ?? false),
          timestamp: new Date(r.createdAt).toISOString(),
        }));
      return NextResponse.json({ items });
    }
  } catch (err) {
    console.error('messages GET channel error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const text = (typeof body?.text === 'string' ? body.text : (typeof body?.message === 'string' ? body.message : '')).trim();
    if (!text) return NextResponse.json({ error: 'Message text required' }, { status: 400 });

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const messagesIdx = pathParts.findIndex(p => p === 'messages');
    const channelPart = messagesIdx >= 0 ? pathParts[messagesIdx + 1] : null;
    const channel = (channelPart || 'general').toLowerCase();

    // Admin-only writes for the alerts channel
    if (channel === 'alerts') {
      try {
        const rows: Array<{ isAdmin: number }>
          = await db.$queryRaw`SELECT isAdmin FROM User WHERE id = ${auth.sub} LIMIT 1`;
        const isAdmin = rows && rows.length > 0 ? Boolean(rows[0]?.isAdmin) : false;
        if (!isAdmin) {
          return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
        }
      } catch (e) {
        console.error('alerts admin check failed', e);
        return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
      }
    }
    const id = randomUUID();
    const now = new Date();

    await db.$executeRaw`INSERT INTO Message (id, text, userId, email, channel, createdAt, updatedAt)
                        VALUES (${id}, ${text}, ${auth.sub}, ${auth.email ?? null}, ${channel}, ${now}, ${now})`;

    return NextResponse.json({ ok: true, id, timestamp: now.toISOString() }, { status: 201 });
  } catch (err) {
    console.error('messages POST channel error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
