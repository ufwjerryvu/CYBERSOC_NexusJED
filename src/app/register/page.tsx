"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import LoadingScreen from "~/app/_components/loading/LoadingScreen";
import Navbar from "../_components/global/Navbar";
import { useAuth } from "~/contexts/AuthContext";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user, loading, register } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/forum");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setSubmitting(false);
      return;
    }

    try {
      await register(email.toLowerCase(), username.toLowerCase(), password);
      router.push("/forum");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed, please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <LoadingScreen />;
  }

  return (
    <>
    <Navbar/>
    <main className="min-h-screen bg-gradient-to-b from-[#090b12] to-[#05060a] text-[#e6f6ff] overflow-x-hidden relative">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 opacity-35 -z-10 bg-[linear-gradient(to_right,rgba(0,240,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,240,255,0.08)_1px,transparent_1px)] bg-[size:32px_32px] grid-background" />

      <section className="min-h-screen flex items-center justify-center relative">
        <div className="relative z-10 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-[900] bg-gradient-to-r from-[#00f0ff] via-[#8a2be2] to-[#ff00ff] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.5)] inline-block">
              Register
            </h1>
            <div className="text-sm text-[#a0b3c5] mt-2 font-mono">~/auth/register</div>
          </div>

          <div className="rounded-2xl border border-[rgba(0,240,255,0.25)] bg-[#0c0f17] shadow-[inset_0_0_32px_rgba(0,240,255,0.05)] p-6">
            <div className="flex gap-1.5 mb-4 pb-2 border-b border-[rgba(0,240,255,0.15)]">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              <span className="ml-4 text-sm text-[#a0b3c5] font-mono">user creation protocol</span>
            </div>

            <form method="post" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block mb-2 text-[#a0b3c5] text-sm font-mono">
                  email:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7785] font-mono">$</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[rgba(0,0,0,0.7)] text-[#e6f6ff] rounded border border-[rgba(0,240,255,0.2)] pl-8 pr-4 py-3 outline-none font-mono text-sm focus:border-[rgba(0,240,255,0.5)] transition-colors"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block mb-2 text-[#a0b3c5] text-sm font-mono">
                  username:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7785] font-mono">$</span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[rgba(0,0,0,0.7)] text-[#e6f6ff] rounded border border-[rgba(0,240,255,0.2)] pl-8 pr-4 py-3 outline-none font-mono text-sm focus:border-[rgba(0,240,255,0.5)] transition-colors"
                    placeholder="hacker123"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block mb-2 text-[#a0b3c5] text-sm font-mono">
                  password:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7785] font-mono">$</span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[rgba(0,0,0,0.7)] text-[#e6f6ff] rounded border border-[rgba(0,240,255,0.2)] pl-8 pr-4 py-3 outline-none font-mono text-sm focus:border-[rgba(0,240,255,0.5)] transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block mb-2 text-[#a0b3c5] text-sm font-mono">
                  confirm:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7785] font-mono">$</span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[rgba(0,0,0,0.7)] text-[#e6f6ff] rounded border border-[rgba(0,240,255,0.2)] pl-8 pr-4 py-3 outline-none font-mono text-sm focus:border-[rgba(0,240,255,0.5)] transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded bg-[rgba(255,95,86,0.1)] border border-[rgba(255,95,86,0.3)] text-[#ff5f56] text-sm font-mono">
                  <span className="text-[#ff5f56]">error:</span> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 rounded bg-[rgba(0,240,255,0.2)] border border-[rgba(0,240,255,0.3)] text-[#00f0ff] font-mono text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[rgba(0,240,255,0.3)] hover:border-[rgba(0,240,255,0.5)]"
              >
                {submitting ? "creating account..." : "register"}
              </button>

              <div className="text-center text-sm font-mono">
                <span className="text-[#6b7785]"># existing user? </span>
                <Link href="/login" className="text-[#00f0ff] hover:text-[#8a2be2] transition-colors">
                  login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}