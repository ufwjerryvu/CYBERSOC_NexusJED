"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "~/app/_components/loading/LoadingScreen";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const match = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("access_token="));
    const token = match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
    if (token) {
      router.replace("/forum");
      return;
    }
    setChecking(false);
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password
        }),
      });

      if (!res.ok) {
        if (res.status >= 500) {
          alert("Server is down, please try again later.");
        } else {
          alert("Invalid credentials, please try again.");
        }
        return;
      }

      document.cookie = `access_token=${encodeURIComponent(email)}; path=/`;
      router.push("/forum");
    } catch (err) {
      alert("Server is down, please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return <LoadingScreen />;
  }

  return (
    <main className="bg-black text-white font-sans min-h-screen overflow-x-hidden relative">
      {/* Animated Grid Background */}
      <div
        className="fixed inset-0 opacity-30 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,240,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          animation: "grid-move 20s linear infinite",
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

      <section className="min-h-screen flex items-center justify-center relative">
        <div className="relative z-10 p-8 w-full max-w-md">
          <h1
            className="text-5xl font-black mb-6 text-center"
            style={{
              lineHeight: 1,
              background:
                "linear-gradient(135deg, #00f0ff 0%, #8a2be2 50%, #ff00ff 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "glow 2s ease-in-out infinite alternate",
            }}
          >
            LOGIN
          </h1>

          <form
            method="post"
            onSubmit={handleSubmit}
            className="p-6 rounded-2xl backdrop-blur-sm"
            style={{
              background: "rgba(0,240,255,0.03)",
              border: "1px solid rgba(0,240,255,0.15)",
            }}
          >
            <div className="mb-4">
              <label htmlFor="email" className="block mb-1 text-slate-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-black text-white rounded"
                style={{ border: "1px solid rgba(0,240,255,0.15)" }}
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block mb-1 text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-black text-white rounded"
                style={{ border: "1px solid rgba(0,240,255,0.15)" }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 rounded-full font-semibold"
              style={{
                background: "linear-gradient(135deg, #00f0ff, #8a2be2)",
                boxShadow: "0 4px 20px rgba(0,240,255,0.3)",
              }}
            >
              {submitting ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
