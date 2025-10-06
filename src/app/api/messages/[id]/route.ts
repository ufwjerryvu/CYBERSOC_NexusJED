import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { getUserFromToken } from "~/lib/auth";
import { cookies } from "next/headers";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
    console.log("[DELETE] messageId:", messageId);

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    // Get current user from JWT token
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const currentUser = await getUserFromToken(accessToken || '');

    if (!currentUser) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }

    // First check if the message exists
    const existingMessage = await db.message.findUnique({
      where: { id: messageId },
      include: { user: true }
    });

    if (!existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check permissions: user can delete their own messages, or admins can delete any message
    const canDelete =
      existingMessage.email === currentUser.email || // Own message
      currentUser.isAdmin; // Admin can delete any message

    if (!canDelete) {
      return NextResponse.json({ error: "You don't have permission to delete this message" }, { status: 403 });
    }

    await db.message.delete({
      where: { id: messageId }
    });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/messages/[id]] DELETE error", err);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
    const { action, imageIndex } = await request.json();
    
    if (action === "remove-image" && typeof imageIndex === "number") {
      // Get current user from JWT token
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('access_token')?.value;
      const currentUser = await getUserFromToken(accessToken || '');

      if (!currentUser) {
        return NextResponse.json({ error: "User authentication required" }, { status: 401 });
      }
      
      // First, get the current message to get its images
      const currentMessage = await db.message.findUnique({
        where: { id: messageId },
        include: { user: true }
      });
      
      if (!currentMessage) {
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
      }
      
      // Check permissions: only allow editing own messages (even for admins)
      const canEdit = currentMessage.email === currentUser.email;

      if (!canEdit) {
        return NextResponse.json({ error: "You can only edit your own messages" }, { status: 403 });
      }
      
      // Get current images array
      // @ts-ignore - 'images' is a JSON column that may not be in generated types yet
      const currentImages = Array.isArray((currentMessage as any).images) 
        ? (currentMessage as any).images as string[]
        : (currentMessage.image ? [currentMessage.image] : []);
      
      // Remove the image at the specified index
      const updatedImages = currentImages.filter((_, idx) => idx !== imageIndex);
      
      // Update the message in database
      const updateData: any = {};
      // @ts-ignore
      updateData.images = updatedImages.length > 0 ? updatedImages : null;
      updateData.image = updatedImages.length > 0 ? updatedImages[0] : null;
      
      await db.message.update({
        where: { id: messageId },
        data: updateData
      });
      
      return NextResponse.json({ success: true, updatedImages });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[api/messages/[id]] PATCH error", err);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
    const { text, images } = await request.json();
    
    // Get current user from JWT token
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const currentUser = await getUserFromToken(accessToken || '');

    if (!currentUser) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }

    // First check if the message exists and get current user permissions
    const existingMessage = await db.message.findUnique({
      where: { id: messageId },
      include: { user: true }
    });

    if (!existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check permissions: only allow editing own messages (even for admins)
    const canEdit = existingMessage.email === currentUser.email;

    if (!canEdit) {
      return NextResponse.json({ error: "You can only edit your own messages" }, { status: 403 });
    }
    
    const updateData: any = { text };
    
    // Handle images update if provided
    if (images !== undefined) {
      // @ts-ignore - 'images' is a JSON column that may not be in generated types yet
      updateData.images = Array.isArray(images) && images.length > 0 ? images : null;
      // Also update legacy single image field for backward compatibility
      updateData.image = Array.isArray(images) && images.length > 0 ? images[0] : null;
    }
    
    const updatedMessage = await db.message.update({
      where: { id: messageId },
      data: updateData,
      include: { user: true }
    });

    return NextResponse.json({ 
      success: true, 
      message: {
        text: updatedMessage.text ?? "",
        // @ts-ignore - 'images' is a new JSON column; types update after prisma generate
        images: Array.isArray((updatedMessage as any).images as unknown as string[]) && ((updatedMessage as any).images as unknown as string[]).length > 0
          // @ts-ignore
          ? ((updatedMessage as any).images as unknown as string[])
          : (updatedMessage.image ? [updatedMessage.image] : undefined),
        email: updatedMessage.email ?? updatedMessage.user?.email ?? "",
        username: updatedMessage.user?.username ?? (updatedMessage.email ? updatedMessage.email.split("@")[0] : "user"),
        admin_attr: Boolean(updatedMessage.user?.isAdmin),
        ts: updatedMessage.createdAt.getTime(),
      }
    });
  } catch (err) {
    console.error("[api/messages/[id]] PUT error", err);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}