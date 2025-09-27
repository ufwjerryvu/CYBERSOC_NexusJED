"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-black text-white font-sans overflow-x-hidden">
      {/* Animated Grid Background */}
      <div
        className="fixed inset-0 opacity-30 -z-10"
        style={{
          backgroundImage: `linear-gradient(rgba(0,240,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0,240,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }}
      />

      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(0,240,255,0.7); }
          70% { box-shadow: 0 0 0 10px rgba(0,240,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,240,255,0); }
        }
        @keyframes glow {
          from { filter: drop-shadow(0 0 20px rgba(0,240,255,0.5)); }
          to { filter: drop-shadow(0 0 30px rgba(138,43,226,0.8)); }
        }
      `}</style>

.

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative">
        <div className="relative z-10 text-center p-8 max-w-4xl mx-auto">
          {/* Presenter */}
          <div className="flex flex-col items-center gap-4 mb-8 opacity-90">
            <img
              src="/logo.png"
              alt="NexusCTF"
              className="h-auto w-[280px] object-contain"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.3))'
              }}
            />
            <p className="text-slate-400 tracking-wider font-medium">
              Jerry and Erik from<br></br> The University of Sydney Cybersecurity Society proudly present
            </p>
          </div>

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full mb-8 backdrop-blur-sm"
            style={{
              animation: 'float 3s ease-in-out infinite'
            }}
          >
            <span
              className="w-2 h-2 bg-cyan-400 rounded-full"
              style={{
                animation: 'pulse-ring 2s infinite'
              }}
            ></span>
            <span>NEXUSJED 2025</span>
          </div>

          {/* Title */}
          <h1
            className="text-6xl md:text-8xl font-black mb-6"
            style={{
              lineHeight: '1',
              background: 'linear-gradient(135deg, #00f0ff 0%, #8a2be2 50%, #ff00ff 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'glow 2s ease-in-out infinite alternate'
            }}
          >
            TERMINAL AND CHAT
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            45+ challenges • In-browser Linux terminal • Community forum • Elite cyber competition
          </p>

          {/* CTA Button */}
          <Link
            href="/terminal"
            className="inline-block px-10 py-4 text-white rounded-full font-semibold text-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #00f0ff, #8a2be2)',
              boxShadow: '0 4px 20px rgba(0,240,255,0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,240,255,0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,240,255,0.3)'}
          >
            USE THE TERMINAL
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section
        className="py-20"
        style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #000000 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-5">
          <h2
            className="text-5xl font-black text-center mb-12"
            style={{
              background: 'linear-gradient(135deg, #00f0ff, #8a2be2)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            PLATFORM FEATURES
          </h2>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Terminal Feature */}
            <div
              className="p-10 rounded-2xl backdrop-blur-sm"
              style={{
                background: 'rgba(0,240,255,0.03)',
                border: '1px solid rgba(0,240,255,0.15)'
              }}
            >
              <h3 className="text-3xl font-bold mb-4 text-cyan-400">
                Integrated Linux Terminal
              </h3>
              <p className="text-slate-400 mb-6">
                Spin up secure containerized shells to solve challenges without leaving your browser.
              </p>

              {/* Terminal */}
              <div
                className="bg-black rounded-xl p-4 font-mono"
                style={{
                  border: '1px solid rgba(0,240,255,0.15)',
                  boxShadow: 'inset 0 0 20px rgba(0,240,255,0.05)'
                }}
              >
                <div className="flex gap-1.5 mb-4 pb-2 border-b border-cyan-400/15">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
                <div className="text-cyan-400 text-sm leading-6">
                  $ whoami<br />
                  nexus_player<br />
                  $ nc challenge.nexusctf.com 31337<br />
                  NexusCTF{`{Challenge_Accepted}`}<br />
                  $ python3 exploit.py<br />
                  [+] Exploiting target...<br />
                  [+] Shell obtained!<br />
                  [*] Flag captured successfully
                </div>
              </div>
            </div>

            {/* Forum Feature */}
            <div
              className="p-10 rounded-2xl backdrop-blur-sm"
              style={{
                background: 'rgba(0,240,255,0.03)',
                border: '1px solid rgba(0,240,255,0.15)'
              }}
            >
              <h3 className="text-3xl font-bold mb-4 text-cyan-400">
                Community Forum
              </h3>
              <p className="text-slate-400 mb-6">
                Exchange hints, share strategies, and collaborate with fellow hackers in real-time.
              </p>

              {/* Forum Preview */}
              <div
                className="bg-black rounded-xl p-4"
                style={{ border: '1px solid rgba(0,240,255,0.15)' }}
              >
                {[
                  { user: '@cyber_ninja', text: 'Just solved the crypto challenge! The key rotation was tricky.' },
                  { user: '@hack_master', text: 'Anyone working on the web exploitation? Found an interesting vector...' },
                  { user: '@nexus_pro', text: 'Great teamwork everyone! Let\'s crack these challenges!' }
                ].map((post, i) => (
                  <div key={i} className="flex gap-4 p-3 border-b border-white/5 last:border-b-0">
                    <div className="w-10 h-10 rounded-full gradient-bg flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="text-cyan-400 font-semibold mb-1">{post.user}</div>
                      <div className="text-slate-400 text-sm">{post.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}