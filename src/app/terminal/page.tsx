'use client';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { AttachAddon } from '@xterm/addon-attach';
import { useEffect, useRef } from 'react';
import '@xterm/xterm/css/xterm.css';

export default function TerminalPage() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;
    
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0c0f17',
        foreground: '#e6f6ff',
        cursor: '#00f0ff',
        selectionBackground: 'rgba(0, 240, 255, 0.3)',
      }
    });
    
    termRef.current = term;
    
    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();
    
    // Connect to WebSocket
    try {
      wsRef.current = new WebSocket('ws://localhost:3001');
      
      wsRef.current.onopen = () => {
        const attachAddon = new AttachAddon(wsRef.current!);
        term.loadAddon(attachAddon);
        term.write('\x1b[32mConnected to terminal server\x1b[0m\r\n');
      };
      
      wsRef.current.onerror = () => {
        term.write('\x1b[31mFailed to connect to terminal server.\x1b[0m\r\n');
        term.write('Run: \x1b[33mnode server.js\x1b[0m in another terminal\r\n');
      };
    } catch (err) {
      term.write('\x1b[31mWebSocket connection failed\x1b[0m\r\n');
      console.log(err);
    }
    
    // Handle window resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      wsRef.current?.close();
      term.dispose();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#090b12] to-[#05060a] text-[#e6f6ff]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,240,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,240,255,0.08)_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />
        
        <div className="relative max-w-6xl mx-auto p-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black tracking-wider bg-gradient-to-r from-[#00f0ff] to-[#8a2be2] bg-clip-text text-transparent">
              Terminal
            </h1>
            <p className="text-[#8db3c7] mt-2">Full interactive terminal with real shell access</p>
          </div>
          
          <div className="rounded-2xl border border-[rgba(0,240,255,0.25)] bg-[#0c0f17] p-4 shadow-[inset_0_0_32px_rgba(0,240,255,0.05)]">
            <div className="flex gap-1.5 mb-3">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <div ref={terminalRef} className="h-[500px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
=======
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
