import "~/styles/globals.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

import { type Metadata } from "next";
import { Lato } from "next/font/google";
import { AuthProvider } from "~/contexts/AuthContext";

// import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "NexusJED",
  description: "NexusCTF's extended forum and terminal platform",
  icons: {
    icon: "/icon.ico",
  },
};

const lato = Lato({
  weight: ['400', '700', '900'],
  subsets: ["latin"],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={lato.className}>
      <body>
        <AuthProvider>
          {/* <TRPCReactProvider>{children}</TRPCReactProvider> */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}