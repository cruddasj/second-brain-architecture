import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Second Brain Explorer",
  description: "A private knowledge graph for exploring a portable, Markdown-first second brain.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://use.fontawesome.com/releases/v6.7.2/css/all.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
