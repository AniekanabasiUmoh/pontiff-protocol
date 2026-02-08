import type { Metadata } from "next";
import { Cinzel, Orbitron, Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "./providers/Web3Provider";
import { ToastProvider } from "./components/ToastProvider";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "The Pontiff - Confess Your Sins",
  description: "The Medieval Roast Bot that judges your crypto sins",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cinzel.variable} ${orbitron.variable} ${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <Web3Provider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
