import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import Navbar from "@/app/_components/navbar";
import Footer from "@/app/_components/footer";

import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "NexusCTF",
  description: "Cyber-themed CTF platform with forum and in-browser terminal.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} style={{ backgroundColor: '#05060a', color: '#e6f6ff' }}>
      <head>
        <meta name="theme-color" content="#05060a" />
        <link rel="preload" href="/critical.css" as="style" />
        <link rel="stylesheet" href="/critical.css" />
      </head>
      <body className="nx-app" style={{ background: 'var(--nx-bg)', color: 'var(--nx-text)' }}>
        <Navbar />
        <main className="nx-main">
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </main>
        <Footer />
      </body>
    </html>
  );
}
