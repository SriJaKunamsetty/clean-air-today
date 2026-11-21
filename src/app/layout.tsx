import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clean Air Today: smog-smart routines for your family",
  description: "Live air quality turned into daily routines, indoor air hacks and cleaner alternatives for your home.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
