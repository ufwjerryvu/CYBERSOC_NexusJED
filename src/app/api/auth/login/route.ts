import { type NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';
import { verifyPassword, generateTokens } from '~/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email!,
      username: user.username!,
      isAdmin: user.isAdmin,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    });

    // For IP-based deployments, we need more permissive cookie settings
    const isIPDeployment = process.env.NEXT_PUBLIC_SERVER_HOST &&
      /^\d+\.\d+\.\d+\.\d+$/.test(process.env.NEXT_PUBLIC_SERVER_HOST);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && !isIPDeployment, // Disable secure for IP deployments
      sameSite: 'lax' as const,
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
    };

    console.log('[AUTH] Setting cookies with options:', cookieOptions);
    console.log('[AUTH] Is IP deployment:', isIPDeployment);
    console.log('[AUTH] NODE_ENV:', process.env.NODE_ENV);

    // Try setting cookies with different strategies for IP deployments
    if (isIPDeployment) {
      // More permissive settings for IP deployments
      const ipCookieOptions = {
        httpOnly: false, // Allow JS access for debugging
        secure: false,
        sameSite: 'none' as const,
        path: '/',
      };

      console.log('[AUTH] Using IP-specific cookie options:', ipCookieOptions);

      response.cookies.set('access_token', accessToken, {
        ...ipCookieOptions,
        maxAge: 15 * 60,
      });

      response.cookies.set('refresh_token', refreshToken, {
        ...ipCookieOptions,
        maxAge: 7 * 24 * 60 * 60,
      });
    } else {
      response.cookies.set('access_token', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60, // 15 minutes
      });

      response.cookies.set('refresh_token', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    console.log('[AUTH] Cookies set successfully');

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}