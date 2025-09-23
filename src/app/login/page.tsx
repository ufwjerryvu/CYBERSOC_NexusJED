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
    <main>
      <h1>Login</h1>
      <form method="post" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}
