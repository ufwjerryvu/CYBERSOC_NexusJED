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
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <Navbar />
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Footer />
      </body>
    </html>
  );
}
