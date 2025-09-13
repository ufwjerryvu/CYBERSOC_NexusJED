import Link from "next/link";
import "@/styles/landing.css";

export default function TerminalPage() {
  return (
    <main className="nx-wrap nx-section">
      <h2>Terminal</h2>
      <p>
        This page will host the in-browser Linux terminal for NexusCTF. For now it's a placeholder.
      </p>

      <div className="nx-card">
        <div className="nx-card-glow" />
        <h3>Start the terminal</h3>
        <p>When ready the terminal will securely launch a containerized shell directly in your browser.</p>
        <p>
          <Link href="/" className="nx-btn">Back to home</Link>
        </p>
      </div>
    </main>
  );
}
