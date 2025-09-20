import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { env } from "@/env";

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.split(';').map(c=>c.trim()).find(c=>c.startsWith('access_token='));
    const token = match ? match.replace('access_token=', '') : null;

    if (!token) return NextResponse.json({ authenticated: false });

    try {
      const decoded = jwt.verify(token, env.AUTH_SECRET || 'dev-secret') as any;
      return NextResponse.json({ authenticated: true, user: { id: decoded.sub, email: decoded.email } });
    } catch (err) {
      return NextResponse.json({ authenticated: false });
    }
  } catch (err) {
    console.error('session error', err);
    return NextResponse.json({ authenticated: false });
  }
}
