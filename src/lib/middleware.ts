import { type NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from './auth';

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all API routes to pass through
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const publicPaths = ['/login', '/register', '/terminal'];

  // Allow public paths and home page
  if (publicPaths.includes(pathname) || pathname === '/') {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // If no tokens at all, redirect to login
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If we have an access token, verify it
  if (accessToken) {
    const payload = verifyAccessToken(accessToken);
    if (payload) {
      return NextResponse.next();
    }
  }

  // If access token is invalid/expired but we have a refresh token, verify it
  if (refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    if (payload) {
      // Instead of redirecting to refresh endpoint, let the client handle it
      // This prevents redirect loops
      return NextResponse.next();
    }
  }

  // If all tokens are invalid, clear them and redirect to login
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
  return response;
}