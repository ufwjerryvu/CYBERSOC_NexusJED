//@ts-nocheck
const http = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./prisma/dev.db";
}

const prisma = new PrismaClient();

const server = http.createServer();
const io = new Server(server, {
  path: "/message",
  cors: {
    origin: "*", 
  },
});

io.on("connection", (socket) => {
  console.log("[forum-ws] client connected", socket.id);

  socket.on("chat:message", async (payload) => {
    try {
      const email = payload && typeof payload.email === "string" ? payload.email : "";
      const text = payload && typeof payload.text === "string" ? payload.text : "";
      const images = Array.isArray(payload && payload.images)
        ? (payload.images || []).filter((u) => typeof u === "string" && u.length > 0)
        : [];

      // Require email and at least text or one image
      if (!email || (!text && images.length === 0)) {
        socket.emit("chat:error", { message: "Invalid payload" });
        return;
      }

  const user = await prisma.user.findUnique({ where: { email } });
  const admin_attr = Boolean(user && user.isAdmin);
  const username = (user && user.username) || (email.includes("@") ? email.split("@")[0] : email);

      // Persist message with graceful fallback if Prisma client hasn't been regenerated yet
      let saved;
      try {
        saved = await prisma.message.create({
          data: {
            text: text || null,
            image: images.length === 1 ? images[0] : null, // legacy single image
            // @ts-ignore - 'images' is a new JSON column; types update after prisma generate
            images: images.length > 0 ? images : null,     // preferred array
            email,
            userId: user ? user.id : (await ensureUser(email)).id,
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
            email,
            userId: user ? user.id : (await ensureUser(email)).id,
            channel: "general",
          },
          include: { user: true },
        });
      }

      const messageOut = {
        id: saved.id,
        text: saved.text || "",
        images: images.length > 0 ? images : (saved.image ? [saved.image] : undefined),
        email: saved.email || email,
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

/**
 * @param {string} email
 */
async function ensureUser(email) {
  // create minimal user if not exists to satisfy FK
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({ data: { email, isAdmin: false } });
}
