import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge: 0,
  };

  response.cookies.set('access_token', '', cookieOptions);
  response.cookies.set('refresh_token', '', cookieOptions);

  return response;
}