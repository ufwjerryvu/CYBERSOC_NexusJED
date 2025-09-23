
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

      if (!email || !text) {
        socket.emit("chat:error", { message: "Invalid payload" });
        return;
      }

  const user = await prisma.user.findUnique({ where: { email } });
  const admin_attr = Boolean(user && user.isAdmin);
  const username = (user && user.username) || (email.includes("@") ? email.split("@")[0] : email);

      const messageOut = { text, email, username, admin_attr, ts: Date.now() };
      io.emit("chat:message", messageOut);
    } catch (err) {
      console.error("[forum-ws] error handling chat:message", err);
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
