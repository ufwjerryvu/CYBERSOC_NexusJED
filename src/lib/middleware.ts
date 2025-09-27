import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from './auth';

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/register', '/api/auth/login', '/api/auth/register'];
  const terminalPaths = ['/terminal'];

  if (publicPaths.includes(pathname) || pathname === '/') {
    return NextResponse.next();
  }

  if (terminalPaths.includes(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (accessToken) {
    const payload = verifyAccessToken(accessToken);
    if (payload) {
      return NextResponse.next();
    }
  }

  if (refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    if (payload) {
      return NextResponse.redirect(new URL('/api/auth/refresh', request.url));
    }
  }

  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
  return response;
}