"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "~/app/_components/loading/LoadingScreen";
import { io, type Socket } from "socket.io-client";

function getCookie(name: string): string | null {
    const match = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(name + "="));
    if (!match) return null;
    return decodeURIComponent(match.split("=")[1] ?? "");
}

type ChatMessage = {
    text: string;
    email: string;
    username: string;
    admin_attr: boolean;
    ts: number;
    
};

export default function ForumPage() {
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [checking, setChecking] = useState(true);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState("");
    const [sock, setSock] = useState<Socket | null>(null);

    useEffect(() => {
        const tokenEmail = getCookie("access_token");
        if (!tokenEmail) {
            router.replace("/login");
            return;
        }
        setEmail(tokenEmail);
        setChecking(false);
    }, []);

    useEffect(() => {

        const rawEnvUrl =
            process.env.WEBSOCKET_URL ||
            "http://localhost:8000";

        const normalizeSocketUrl = (u: string) => {
            try {
                if (u.startsWith("ws://")) return "http://" + u.slice(5);
                if (u.startsWith("wss://")) return "https://" + u.slice(6);
                return u;
            } catch {
                return u;
            }
        };

        const url = normalizeSocketUrl(rawEnvUrl);
        const s = io(url, { path: "/message" });
        setSock(s);

        const onChatMessage = (msg: ChatMessage) => {
            setMessages((prev) => [...prev, msg]);
        };

        s.on("chat:message", onChatMessage);

        return () => {
            s.off("chat:message", onChatMessage);
            s.disconnect();
        };
    }, []);
    const handleLogout = () => {
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/login");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email || !sock) return;
        const text = message.trim();
        if (!text) return;
        sock.emit("chat:message", { email, text });
        setMessage("");
    };

    if (checking) {
        return <LoadingScreen />;
    }

    return (
        <main className="bg-black text-white font-sans min-h-screen overflow-x-hidden relative">
            {/* Animated Grid Background (matches home theme) */}
            <div
                className="fixed inset-0 opacity-30 -z-10"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,240,255,0.1) 1px, transparent 1px),
                                     linear-gradient(90deg, rgba(0,240,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                    animation: 'grid-move 20s linear infinite'
                }}
            />

            <style jsx>{`
                @keyframes grid-move {
                  0% { transform: translate(0, 0); }
                  100% { transform: translate(50px, 50px); }
                }
                @keyframes glow {
                  from { filter: drop-shadow(0 0 20px rgba(0,240,255,0.5)); }
                  to { filter: drop-shadow(0 0 30px rgba(138,43,226,0.8)); }
                }
              `}</style>

            <section className="min-h-screen flex items-center justify-center py-14">
                <div className="w-full max-w-5xl mx-auto px-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h1
                            className="text-3xl md:text-4xl font-black"
                            style={{
                                lineHeight: '1',
                                background: 'linear-gradient(135deg, #00f0ff 0%, #8a2be2 50%, #ff00ff 100%)',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                animation: 'glow 2s ease-in-out infinite alternate'
                            }}
                        >
                            Nexus Logs
                        </h1>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                            style={{
                                background: 'linear-gradient(135deg, #8a2be2, #00f0ff)',
                                boxShadow: '0 4px 20px rgba(0,240,255,0.25)'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,240,255,0.45)')}
                            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,240,255,0.25)')}
                        >
                            Logout
                        </button>
                    </div>

                    {/* Chat Panel */}
                    <div
                        className="rounded-2xl backdrop-blur-sm"
                        style={{
                            background: 'rgba(0,240,255,0.03)',
                            border: '1px solid rgba(0,240,255,0.15)'
                        }}
                    >
                        {/* Messages */}
                        <div >
                            {messages.length === 0 && (
                                <div className="text-center text-slate-400 py-8">No messages yet. Be the first to say hi.</div>
                            )}
                            {messages.map((m, idx) => (
                                <div
                                    key={`${m.ts}-${m.email}-${idx}`}
                                    className="p-3 rounded-xl border border-white/5 bg-black/40"
                                    style={{ boxShadow: 'inset 0 0 20px rgba(0,240,255,0.04)' }}
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-cyan-400 font-semibold">{m.username}</span>
                                        {m.admin_attr && (
                                            <span
                                                className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold"
                                                style={{
                                                    background: 'rgba(255,0,255,0.12)',
                                                    border: '1px solid rgba(255,0,255,0.35)',
                                                    color: '#ff7bff'
                                                }}
                                            >
                                                ADMIN
                                            </span>
                                        )}
                                        <span className="text-slate-400 text-xs">• {new Date(m.ts).toLocaleString()}</span>
                                    </div>
                                    {m.text && (
                                        <div className="text-slate-200 text-sm whitespace-pre-wrap">
                                            {m.text}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Composer */}
                        <form onSubmit={handleSubmit} className="p-4 md:p-6 border-t border-cyan-400/10">
                            <div className="flex gap-3 items-center">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="flex-1 bg-black/50 text-white rounded-xl px-4 py-3 outline-none"
                                    style={{ border: '1px solid rgba(0,240,255,0.15)' }}
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 rounded-xl font-semibold transition-all"
                                    style={{
                                        background: 'linear-gradient(135deg, #00f0ff, #8a2be2)',
                                        boxShadow: '0 4px 20px rgba(0,240,255,0.25)'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,240,255,0.45)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,240,255,0.25)')}
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
}

