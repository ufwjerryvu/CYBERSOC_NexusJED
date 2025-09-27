import { type NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateTokens } from '~/lib/auth';
import { db } from '~/server/db';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      const response = NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      );
      // Clear invalid cookies
      response.cookies.set('access_token', '', { maxAge: 0 });
      response.cookies.set('refresh_token', '', { maxAge: 0 });
      return response;
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      const response = NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
      // Clear invalid cookies
      response.cookies.set('access_token', '', { maxAge: 0 });
      response.cookies.set('refresh_token', '', { maxAge: 0 });
      return response;
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      const response = NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
      // Clear invalid cookies
      response.cookies.set('access_token', '', { maxAge: 0 });
      response.cookies.set('refresh_token', '', { maxAge: 0 });
      return response;
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
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

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
    });

    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    // Clear potentially corrupted cookies
    response.cookies.set('access_token', '', { maxAge: 0 });
    response.cookies.set('refresh_token', '', { maxAge: 0 });
    return response;
  }
}