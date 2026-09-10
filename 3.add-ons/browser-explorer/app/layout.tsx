import { appPath } from "../offline/paths.mjs";
import type { Metadata, Viewport } from "next";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import "./graph-mobile.css";
import BrainProvider from "./brain-provider";
import OfflineRegistration from "./offline-registration";

export const metadata: Metadata = {
  title: "Second Brain Explorer",
  manifest: appPath("/manifest.webmanifest"),
  referrer: "no-referrer",
  description: "A private knowledge graph for exploring a portable, Markdown-first second brain.",
  icons: {
    apple: appPath("/icon-192.png"),
    icon: appPath("/favicon.svg"),
    shortcut: appPath("/favicon.svg"),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><OfflineRegistration /><BrainProvider>{children}</BrainProvider></body>
    </html>
  );
}
