import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Galabau Eifler",
  description: "Rechnungen, Angebote und Übersicht für Kevin.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500;6..72,600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
