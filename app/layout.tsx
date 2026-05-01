import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GAUNTLET // 10 jeux, 0 défaite",
  description: "Dix jeux à enchaîner sans une seule défaite. Le défi ultime.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${display.variable} ${mono.variable}`}>
      <body>
        <div className="bg-grid" aria-hidden="true" />
        <div className="bg-scan" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
