import { type NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';
import { verifyPassword, generateTokens } from '~/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();  // 'email' can be username too

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      );
    }

    // Check if input is email format
    const isEmail = email.includes('@');

    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: isEmail ? email.toLowerCase() : undefined },
          { username: email }  // 'email' variable contains the input
        ].filter(Boolean)
      }
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

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}