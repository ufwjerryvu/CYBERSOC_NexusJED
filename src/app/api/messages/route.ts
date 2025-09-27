import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { getUserFromToken } from "~/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const before = searchParams.get('before'); // timestamp to get messages before
    const after = searchParams.get('after'); // timestamp to get messages after
    
    let whereClause: any = { channel: "general" };
    let orderBy: any = { createdAt: "desc" }; // Always get newest first, then reverse if needed
    
    // Add timestamp filtering for pagination
    if (before) {
      whereClause.createdAt = { lt: new Date(parseInt(before)) };
    } else if (after) {
      whereClause.createdAt = { gt: new Date(parseInt(after)) };
    }

    const rows = await db.message.findMany({
      where: whereClause,
      orderBy,
      include: { user: true },
      take: limit,
    });

    // For initial load or "before" pagination, we want chronological order (oldest first)
    // For "after" queries, we want to keep the reverse chronological order
    const sortedRows = after ? rows : rows.reverse();

    const out = sortedRows.map((m) => ({
      id: m.id,
      text: m.text ?? "",
      // @ts-ignore - 'images' is a new JSON column; types update after prisma generate
      images: Array.isArray((m as any).images as unknown as string[]) && ((m as any).images as unknown as string[]).length > 0
        // @ts-ignore
        ? ((m as any).images as unknown as string[])
        : (m.image ? [m.image] : undefined),
      email: m.email ?? m.user?.email ?? "",
      username: m.user?.username ?? (m.email ? m.email.split("@")[0] : "user"),
      admin_attr: Boolean(m.user?.isAdmin),
      ts: m.createdAt.getTime(),
    }));

    return NextResponse.json({
      messages: out,
      hasMore: rows.length === limit,
      oldestTimestamp: out.length > 0 ? out[0]?.ts || null : null,
      newestTimestamp: out.length > 0 ? out[out.length - 1]?.ts || null : null,
    });
  } catch (err) {
    console.error("[api/messages] GET error", err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const currentUser = await getUserFromToken(accessToken || '');

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { text, images } = await request.json();

    // Validate that we have either text or images
    if (!text?.trim() && (!images || images.length === 0)) {
      return NextResponse.json({ error: "Message must have text or images" }, { status: 400 });
    }

    // Create the message
    const message = await db.message.create({
      data: {
        text: text?.trim() || "",
        images: images && images.length > 0 ? images : null,
        image: images && images.length > 0 ? images[0] : null, // Legacy field
        userId: currentUser.id,
        email: currentUser.email,
        channel: "general"
      },
      include: {
        user: true
      }
    });

    // Format the response
    const formattedMessage = {
      id: message.id,
      text: message.text ?? "",
      images: Array.isArray((message as any).images) && ((message as any).images as string[]).length > 0
        ? ((message as any).images as string[])
        : (message.image ? [message.image] : undefined),
      email: message.email ?? message.user?.email ?? "",
      username: message.user?.username ?? (message.email ? message.email.split("@")[0] : "user"),
      admin_attr: Boolean(message.user?.isAdmin),
      ts: message.createdAt.getTime(),
    };

    return NextResponse.json({
      success: true,
      message: formattedMessage
    });
  } catch (err) {
    console.error("[api/messages] POST error", err);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}
