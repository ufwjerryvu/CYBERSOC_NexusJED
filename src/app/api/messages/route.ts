import { NextResponse } from "next/server";
import { db } from "~/server/db";

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
