const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  socket.on('disconnect', () => console.log('client disconnected', socket.id));
});

app.post('/api/message', (req, res) => {
  const { message, sender } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required and must be a string' });
  }

  // If sender not provided by client, try to derive from access_token cookie (email local-part)
  let finalSender = typeof sender === 'string' && sender ? sender : null;
  if (!finalSender) {
    try {
      const cookie = req.headers.cookie || '';
      const match = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('access_token='));
      const token = match ? match.replace('access_token=', '') : null;
      if (token) {
        const decoded = jwt.verify(token, process.env.AUTH_SECRET || 'dev-secret');
        if (decoded && typeof decoded === 'object' && decoded.email) {
          finalSender = String(decoded.email).split('@')[0];
        }
      }
    } catch (err) {
      // ignore decode errors and leave finalSender null
    }
  }

  const payload = { message, sender: finalSender };
  // Broadcast to all connected socket.io clients
  io.emit('message', payload);
  return res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Socket server listening on http://localhost:${PORT}`);
});

module.exports = { app, server, io };
