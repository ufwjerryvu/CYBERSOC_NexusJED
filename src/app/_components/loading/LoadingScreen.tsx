"use client";

export default function LoadingScreen() {
  return (
    <main className="bg-black text-white font-sans min-h-screen overflow-x-hidden relative flex items-center justify-center">
    
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

      <div className="text-center p-8">
        <h1
          className="text-5xl font-black mb-4"
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
          LOADING
        </h1>
        <p className="text-slate-400">Please wait...</p>
      </div>
    </main>
  );
}
 
