import Link from "next/link";
import "@/styles/landing.css";

export default async function Home() {
  return (
    <main>
      <section className="nx-hero">
        <div className="nx-grid" aria-hidden="true" />
        <div className="nx-hero-inner">
          <div className="nx-badge"><span className="nx-badge-dot" />
            Welcome to NexusCTF</div>
          <h1 className="nx-title-xl">
            The <span className="nx-gradient-text">cyber arena</span> for modern CTFs
          </h1>
          <p className="nx-subtext">
            Dive into challenges, discuss strategies in the forum, and practice directly in the in-browser Linux terminal.
          </p>
         
        </div>
      </section>

      <section className="nx-section">
        <div className="nx-wrap nx-grid-2">
          <div className="nx-card">
            <div className="nx-card-glow" />
            <h3>Integrated Linux Terminal</h3>
            <p>Spin up a secure containerized shell to solve challenges without leaving your browser.</p>
            <div className="nx-terminal" aria-label="Terminal preview">
              <div className="bar"><span className="dot" /><span className="dot" /><span className="dot" /></div>
              <pre>$ whoami
nexus_player
$ nc challenge.nexusctf.com 31337
FLAG{'{'}demo_flag_here{'}'}
</pre>
            </div>
          </div>
          <div className="nx-card">
            <div className="nx-card-glow" />
            <h3>Community Forum</h3>
            <p>Share writeups, exchange hints, and team up for live events with realtime threads.</p>
          </div>
        </div>
        <div className="nx-spacer" />
      </section>
    </main>
  );
}
