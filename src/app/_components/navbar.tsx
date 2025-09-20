"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/styles/navbar.css";

export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false);
	const [authenticated, setAuthenticated] = useState(false);
	const router = useRouter();

	useEffect(() => {
		let mounted = true;
				async function check() {
					try {
						let res = await fetch('/api/auth/session', { credentials: 'include' });
						let data = await res.json();
						if (!data?.authenticated) {
							// try to refresh once
							try {
								const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
								if (r.ok) {
									res = await fetch('/api/auth/session', { credentials: 'include' });
									data = await res.json();
								}
							} catch (e) {
								// ignore
							}
						}
						if (mounted) setAuthenticated(Boolean(data?.authenticated));
					} catch (err) {
						if (mounted) setAuthenticated(false);
					}
				}
		check();

		function onAuthChange() { check(); }
		window.addEventListener('nexus-auth-changed', onAuthChange);
		window.addEventListener('storage', onAuthChange);

		return () => { mounted = false; window.removeEventListener('nexus-auth-changed', onAuthChange); window.removeEventListener('storage', onAuthChange); };
	}, []);

	return (
		<header className="nx-navbar" role="banner">
			<div className="nx-container">
				<Link href="/" className="nx-brand" aria-label="NexusCTF Home">
					<div className="nx-logo">
						<Image src="/favicon.ico" alt="NexusCTF" width={28} height={28} />
					</div>
					<span className="nx-title">NexusCTF</span>
				</Link>

				<button
					className={`nx-burger ${isOpen ? "nx-burger-open" : ""}`}
					aria-label="Toggle navigation"
					aria-expanded={isOpen}
					onClick={() => setIsOpen((v) => !v)}
				>
					<span />
					<span />
					<span />
				</button>

				<nav className={`nx-nav ${isOpen ? "nx-nav-open" : ""}`} aria-label="Primary">
					<Link href="/forum" className="nx-link" onClick={() => setIsOpen(false)}>
						Forum
					</Link>
					<Link href="/terminal" className="nx-link" onClick={() => setIsOpen(false)}>
						Terminal
					</Link>
					{authenticated ? (
						<button className="nx-cta" onClick={async () => {
							setIsOpen(false);
							try {
								await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
							} catch (e) {
								// ignore errors
							}
							// update local state and notify other tabs
							setAuthenticated(false);
							try { localStorage.setItem('nexus-auth', Date.now().toString()); window.dispatchEvent(new Event('nexus-auth-changed')); } catch (e) { /* ignore */ }
							router.push('/login');
						}}>
							Log out
						</button>
					) : (
						<Link href="/login" className="nx-cta" onClick={() => setIsOpen(false)}>
							Sign In
						</Link>
					)}
				</nav>
			</div>
			<div className="nx-glow" aria-hidden="true" />
		</header>
	);
}
