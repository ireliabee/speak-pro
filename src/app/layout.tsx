import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted variable fonts (Fontsource builds, OFL-licensed) so builds never
// depend on Google Fonts being reachable.
const inter = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});
const fraunces = localFont({
  src: "./fonts/fraunces-latin-wght-normal.woff2",
  variable: "--font-fraunces",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpeakPro — Elite Communication Trainer",
  description:
    "SpeakPro by iReliabee: a guided journey through the elite-communication frameworks, one chapter at a time.",
};

export const viewport: Viewport = {
  themeColor: "#0b0f17",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
