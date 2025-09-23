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
			<main className="bg-black text-white font-sans min-h-screen overflow-x-hidden relative">
				
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
					<div className="relative z-10 p-8 max-w-5xl w-full">
						<h1
							className="text-5xl md:text-6xl font-black mb-6"
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
							COMMUNITY FORUM
						</h1>

						<div
							className="mb-6 px-4 py-2 inline-block rounded-full backdrop-blur-sm"
							style={{
								background: "rgba(0,240,255,0.08)",
								border: "1px solid rgba(0,240,255,0.2)",
							}}
						>
							{email ? <span>Signed in as {email}</span> : <span>Guest</span>}
						</div>

						<div className="mb-8">
							<button
								onClick={handleLogout}
								className="px-6 py-2 rounded-full font-semibold"
								style={{
									background: "linear-gradient(135deg, #00f0ff, #8a2be2)",
									boxShadow: "0 4px 20px rgba(0,240,255,0.3)",
								}}
							>
								Logout
							</button>
						</div>

						<section
							className="p-6 rounded-2xl backdrop-blur-sm"
							style={{
								background: "rgba(0,240,255,0.03)",
								border: "1px solid rgba(0,240,255,0.15)",
							}}
						>
							<h2 className="text-2xl font-bold text-cyan-400 mb-4">Posts</h2>
							<p className="text-slate-400">
								This is a placeholder forum page. Add your posts list here.
							</p>
						</section>
					</div>
				</section>
			</main>
		);
}

