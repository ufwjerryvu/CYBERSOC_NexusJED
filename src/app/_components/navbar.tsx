"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import "@/styles/navbar.css";

export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false);

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
					<Link href="/api/auth/signin" className="nx-cta" onClick={() => setIsOpen(false)}>
						Sign In
					</Link>
				</nav>
			</div>
			<div className="nx-glow" aria-hidden="true" />
		</header>
	);
}
