import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { env } from "@/env";
import { db } from "@/server/db";

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.split(';').map(c=>c.trim()).find(c=>c.startsWith('access_token='));
    const token = match ? match.replace('access_token=', '') : null;

    if (!token) return NextResponse.json({ username: null });

    try {
      const decoded = jwt.verify(token, env.AUTH_SECRET || 'dev-secret') as any;
      // fetch username and admin flag. First try by id, then fall back to email if id doesn't match.
      try {
        let rows: any = await db.$queryRaw`SELECT username, isAdmin FROM User WHERE id = ${decoded.sub} LIMIT 1`;
        let username = Array.isArray(rows) && rows[0] && rows[0].username ? rows[0].username : null;
        let isAdmin = Array.isArray(rows) && rows[0] && typeof rows[0].isAdmin === 'boolean' ? rows[0].isAdmin : false;
        if (!username && decoded.email) {
          rows = await db.$queryRaw`SELECT username, isAdmin FROM User WHERE lower(email) = lower(${decoded.email}) LIMIT 1`;
          username = Array.isArray(rows) && rows[0] && rows[0].username ? rows[0].username : null;
          if (Array.isArray(rows) && rows[0] && typeof rows[0].isAdmin === 'boolean') {
            isAdmin = rows[0].isAdmin;
          }
        }
        console.log('fetched username', username);
        return NextResponse.json({ username, isAdmin });
      } catch (err) {
        console.error('db error fetching username', err);
        return NextResponse.json({ username: null, isAdmin: false });
      }
    } catch (err) {
      return NextResponse.json({ username: null, isAdmin: false });
    }
  } catch (err) {
    console.error('me error', err);
    return NextResponse.json({ username: null, isAdmin: false });
  }
}
