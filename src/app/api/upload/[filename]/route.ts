import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const filepath = path.join("/tmp", "uploads", filename);
  
  try {
    const file = await fs.readFile(filepath);
    const ext = path.extname(filename).slice(1);
    const contentType = `image/${ext}`;
    
    return new NextResponse(file as any, {
      headers: { "Content-Type": contentType }
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}