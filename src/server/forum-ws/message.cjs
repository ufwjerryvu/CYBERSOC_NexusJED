//@ts-nocheck
const http = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./prisma/dev.db";
}

const prisma = new PrismaClient();

// Simple JWT verification for WebSocket
function verifySocketAuth(auth) {
  // For now, we'll use the auth data sent from client
  // In production, you'd want to verify JWT tokens here
  if (!auth || !auth.userId || !auth.email || !auth.username) {
    return null;
  }
  return {
    userId: auth.userId,
    email: auth.email,
    username: auth.username
  };
}

const server = http.createServer();
const io = new Server(server, {
  path: "/message",
  cors: {
    origin: "*", 
  },
});

io.on("connection", (socket) => {
  console.log("[forum-ws] client connected", socket.id);

  // Verify authentication on connection
  const auth = verifySocketAuth(socket.handshake.auth);
  if (!auth) {
    console.log("[forum-ws] unauthorized connection attempt", socket.id);
    socket.emit("chat:error", { message: "Authentication required" });
    socket.disconnect();
    return;
  }

  socket.userId = auth.userId;
  socket.userEmail = auth.email;
  socket.username = auth.username;

  console.log("[forum-ws] authenticated user connected", auth.username, socket.id);

  socket.on("chat:message", async (payload) => {
    try {
      const text = payload && typeof payload.text === "string" ? payload.text : "";
      const images = Array.isArray(payload && payload.images)
        ? (payload.images || []).filter((u) => typeof u === "string" && u.length > 0)
        : [];

      // Require at least text or one image
      if (!text && images.length === 0) {
        socket.emit("chat:error", { message: "Message must have text or images" });
        return;
      }

      // Get user info from database
      const user = await prisma.user.findUnique({ where: { id: socket.userId } });
      if (!user) {
        socket.emit("chat:error", { message: "User not found" });
        return;
      }

      const admin_attr = Boolean(user.isAdmin);
      const username = user.username || socket.username;

      // Persist message with graceful fallback if Prisma client hasn't been regenerated yet
      let saved;
      try {
        saved = await prisma.message.create({
          data: {
            text: text || null,
            image: images.length === 1 ? images[0] : null, // legacy single image
            // @ts-ignore - 'images' is a new JSON column; types update after prisma generate
            images: images.length > 0 ? images : null,     // preferred array
            email: user.email,
            userId: user.id,
            channel: "general",
          },
          include: { user: true },
        });
      } catch (e) {
        const errMsg = (e && /** @type {any} */(e).message) ? /** @type {any} */(e).message : e;
        console.warn("[forum-ws] create with images JSON failed, retrying without images column", errMsg);
        saved = await prisma.message.create({
          data: {
            text: text || null,
            image: images.length > 0 ? images[0] : null,
            email: user.email,
            userId: user.id,
            channel: "general",
          },
          include: { user: true },
        });
      }

      const messageOut = {
        id: saved.id,
        text: saved.text || "",
        images: images.length > 0 ? images : (saved.image ? [saved.image] : undefined),
        email: saved.email || user.email,
        username,
        admin_attr,
        ts: new Date(saved.createdAt).getTime(),
      };
      io.emit("chat:message", messageOut);
    } catch (err) {
      console.error("[forum-ws] error handling chat:message", err);
      socket.emit("chat:error", { message: "Server error" });
    }
  });

  socket.on("message:deleted", (payload) => {
    try {
      const messageId = payload && payload.messageId;
      if (!messageId) {
        socket.emit("chat:error", { message: "Invalid message ID" });
        return;
      }
      
      // Broadcast the deletion to all connected clients
      io.emit("message:deleted", { messageId });
    } catch (err) {
      console.error("[forum-ws] error handling message:deleted", err);
      socket.emit("chat:error", { message: "Server error" });
    }
  });

  socket.on("message:edited", (payload) => {
    try {
      const messageId = payload && payload.messageId;
      const newText = payload && payload.newText;
      const images = payload && payload.images;
      
      if (!messageId || typeof newText !== "string") {
        socket.emit("chat:error", { message: "Invalid edit payload" });
        return;
      }
      
      // Broadcast the edit to all connected clients (including images if provided)
      const editData = { messageId, newText, images };
      io.emit("message:edited", editData);
    } catch (err) {
      console.error("[forum-ws] error handling message:edited", err);
      socket.emit("chat:error", { message: "Server error" });
    }
  });

  socket.on("message:image-removed", (payload) => {
    try {
      const messageId = payload && payload.messageId;
      const imageIndex = payload && payload.imageIndex;
      
      if (!messageId || typeof imageIndex !== "number") {
        socket.emit("chat:error", { message: "Invalid image removal payload" });
        return;
      }
      
      // Broadcast the image removal to all connected clients
      io.emit("message:image-removed", { messageId, imageIndex });
    } catch (err) {
      console.error("[forum-ws] error handling message:image-removed", err);
      socket.emit("chat:error", { message: "Server error" });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("[forum-ws] client disconnected", socket.id, reason);
  });
});


function resolvePort() {
  if (process.env.FORUM_WS_PORT) return parseInt(process.env.FORUM_WS_PORT, 10);
  if (process.env.WEBSOCKET_URL) {
    try {
      const u = new URL(process.env.WEBSOCKET_URL);
      if (u.port) return parseInt(u.port, 10);
      return u.protocol === "https:" ? 443 : 80;
    } catch (_) {
 
    }
  }
  return 8000;
}

const PORT = resolvePort();
server.listen(PORT, () => {
  console.log(`[forum-ws] listening on http://localhost:${PORT} (path: /message)`);
});

module.exports = { io };
