"use client";

export default function LoadingScreen() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#090b12] to-[#05060a] text-[#e6f6ff] overflow-x-hidden relative flex items-center justify-center">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 opacity-35 -z-10 bg-[linear-gradient(to_right,rgba(0,240,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,240,255,0.08)_1px,transparent_1px)] bg-[size:32px_32px] grid-background" />

      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(32px, 32px); }
        }
        .grid-background {
          animation: grid-move 20s linear infinite;
        }
        @keyframes glow {
          from { filter: drop-shadow(0 0 20px rgba(0,240,255,0.5)); }
          to { filter: drop-shadow(0 0 30px rgba(138,43,226,0.8)); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>

      <div className="text-center p-8">
        <div className="rounded-2xl border border-[rgba(0,240,255,0.25)] bg-[#0c0f17] shadow-[inset_0_0_32px_rgba(0,240,255,0.05)] p-8 max-w-md">
          <div className="flex gap-1.5 mb-6 pb-2 border-b border-[rgba(0,240,255,0.15)]">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            <span className="ml-4 text-sm text-[#a0b3c5] font-mono">~/system/loading</span>
          </div>

          <div className="space-y-4 font-mono">
            <div className="text-[#6b7785] text-sm">$ initializing nexusctf...</div>

            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-[#00f0ff] border-t-transparent rounded-full spin-slow"></div>
              <span className="text-[#00f0ff] text-lg font-bold">LOADING</span>
            </div>

            <div className="text-[#a0b3c5] text-sm">
              <div className="mb-1">Loading modules...</div>
              <div className="mb-1 text-[#6b7785]">[████████████████████] 100%</div>
              <div className="text-xs">Please wait while we prepare your environment</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
 
