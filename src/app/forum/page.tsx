"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "~/app/_components/loading/LoadingScreen";

function getCookie(name: string): string | null {
	const match = document.cookie
		.split(";")
		.map((c) => c.trim())
		.find((c) => c.startsWith(name + "="));
	if (!match) return null;
	return decodeURIComponent(match.split("=")[1] ?? "");
}

export default function ForumPage() {
	const router = useRouter();
	const [email, setEmail] = useState<string | null>(null);
	const [checking, setChecking] = useState(true);

	useEffect(() => {
		const tokenEmail = getCookie("access_token");
		if (!tokenEmail) {
			router.replace("/login");
			return;
		}
		setEmail(tokenEmail);
		setChecking(false);
	}, []);

	const handleLogout = () => {
		document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
		router.push("/login");
	};

		if (checking) {
			return <LoadingScreen />;
		}

		return (
		<main>
			<h1>Forum</h1>
			{email ? (
				<p>Welcome, {email}</p>
			) : (
				<p>Welcome, guest</p>
			)}
			<div>
				<button onClick={handleLogout}>Logout</button>
			</div>
			<section>
				<h2>Posts</h2>
				<p>This is a placeholder forum page. Add your posts list here.</p>
			</section>
		</main>
	);
}

