"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "~/app/_components/loading/LoadingScreen";
import Modal from "~/app/_components/modal/Modal";
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
    image?: string; // legacy single image
    images?: string[]; // preferred array of image URLs
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
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null); // for modal enlarge
    const [modalImage, setModalImage] = useState<string | null>(null); // for clicking chat images
    const [sending, setSending] = useState(false);
    const [sock, setSock] = useState<Socket | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const tokenEmail = getCookie("access_token");
        if (!tokenEmail) {
            router.replace("/login");
            return;
        }
        setEmail(tokenEmail);
        setChecking(false);
    }, []);

    // Load initial history
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/messages", { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data as ChatMessage[]);
                }
            } catch (e) {
                console.error("Failed to load history", e);
            }
        };
        load();
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

        // Upload images if provided (max 5)
        let imageUrls: string[] = [];
        if (imageFiles.length > 0) {
            for (const file of imageFiles) {
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("/api/upload", { method: "POST", body: fd });
                if (!res.ok) {
                    alert("Image upload failed");
                    return;
                }
                const data = await res.json();
                imageUrls.push(data.url as string);
            }
        }

        const text = message.trim();
        if (!text && imageUrls.length === 0) return;
        sock.emit("chat:message", { email, text, images: imageUrls });
        setMessage("");
        setImageFiles([]);
        setImagePreviews([]);
        setPreviewIndex(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        setSending(true);
        setTimeout(() => setSending(false), 500);
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
                                    {(() => {
                                        const imgs = (m.images && m.images.length > 0) ? m.images : (m.image ? [m.image] : []);
                                        return imgs.length > 0 ? (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {imgs.map((src, i) => (
                                                    <img
                                                        key={i}
                                                        src={src}
                                                        alt={`uploaded-${i}`}
                                                        className="h-40 w-40 object-cover rounded-lg border border-white/10 cursor-pointer"
                                                        onClick={() => setModalImage(src)}
                                                    />
                                                ))}
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            ))}
                        </div>

                        {/* Image Previews (above composer, like Discord). Up to 5 thumbnails. */}
                        {imagePreviews.length > 0 && (
                            <div className="px-4 md:px-6 pt-4">
                                <div className="flex gap-3 flex-wrap">
                                    {imagePreviews.map((src, idx) => (
                                        <div key={idx} className="relative bg-black/60 rounded-xl border border-white/10 p-2">
                                            <img
                                                src={src}
                                                alt={`selected-${idx}`}
                                                className="h-16 w-16 object-cover rounded-lg cursor-pointer"
                                                onClick={() => setPreviewIndex(idx)}
                                            />
                                            <button
                                                type="button"
                                                aria-label="Remove image"
                                                title="Remove image"
                                                onClick={() => {
                                                    setImageFiles((files) => files.filter((_, i) => i !== idx));
                                                    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
                                                    if (fileInputRef.current && imagePreviews.length === 1) {
                                                        fileInputRef.current.value = "";
                                                    }
                                                }}
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-white text-xs"
                                                style={{
                                                    background: 'linear-gradient(135deg, #8a2be2, #ff00ff)',
                                                    boxShadow: '0 4px 20px rgba(255,0,255,0.25)'
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Modal for enlarged preview */}
                                                <Modal
                                                    open={previewIndex !== null && !!imagePreviews[previewIndex]}
                                                    onClose={() => setPreviewIndex(null)}
                                                    ariaLabel="Image preview"
                                                >
                                                    {previewIndex !== null && imagePreviews[previewIndex] && (
                                                        <img
                                                            src={imagePreviews[previewIndex] as string}
                                                            alt="preview-large"
                                                            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl border border-white/10"
                                                        />
                                                    )}
                                                </Modal>

                        {/* Modal for clicking chat images */}
                        <Modal
                            open={!!modalImage}
                            onClose={() => setModalImage(null)}
                            ariaLabel="Image preview"
                            allowContentInteraction
                        >
                            {modalImage && (
                                <div className="flex flex-col items-center gap-4">
                                    <img
                                        src={modalImage}
                                        alt="chat-image-large"
                                        className="max-h-[75vh] max-w-[90vw] object-contain rounded-xl border border-white/10"
                                    />
                                    <a
                                        href={modalImage}
                                        download
                                        className="px-4 py-2 rounded-md text-sm font-semibold"
                                        style={{
                                            background: 'linear-gradient(135deg, #8a2be2, #00f0ff)',
                                            boxShadow: '0 4px 20px rgba(0,240,255,0.25)'
                                        }}
                                    >
                                        Download
                                    </a>
                                </div>
                            )}
                        </Modal>

                        {/* Composer */}
                        <form onSubmit={handleSubmit} className="p-4 md:p-6 border-t border-cyan-400/10">
                            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        const chosen = Array.from(e.target.files || []);
                                        if (chosen.length === 0) return;
                                        // Enforce max 5 images
                                        const room = Math.max(0, 5 - imageFiles.length);
                                        const toAdd = chosen.slice(0, room);
                                        if (toAdd.length < chosen.length) {
                                            alert("You can attach up to 5 images.");
                                        } else {
                                            setImageFiles((prev) => [...prev, ...toAdd]);
                                            setImagePreviews((prev) => [
                                                ...prev,
                                                ...toAdd.map((f) => URL.createObjectURL(f)),
                                            ]);
                                        }

                                    }}
                                />
                                {/* Camera button */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Attach image"
                                    className="px-4 py-3 rounded-xl font-semibold transition-all"
                                    style={{
                                        background: 'linear-gradient(135deg, #111, #1b1b2b)',
                                        border: '1px solid rgba(0,240,255,0.15)'
                                    }}
                                >
                                    Upload
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                        <path d="M9 2a1 1 0 0 0-.894.553L7.382 4H5a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-2.382l-.724-1.447A1 1 0 0 0 12.999 2H9zM12 18a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                                    </svg>
                                </button>
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
                                    disabled={sending}
                                    className="px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    style={{
                                        background: 'linear-gradient(135deg, #00f0ff, #8a2be2)',
                                        boxShadow: '0 4px 20px rgba(0,240,255,0.25)'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,240,255,0.45)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,240,255,0.25)')}
                                >
                                    {sending ? 'Sending…' : 'Send'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
}

