import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { getUserFromToken } from "~/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const currentUser = await getUserFromToken(accessToken || '');

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const currentUser = await getUserFromToken(accessToken || '');

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = await request.json();
    
    // Prevent self-deletion
    if (userId === currentUser.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    await db.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const currentUser = await getUserFromToken(accessToken || '');

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, isAdmin } = await request.json();
    
    // Prevent self-demotion
    if (userId === currentUser.id && !isAdmin) {
      return NextResponse.json({ error: "Cannot remove your own admin status" }, { status: 400 });
    }

    await db.user.update({
      where: { id: userId },
      data: { isAdmin }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}