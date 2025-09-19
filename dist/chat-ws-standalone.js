import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '@/env';
import { db } from './db';
const PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 3001;
let wss = null;
function start() {
    if (wss)
        return wss;
    wss = new WebSocketServer({ port: PORT });
    wss.on('connection', async (ws, req) => {
        // read cookies from req.headers
        try {
            const cookieHeader = req?.headers?.cookie || '';
            const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith('access_token='));
            const access = match ? match.replace('access_token=', '') : null;
            if (access) {
                try {
                    const decoded = jwt.verify(access, env.AUTH_SECRET || 'dev-secret');
                    ws.userId = decoded.sub;
                    const u = await db.user.findUnique({ where: { id: decoded.sub }, select: { username: true, email: true } });
                    ws.username = u?.username ?? u?.email ?? 'anon';
                }
                catch (e) {
                    ws.userId = null;
                    ws.username = 'anon';
                }
            }
            else {
                ws.userId = null;
                ws.username = 'anon';
            }
        }
        catch (e) {
            ws.userId = null;
            ws.username = 'anon';
        }
        try {
            const msgs = await db.message.findMany({ orderBy: { createdAt: 'asc' }, take: 200 });
            const enriched = await Promise.all(msgs.map(async (m) => {
                const u = await db.user.findUnique({ where: { id: m.userId }, select: { username: true, email: true } });
                return { id: m.id, text: m.text, userId: m.userId, username: u?.username ?? u?.email ?? 'anon', createdAt: m.createdAt };
            }));
            ws.send(JSON.stringify({ type: 'init', payload: enriched }));
        }
        catch (e) { }
        ws.on('message', async (raw) => {
            try {
                const parsed = JSON.parse(raw.toString());
                const { type, payload } = parsed;
                if (type === 'message:send') {
                    const text = typeof payload?.text === 'string' ? payload.text.trim().slice(0, 300) : '';
                    if (!text)
                        return;
                    if (!ws.userId) {
                        ws.send(JSON.stringify({ type: 'error', payload: { message: 'not_authenticated' } }));
                        return;
                    }
                    const created = await db.message.create({ data: { text, userId: ws.userId, email: null } });
                    const u = await db.user.findUnique({ where: { id: ws.userId }, select: { username: true, email: true } });
                    const out = { id: created.id, text: created.text, userId: created.userId, username: u?.username ?? u?.email ?? 'anon', createdAt: created.createdAt };
                    const msg = JSON.stringify({ type: 'message:created', payload: out });
                    wss.clients.forEach((c) => { if (c.readyState === 1)
                        c.send(msg); });
                }
            }
            catch (e) {
                console.error('standalone ws message error', e);
            }
        });
    });
    console.log(`Standalone WebSocket server started on ws://localhost:${PORT}`);
    return wss;
}
// Start automatically when this module is imported in a Node server environment
try {
    if (typeof window === 'undefined')
        start();
}
catch (e) { }
export { start as startStandaloneWSS };
