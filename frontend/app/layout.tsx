import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SafeHands — Trustless Escrow on Stellar",
  description: "Decentralized escrow for freelancers and clients. Lock funds, approve work, release payment — powered by Stellar Soroban smart contracts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              border: "2px solid black",
              borderRadius: "0px",
              fontWeight: "bold",
              fontFamily: "monospace",
              boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
            },
            success: {
              duration: 4000,
              style: { background: "#bbf7d0" },
            },
            error: {
              duration: 5000,
              style: { background: "#fecaca" },
            },
          }}
        />
      </body>
    </html>
  );
}

