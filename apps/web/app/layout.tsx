import type { Metadata } from "next";
// import { Space_Grotesk, JetBrains_Mono } from "next/font/google"; // Disabled for build stability
import "./globals.css";
import { ClientProviders } from "./providers/ClientProviders";

const spaceGrotesk = { variable: "font-sans" };
const jetbrainsMono = { variable: "font-mono" };

// const spaceGrotesk = Space_Grotesk({
//   variable: "--font-space-grotesk",
//   subsets: ["latin"],
//   weight: ["300", "400", "500", "600", "700"],
// });

// const jetbrainsMono = JetBrains_Mono({
//   variable: "--font-jetbrains-mono",
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700"],
// });

export const metadata: Metadata = {
  title: "The Pontiff - Unified Command Console",
  description: "The first AI-native casino. Submit your wager to the eternal ledger.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-display bg-background-dark text-white antialiased" suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
