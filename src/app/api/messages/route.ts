import { NextResponse } from "next/server";
import { db } from "@/server/db";
import jwt from "jsonwebtoken";
import { env } from "@/env";

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

  try {
    const url = new URL(req.url);
    const limitRaw = url.searchParams.get('limit');
    const before = url.searchParams.get('before');
    const limit = Math.max(1, Math.min(Number(limitRaw ?? 15) || 15, 50));

    const where: any = {};
    if (before) {
      const dt = new Date(before);
      if (!isNaN(dt.getTime())) where.createdAt = { lt: dt };
    }

    const rows = await db.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { username: true, isAdmin: true } } },
    });

    // Return in ascending chronological order for natural rendering
    const items = rows
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((m) => ({
        message: m.text,
        sender: m.user?.username ?? null,
        admin: m.user?.isAdmin ?? false,
        timestamp: m.createdAt.toISOString(),
      }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('messages GET error', err);
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

    const saved = await db.message.create({
      data: {
        text,
        userId: auth.sub,
        email: auth.email ?? null,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, id: saved.id, timestamp: saved.createdAt.toISOString() }, { status: 201 });
  } catch (err) {
    console.error('messages POST error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
