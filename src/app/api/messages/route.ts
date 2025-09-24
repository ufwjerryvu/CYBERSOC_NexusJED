import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET() {
  try {
    const rows = await db.message.findMany({
      where: { channel: "general" },
      orderBy: { createdAt: "asc" },
      include: { user: true },
      take: 200,
    });

    const out = rows.map((m) => ({
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

    return NextResponse.json(out);
  } catch (err) {
    console.error("[api/messages] GET error", err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}
