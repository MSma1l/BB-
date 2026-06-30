import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

// Display / serif — headings, the brand wordmark, italic accents.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Body — UI text, labels, paragraphs.
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Balloons Breeze — Event décor in Moldova",
  description:
    "Corporation Balloons Breeze — weddings, birthdays, private and corporate event décor in Moldova. Hundreds of details, one goal: an atmosphere impossible to forget.",
  icons: { icon: "/assets/logo-bb.jpg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Default locale is Russian; the LocaleProvider can switch it client-side.
  return (
    <html lang="ru" className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
