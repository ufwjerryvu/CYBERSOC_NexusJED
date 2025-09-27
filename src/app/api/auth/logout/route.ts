import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // For IP-based deployments, we need more permissive cookie settings
  const isIPDeployment = process.env.NEXT_PUBLIC_SERVER_HOST &&
    /^\d+\.\d+\.\d+\.\d+$/.test(process.env.NEXT_PUBLIC_SERVER_HOST);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && !isIPDeployment, // Disable secure for IP deployments
    sameSite: 'lax' as const,
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge: 0,
  };

  response.cookies.set('access_token', '', cookieOptions);
  response.cookies.set('refresh_token', '', cookieOptions);

  return response;
}