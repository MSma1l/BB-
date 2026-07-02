import type { Metadata, Viewport } from "next";
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

const SITE_URL = "https://balloonsbreeze.md";
const TITLE = "Balloons Breeze — оформление праздников шарами в Молдове";
const DESCRIPTION =
  "Balloons Breeze — оформление свадеб, дней рождения, частных и корпоративных мероприятий воздушными шарами в Молдове (Кишинёв). Арки, фотозоны и композиции под ключ. Decor cu baloane Chișinău.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Balloons Breeze",
  },
  description: DESCRIPTION,
  applicationName: "Balloons Breeze",
  authors: [{ name: "Balloons Breeze" }],
  creator: "Balloons Breeze",
  publisher: "Balloons Breeze",
  category: "events",
  keywords: [
    "воздушные шары Кишинёв",
    "оформление праздников Молдова",
    "шары на свадьбу",
    "оформление дня рождения",
    "арка из шаров",
    "фотозона из шаров",
    "корпоративные мероприятия декор",
    "baloane Chișinău",
    "decor cu baloane Moldova",
    "balloon decor Moldova",
    "Balloons Breeze",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Balloons Breeze",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "ru_RU",
    alternateLocale: ["ro_RO", "en_US"],
    images: [
      {
        url: "/assets/nebula-bg.jpg",
        width: 1200,
        height: 630,
        alt: "Balloons Breeze — event décor in Moldova",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/assets/nebula-bg.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/assets/logo-bb.jpg" }],
    apple: "/assets/logo-bb.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: "#08040a",
  width: "device-width",
  initialScale: 1,
};

// Structured data — helps Google show the business as a local event-décor company.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#business`,
  name: "Balloons Breeze",
  description: DESCRIPTION,
  url: SITE_URL,
  logo: `${SITE_URL}/assets/logo-bb.jpg`,
  image: `${SITE_URL}/assets/nebula-bg.jpg`,
  telephone: "+37376616384",
  email: "balloonsbreeze@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressCountry: "MD",
    addressLocality: "Chișinău",
  },
  areaServed: { "@type": "Country", name: "Moldova" },
  priceRange: "$$",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Default locale is Russian; the LocaleProvider can switch it client-side.
  return (
    <html lang="ru" className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
