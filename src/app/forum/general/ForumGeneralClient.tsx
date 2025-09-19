"use client";
import React, { useEffect, useState } from 'react';
import axios from "axios";
import { socket } from '@/env';

export default function ForumGeneralClient() {
    const [message, setMessage] = useState("");
        const [messages, setMessages] = useState<Array<{message: string; sender: string | null; timestamp: string}>>([]);
        const [username, setUsername] = useState<string | null>(null);
    useEffect(() => {
    socket.on("message", (msg) => {
            // msg can be either a string (old) or an object { message, sender }
            const now = new Date().toISOString();
            if (typeof msg === 'string') {
                setMessages(messages => [...messages, { message: msg, sender: null, timestamp: now }]);
            } else if (msg && typeof msg === 'object') {
                setMessages(messages => [...messages, { message: msg.message, sender: msg.sender || null, timestamp: now }]);
            }
    });
        return () => {
            socket.off("message");
        }
    }, []);
    useEffect(() => {
           
            (async () => {
                try {
                    const res = await fetch('/api/auth/me', { credentials: 'include' });
                    const data = await res.json();
                    if (data && typeof data.username === 'string') setUsername(data.username);
                } catch (err) {
                    console.error('Failed to load username', err);
                }
            })();
        }, []);
  const submit = async (e) => {
    e.preventDefault();
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
            // include sender derived from session
            await axios.post('http://localhost:8080/api/message', { message: finalMessage, sender: uname });
            setMessage("");
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
                    <div className="nx-chat-window">
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
                            const timeShort = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const timeFull = new Date(m.timestamp).toLocaleString();
                            return (
                                <div className={`nx-chat-row ${isOwn ? 'sent' : 'received'}`} key={`${idx}-${m.message}`}>
                                    {/* header above bubble for both sent and received messages */}
                                    {provisionalSender ? (
                                        <div className="nx-chat-header" title={timeFull}>
                                            <div className="nx-chat-username">{provisionalSender}</div>
                                            <div className="nx-chat-time">{timeShort}</div>
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
                            <input type="text" placeholder="Type your message..." value={message} onChange={e => setMessage(e.target.value)} />
                        </div>
                        <button className="nx-send-btn" type="submit" disabled={!username || !message.trim()}>Send</button>
                    </form>
                </div>
            </div>
        </main>
    );
}