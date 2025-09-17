"use client";

import { useState, useEffect } from "react";
import "@/styles/login.css";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    // check session and redirect if already authenticated
    (async () => {
      try {
        let res = await fetch('/api/auth/session', { credentials: 'include' });
        let data = await res.json();
        if (!data?.authenticated) {
          try {
            const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
            if (r.ok) {
              res = await fetch('/api/auth/session', { credentials: 'include' });
              data = await res.json();
            }
          } catch (e) { }
        }
        if (data?.authenticated) router.push('/forum');
      } catch (err) {
        // ignore
      }
    })();
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Call server API to attempt sign-in (email + password)
    (async () => {
      try {
        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const txt = await res.text();
        let data: any = {};
        try { data = JSON.parse(txt); } catch (e) { /* ignore */ }

        if (!res.ok || !data.authenticated) {
        //  console.error('signin failed', txt);
          alert('Invalid credentials, please try again');
          return;
        }

        // broadcast auth change so Navbar updates in this tab and other tabs
        try {
          localStorage.setItem('nexus-auth', Date.now().toString());
          window.dispatchEvent(new Event('nexus-auth-changed'));
        } catch (e) {
          // ignore (e.g., SSR)
        }

        // on success redirect to forum
        router.push('/forum');
      } catch (err) {
        console.error(err);
        alert('Sorry, NEXUSJED servers got shot down by one of the enemy factions (Our server is down right now). Please try again later.');
      }
    })();
  }

  return (
    <main className="nx-login">
      <div className="nx-login-card">
        <h2>Sign in</h2>

        <form onSubmit={handleSubmit} className="nx-form">
          <label>
            <span className="nx-label-text">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com [CASE SENSITIVE]"
              required
            />
          </label>

          <label>
            <span className="nx-label-text">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>

          <div className="nx-form-actions">
            <button type="submit" className="nx-btn nx-btn-primary">Sign in</button>
            <button type="button" className="nx-btn nx-btn-ghost" onClick={() => { setEmail(""); setPassword(""); }}>Clear</button>
          </div>
        </form>
      </div>
    </main>
  );
}
