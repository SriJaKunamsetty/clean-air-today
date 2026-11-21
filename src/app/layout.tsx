import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clean Air Today: smog-smart routines for your family",
  description: "Live air quality turned into daily routines, indoor air hacks and cleaner alternatives for your home.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading request headers opts this route into dynamic rendering, which lets Next.js
  // attach the per-request CSP nonce (set in src/proxy.ts) to its framework scripts.
  await headers();
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
