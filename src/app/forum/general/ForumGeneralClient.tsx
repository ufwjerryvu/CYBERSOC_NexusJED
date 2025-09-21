"use client";
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import axios from "axios";
import { socket } from '@/env';

export default function ForumGeneralClient() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Array<{message: string; sender: string | null; timestamp: string; admin?: boolean}>>([]);
    const [username, setUsername] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
        const [loadingInit, setLoadingInit] = useState(false);
        const [loadingMore, setLoadingMore] = useState(false);
        const [hasMore, setHasMore] = useState(true);
        const [oldestTs, setOldestTs] = useState<string | null>(null);
        const chatRef = useRef<HTMLDivElement | null>(null);
        const [sendCooldown, setSendCooldown] = useState(false);
        const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
        const pendingOwn = useRef<Map<string, number>>(new Map());
        const didInitScroll = useRef<boolean>(false);

    const scrollToBottom = () => {
        if (!chatRef.current) return;
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
    };

    const ensureScrollToBottom = () => {
        // multiple passes to handle async layout
        scrollToBottom();
        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(() => scrollToBottom());
        }
        setTimeout(() => scrollToBottom(), 50);
    };
    useEffect(() => {
        const handler = (msg: any) => {
            // msg can be either a string (old) or an object { message, sender }
            const now = new Date().toISOString();
            const raw = typeof msg === 'string' ? msg : (msg && typeof msg === 'object' ? String(msg.message ?? '') : '');
            let sender: string | null = null;
            if (msg && typeof msg === 'object' && msg.sender) sender = String(msg.sender);
            if (!sender) {
                const m = raw.match(/^\s*([^:]{1,60}):\s*(.*)$/);
                if (m && m[1]) sender = String(m[1]).trim();
            }
            const bodyMatch = raw.match(/^\s*([^:]{1,60}):\s*(.*)$/);
            const bodyOnly = bodyMatch ? String(bodyMatch[2] ?? '') : raw;
            const own = Boolean(username && ((sender && sender === username) || raw.startsWith(`${username}: `)));
            const adminFlag = own && isAdmin ? true : false;
            // dedupe own echo if we optimistically appended
            if (own) {
                const key = `${username ?? ''}|${bodyOnly}`;
                const ts = pendingOwn.current.get(key);
                if (ts && Date.now() - ts < 5000) {
                    pendingOwn.current.delete(key);
                    return;
                }
            }
            setMessages(prev => [...prev, { message: raw, sender, timestamp: now, admin: adminFlag }]);
            // auto scroll to bottom on own message arrival
            if (own && chatRef.current) {
                setTimeout(() => { ensureScrollToBottom(); }, 0);
            }
        };
        socket.on("message", handler);
        return () => {
            socket.off("message", handler);
        }
    }, [username, isAdmin]);
    useEffect(() => {
           
            (async () => {
                try {
                    const res = await fetch('/api/auth/me', { credentials: 'include' });
                    const data = await res.json();
                    if (data && typeof data.username === 'string') setUsername(data.username);
                    if (data && typeof data.isAdmin === 'boolean') setIsAdmin(data.isAdmin);
                } catch (err) {
                    console.error('Failed to load username', err);
                }
            })();
        }, []);

    // initial load of latest 15 messages
    useEffect(() => {
        (async () => {
            try {
                setLoadingInit(true);
                const res = await fetch('/api/messages?limit=15', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    const items: Array<{message: string; sender: string | null; timestamp: string; admin?: boolean}> = data?.items ?? [];
                    setMessages(items);
                    const oldest = items && items.length > 0 ? items[0]!.timestamp : null;
                    setOldestTs(oldest);
                    setHasMore(items.length >= 15);
                    // robust scroll to bottom after initial load
                    ensureScrollToBottom();
                }
            } catch (err) {
                console.error('Failed to load messages', err);
            } finally {
                setLoadingInit(false);
            }
        })();
    }, []);

    // Cleanup cooldown timer on unmount
    useEffect(() => {
        return () => {
            if (cooldownTimerRef.current) {
                clearTimeout(cooldownTimerRef.current);
                cooldownTimerRef.current = null;
            }
        };
    }, []);

    // Ensure we land at the bottom once after initial load
    useLayoutEffect(() => {
        if (loadingInit) return;
        if (!didInitScroll.current && messages.length > 0) {
            ensureScrollToBottom();
            didInitScroll.current = true;
        }
    }, [loadingInit, messages.length]);

    // handler to load older messages when scrolled to top
    const handleScroll = async () => {
        if (!chatRef.current || loadingMore || !hasMore) return;
        if (chatRef.current.scrollTop > 20) return;
        if (!oldestTs) return;
        try {
            setLoadingMore(true);
            const minDelay = new Promise(res => setTimeout(res, 500));
            const before = encodeURIComponent(oldestTs);
            const res = await fetch(`/api/messages?limit=15&before=${before}`, { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            const older: Array<{message: string; sender: string | null; timestamp: string}> = data?.items ?? [];
            if (older.length === 0) {
                setHasMore(false);
                await minDelay; // still respect the loader delay even when empty
                return;
            }
            const prev = chatRef.current;
            const prevScrollHeight = prev?.scrollHeight ?? 0;
            const prevTop = prev?.scrollTop ?? 0;
            setMessages(curr => {
                const next = [...older, ...curr];
                return next;
            });
            // after DOM updates, keep the viewport anchored
            setTimeout(async () => {
                if (chatRef.current) {
                    const newScrollHeight = chatRef.current.scrollHeight;
                    chatRef.current.scrollTop = (newScrollHeight - prevScrollHeight) + prevTop;
                }
                await minDelay;
            }, 0);
            setOldestTs(older && older.length > 0 ? older[0]!.timestamp : oldestTs);
            if (older.length < 15) setHasMore(false);
        } catch (err) {
            console.error('Failed to load older messages', err);
        } finally {
            setLoadingMore(false);
        }
    };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
        if (sendCooldown) return;
        if (!message || !message.trim()) return;

        try {
            // ensure we have a username before posting; fetch it if absent
            let uname = username;
            console.log('Current username before send:', uname);
            if (!uname) {
                
                try {
                    const res = await fetch('/api/auth/me', { credentials: 'include' });
                    const data = await res.json();
                    if (data && typeof data.username === 'string') {
                        uname = data.username;
                        setUsername(uname);
                    }
                } catch (err) {
                    console.error('Failed to fetch username before send', err);
                }
            }

            if (!uname) {
                // still no username; abort send
                console.error('Cannot send message: username not available');
                return;
            }
            const finalMessage = uname + ": " + message;
            // start 1s cooldown immediately to prevent rapid enters
            setSendCooldown(true);
            if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
            cooldownTimerRef.current = setTimeout(() => setSendCooldown(false), 1000);
            // optimistic UI append for seamless send
            const nowIso = new Date().toISOString();
            setMessages(prev => [...prev, { message: finalMessage, sender: uname, timestamp: nowIso, admin: isAdmin }]);
            // clear input immediately so user's new typing during cooldown won't be wiped later
            setMessage("");
            // track to dedupe echo
            pendingOwn.current.set(`${uname}|${message}`, Date.now());
            // immediate scroll to bottom
            ensureScrollToBottom();

            // include sender derived from session (socket broadcast)
            await axios.post('http://localhost:8080/api/message', { message: finalMessage, sender: uname });
            // persist message to DB via Next.js API (store only the text content, server infers user)
            try {
                await fetch('/api/messages', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: message })
                });
            } catch (err) {
                console.error('Failed to persist message', err);
            }
            // do not clear here; already cleared immediately on send
        } catch (err) {
            console.error('Failed to send message', err);
        }
  }

        

    return (
        <main>
            <div>
                <div>
                    <h1>General</h1>
                </div>

                <div className="nx-chat">
                    <div className="nx-chat-window" ref={chatRef} onScroll={handleScroll}>
                        {loadingMore ? (
                            <div style={{ position: 'sticky', top: 0, display: 'flex', justifyContent: 'center', padding: '4px' }}>
                                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : null}
                        {messages.map((m, idx) => {
                                                                    let raw = m.message ?? '';
                                                                    // try to parse sender from the message if the server didn't provide one
                                                                    let parsedSender: string | null = null;
                                                                    let parsedMessage = raw;
                                                                    const match = raw.match(/^\s*([^:]{1,60}):\s*(.*)$/);
                                                                                        if (match && match[1]) {
                                                                                            parsedSender = String(match[1]).trim();
                                                                                            parsedMessage = String(match[2] || '');
                                                                                        }
                                                                    // provisional sender (server-provided or parsed)
                                                                    let provisionalSender = (m.sender && m.sender.length) ? m.sender : parsedSender;
                                                                    // consider a message 'own' if provisional sender matches OR if the raw message starts with "username: "
                                                                    const isOwn = Boolean(username && ((provisionalSender && provisionalSender === username) || (raw.startsWith(`${username}: `))));
                                                                    // if it's own and we still don't have a sender, use username so header shows
                                                                    if (isOwn && !provisionalSender) provisionalSender = username;
                                                                    // display should be the parsedMessage (without sender prefix)
                                                                    let display = parsedMessage;
                            // render username + time header for received messages
                            const timeFull = new Date(m.timestamp).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                            return (
                                <div className={`nx-chat-row ${isOwn ? 'sent' : 'received'}`} key={`${idx}-${m.message}`}>
                                    {/* header above bubble for both sent and received messages */}
                                    {provisionalSender ? (
                                        <div className="nx-chat-header" title={timeFull}>
                                            <div className="nx-chat-username">{provisionalSender}</div>
                                            {m.admin ? <div className="nx-chat-admin" style={{ margin: '0 6px', padding: '2px 6px', background: '#b91c1c', color: 'white', borderRadius: 6, fontSize: 12 }}>Admin</div> : null}
                                            <div className="nx-chat-time">{timeFull}</div>
                                        </div>
                                    ) : null}
                                    <div className={`nx-chat-bubble ${isOwn ? 'sent' : 'received'}`}>
                                        <div className="nx-chat-text">{display}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <form className="nx-chat-input-area" onSubmit={submit}>
                        <div className="nx-chat-input">
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (sendCooldown || !username || !message.trim())) {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                        </div>
                            <button className="nx-send-btn" type="submit" disabled={!username || !message.trim() || sendCooldown}>Send</button>
                    </form>
                </div>
            </div>
        </main>
    );
}