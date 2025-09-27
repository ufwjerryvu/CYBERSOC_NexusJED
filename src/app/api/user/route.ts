import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET(request: Request) {
  try {
    // Get the email from the Authorization header or cookie
    const userEmail = request.headers.get("x-user-email");
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email not provided" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin
    });
  } catch (err) {
    console.error("[api/user] GET error", err);
    return NextResponse.json({ error: "Failed to get user info" }, { status: 500 });
  }
}