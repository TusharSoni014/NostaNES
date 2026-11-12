import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  GITHUB_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  THEME_COLOR,
  safeJsonLd,
} from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The Open Graph image comes from app/opengraph-image.tsx (built once at
// build time); X/Twitter falls back to it, so no image is listed here.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "play NES games online",
    "NES emulator online",
    "NES games in browser",
    "free NES games",
    "retro games online",
    "8-bit games online",
    "Nintendo Entertainment System emulator",
    "NES emulator with cheats",
    "NES save states",
    "play NES with gamepad",
    "NES emulator for mobile",
    "2 player NES online",
  ],
  applicationName: SITE_NAME,
  category: "Games",
  authors: [{ name: "Tushar Soni", url: GITHUB_URL }],
  creator: "Tushar Soni",
  publisher: SITE_NAME,
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/nostanes.png", type: "image/png" }],
    apple: [{ url: "/nostanes.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

// One linked graph, like lazee.dev: other pages point back to these @ids.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/nostanes.png`,
        width: 1254,
        height: 1254,
      },
      founder: { "@type": "Person", name: "Tushar Soni", url: GITHUB_URL },
      sameAs: [GITHUB_URL],
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      image: `${SITE_URL}/opengraph-image`,
      applicationCategory: "GameApplication",
      applicationSubCategory: "Emulator",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript and WebAssembly",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": `${SITE_URL}/#organization` },
      featureList: [
        "Play NES games in the browser with no download",
        "Load your own .nes or .zip ROM, kept on your device",
        "10 save slots plus a quick save per game",
        "Game Genie and raw memory cheats",
        "CRT scanline, arcade and LCD display filters",
        "Xbox, PlayStation, Switch Pro and generic gamepads",
        "Custom touch controls for phones and tablets",
        "2-player local play",
        "Fast forward up to 10x",
      ],
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
        />
      </head>
      <body className="h-dvh overflow-hidden">
        <QueryProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
