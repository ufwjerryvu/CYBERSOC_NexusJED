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



            <div>
                <div>


                    <div>

                        <div>
                            Nexus Logs
                        </div>
                        <div>
                            {messages.map((m, idx) => (
                                <div key={`${m.ts}-${m.email}-${idx}`}>
                                    <div>
                                        <div>
                                            <strong>{m.username}</strong>
                                            <span> • {new Date(m.ts).toLocaleString()}</span>
                                        </div>
                                        <div>{m.text}</div>
                                    </div>
                                </div>
                            ))}

                    
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div>
                                <input type="text" placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} />
                            </div>
                            <button type="submit">Send</button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}

