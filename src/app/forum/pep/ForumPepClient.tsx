"use client";
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import axios from "axios";
import { socket } from '@/env';

export default function ForumPepClient() {
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
    scrollToBottom();
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => scrollToBottom());
    }
    setTimeout(() => scrollToBottom(), 50);
  };
  const isAtBottom = () => {
    if (!chatRef.current) return false;
    const el = chatRef.current;
    const threshold = 64;
    return (el.scrollHeight - el.scrollTop - el.clientHeight) <= threshold;
  };

  useEffect(() => {
    const handler = (msg: any) => {
      const now = new Date().toISOString();
      if (msg && typeof msg === 'object' && typeof msg.channel === 'string' && msg.channel.toLowerCase() !== 'pep') {
        return;
      }
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
      const adminFlag = (msg && typeof msg === 'object' && typeof msg.admin === 'boolean')
        ? Boolean(msg.admin)
        : (own && isAdmin ? true : false);
      if (own) {
        const key = `${username ?? ''}|${bodyOnly}`;
        const ts = pendingOwn.current.get(key);
        if (ts && Date.now() - ts < 5000) {
          pendingOwn.current.delete(key);
          return;
        }
      }
      setMessages(prev => [...prev, { message: raw, sender, timestamp: now, admin: adminFlag }]);
      const wasAtBottom = !own && isAtBottom();
      if ((own || wasAtBottom) && chatRef.current) {
        setTimeout(() => { ensureScrollToBottom(); }, 0);
      }
    };
    socket.on("message:pep", handler);
    return () => { socket.off("message:pep", handler); };
  }, [username, isAdmin]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (data && typeof data.username === 'string') setUsername(data.username);
        if (data && typeof data.isAdmin === 'boolean') setIsAdmin(data.isAdmin);
      } catch (err) { console.error('Failed to load username', err); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoadingInit(true);
        const res = await fetch('/api/messages/pep?limit=15', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const items: Array<{message: string; sender: string | null; timestamp: string; admin?: boolean}> = data?.items ?? [];
          setMessages(items);
          const oldest = items && items.length > 0 ? items[0]!.timestamp : null;
          setOldestTs(oldest);
          setHasMore(items.length >= 15);
          ensureScrollToBottom();
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally { setLoadingInit(false); }
    })();
  }, []);

  useEffect(() => {
    return () => { if (cooldownTimerRef.current) { clearTimeout(cooldownTimerRef.current); cooldownTimerRef.current = null; } };
  }, []);

  useLayoutEffect(() => {
    if (loadingInit) return;
    if (!didInitScroll.current && messages.length > 0) {
      ensureScrollToBottom();
      didInitScroll.current = true;
    }
  }, [loadingInit, messages.length]);

  const handleScroll = async () => {
    if (!chatRef.current || loadingMore || !hasMore) return;
    if (chatRef.current.scrollTop > 20) return;
    if (!oldestTs) return;
    try {
      setLoadingMore(true);
      const minDelay = new Promise(res => setTimeout(res, 500));
      const before = encodeURIComponent(oldestTs);
      const res = await fetch(`/api/messages/pep?limit=15&before=${before}`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const older: Array<{message: string; sender: string | null; timestamp: string}> = data?.items ?? [];
      if (older.length === 0) {
        setHasMore(false);
        await minDelay;
        return;
      }
      const prev = chatRef.current;
      const prevScrollHeight = prev?.scrollHeight ?? 0;
      const prevTop = prev?.scrollTop ?? 0;
      setMessages(curr => { return [...older, ...curr]; });
      setTimeout(async () => {
        if (chatRef.current) {
          const newScrollHeight = chatRef.current.scrollHeight;
          chatRef.current.scrollTop = (newScrollHeight - prevScrollHeight) + prevTop;
        }
        await minDelay;
      }, 0);
      setOldestTs(older && older.length > 0 ? older[0]!.timestamp : oldestTs);
      if (older.length < 15) setHasMore(false);
    } catch (err) { console.error('Failed to load older messages', err); }
    finally { setLoadingMore(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendCooldown) return;
    if (!message || !message.trim()) return;
    try {
      let uname = username;
      if (!uname) {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          const data = await res.json();
          if (data && typeof data.username === 'string') { uname = data.username; setUsername(uname); }
        } catch (err) { console.error('Failed to fetch username before send', err); }
      }
      if (!uname) { console.error('Cannot send message: username not available'); return; }
      const finalMessage = uname + ": " + message;
      setSendCooldown(true);
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = setTimeout(() => setSendCooldown(false), 1000);
      const nowIso = new Date().toISOString();
      setMessages(prev => [...prev, { message: finalMessage, sender: uname, timestamp: nowIso, admin: isAdmin }]);
      setMessage("");
      pendingOwn.current.set(`${uname}|${message}`, Date.now());
      ensureScrollToBottom();
      await axios.post('/api/socket-proxy/message', { message: finalMessage, sender: uname, channel: 'pep', admin: isAdmin });
      try {
        await fetch('/api/messages/pep', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message })
        });
      } catch (err) { console.error('Failed to persist message', err); }
    } catch (err) { console.error('Failed to send message', err); }
  };

  return (
    <main>
      <div>
        <div>
          <br/>
        </div>
        <div className="nx-chat">
          <div className="nx-chat-window" ref={chatRef} onScroll={handleScroll} style={{ position: 'relative' }}>
            {loadingInit ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  <div style={{ fontSize: 14, opacity: 0.85 }}>Fetching Nexus logs…</div>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : null}
            {loadingMore ? (
              <div style={{ position: 'sticky', top: 0, display: 'flex', justifyContent: 'center', padding: '4px' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : null}
            {messages.map((m, idx) => {
              let raw = m.message ?? '';
              let parsedSender: string | null = null;
              let parsedMessage = raw;
              const match = raw.match(/^\s*([^:]{1,60}):\s*(.*)$/);
              if (match && match[1]) {
                parsedSender = String(match[1]).trim();
                parsedMessage = String(match[2] || '');
              }
              let provisionalSender = (m.sender && m.sender.length) ? m.sender : parsedSender;
              const isOwn = Boolean(username && ((provisionalSender && provisionalSender === username) || (raw.startsWith(`${username}: `))));
              if (isOwn && !provisionalSender) provisionalSender = username;
              let display = parsedMessage;
              const timeFull = new Date(m.timestamp).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
              return (
                <div className={`nx-chat-row ${isOwn ? 'sent' : 'received'}`} key={`${idx}-${m.message}`}>
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
