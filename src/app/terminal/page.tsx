'use client';

import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css";
import Navbar from "../_components/global/Navbar";

const TerminalPage = () => {
    const terminalRef = useRef<HTMLDivElement | null>(null);
    const termRef = useRef<Terminal | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const fitAddonRef = useRef<any>(null);

    useEffect(() => {
        const initTerminal = async () => {
            if (!terminalRef.current) return;

            const { Terminal } = await import("@xterm/xterm");
            const { FitAddon } = await import("@xterm/addon-fit");
            const { WebLinksAddon } = await import("@xterm/addon-web-links");

            const term = new Terminal({
                cursorBlink: true,
                fontSize: 14,
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                // Let the terminal auto-adjust to container size
                cols: 80, // Initial fallback
                rows: 24, // Initial fallback
                theme: {
                    background: "#0c0f17",
                    foreground: "#e6f6ff",
                    cursor: '#00f0ff',
                    selectionBackground: "rgba(0, 240, 255, 0.3)"
                }
            });

            termRef.current = term;

            const fitAddon = new FitAddon();
            const webLinksAddon = new WebLinksAddon();

            term.loadAddon(fitAddon);
            term.loadAddon(webLinksAddon);
            fitAddonRef.current = fitAddon;

            if (terminalRef.current) {
                term.open(terminalRef.current);
                
                // Initial fit with delay to ensure DOM is ready
                setTimeout(() => {
                    fitTerminal();
                }, 100);
            }

            // WebSocket connection
            try {
                const wsUrl = process.env.NODE_ENV === 'production'
                    ? `ws://${window.location.hostname}:5050`
                    : "ws://localhost:5050";
                wsRef.current = new WebSocket(wsUrl);

                wsRef.current.onopen = () => {
                    term.write("\x1b[32mConnected to terminal server\x1b[0m\r\n");
                    
                    // Send initial resize after connection
                    setTimeout(() => {
                        fitTerminal();
                    }, 200);
                };

                wsRef.current.onmessage = (event) => {
                    term.write(event.data);
                };

                wsRef.current.onerror = () => {
                    term.write('\x1b[31mFailed to connect to terminal server.\x1b[0m\r\n');
                    term.write('Run: \x1b[33mnode server.js\x1b[0m in another terminal\r\n');
                };

                // Terminal input handling
                term.onData((data) => {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(data);
                    }
                });

            } catch (err) {
                term.write('\x1b[31mWebSocket connection failed\x1b[0m\r\n');
                console.log(err);
            }

            // Fit terminal function
            const fitTerminal = () => {
                if (fitAddonRef.current) {
                    try {
                        fitAddonRef.current.fit();
                        sendResizeCommand(term, wsRef.current);
                        console.log(`Terminal resized to: ${term.cols}x${term.rows}`);
                    } catch (error) {
                        console.error('Error fitting terminal:', error);
                    }
                }
            };

            // Send resize command to backend
            const sendResizeCommand = (term: Terminal, ws: WebSocket | null) => {
                if (!ws || ws.readyState !== WebSocket.OPEN) return;
                
                const cols = term.cols;
                const rows = term.rows;
                
                if (cols > 0 && rows > 0) {
                    ws.send(`resize:${cols},${rows}`);
                }
            };

            // Event listeners for resizing
            const handleResize = () => {
                // Debounce resize events
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(fitTerminal, 100);
            };

            let resizeTimeout: NodeJS.Timeout;
            window.addEventListener("resize", handleResize);

            // Resize observer for container changes
            const resizeObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                        handleResize();
                    }
                }
            });

            if (terminalRef.current) {
                resizeObserver.observe(terminalRef.current);
            }

            // Also fit on initial load and when DOM is fully ready
            window.addEventListener('load', fitTerminal);
            document.addEventListener('DOMContentLoaded', fitTerminal);

            return () => {
                window.removeEventListener("resize", handleResize);
                window.removeEventListener('load', fitTerminal);
                document.removeEventListener('DOMContentLoaded', fitTerminal);
                resizeObserver.disconnect();
                wsRef.current?.close();
                term.dispose();
            };
        };

        initTerminal();
    }, []);

    return (
        <>
            <Navbar />

            <div className="min-h-screen bg-gradient-to-b from-[#090b12] to-[#05060a] text-[#e6f6ff] pt-16">
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,240,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,240,255,0.08)_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />
                    <div className="relative max-w-6xl mx-auto p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-5xl font-[900] bg-gradient-to-r from-[#00f0ff] via-[#8a2be2] to-[#ff00ff] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.5)] inline-block">
                                Terminal
                            </h1>
                        </div>

                        <div className="rounded-2xl border border-[rgba(0,240,255,0.25)] bg-[#0c0f17] p-4 shadow-[inset_0_0_32px_rgba(0,240,255,0.05)]">
                            <div className="flex gap-1.5 mb-3">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                            </div>
                            {/* Make sure the terminal container uses full available space */}
                            <div 
                                ref={terminalRef} 
                                className="h-[70vh] w-full min-h-[400px]"
                                style={{ 
                                    width: '100%', 
                                    height: '70vh', 
                                    minHeight: '400px',
                                    maxHeight: '90vh'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TerminalPage;
