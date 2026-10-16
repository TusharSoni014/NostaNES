import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nostanes.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NostaNES - Online NES Super Game Collection & Web Emulator",
    template: "%s | NostaNES - Online NES Super Game Collection",
  },
  description:
    "Play your favorite classic 8-bit NES games online in your browser. NostaNES is the ultimate online NES super game collection with gamepad support, CRT shaders, save states, cheats, and mobile touch controls.",
  keywords: [
    "NES games online",
    "online NES super game collection",
    "play NES online",
    "Nintendo Entertainment System emulator",
    "retro 8-bit games browser",
    "classic NES games",
    "NES web emulator",
    "play retro games online",
    "NES save states cheats",
    "free NES games online",
    "retro gaming online",
    "play 8-bit games",
  ],
  applicationName: "NostaNES",
  category: "Games",
  classification: "Retro Gaming, NES Emulator, Classic Games",
  authors: [{ name: "NostaNES" }],
  creator: "NostaNES",
  publisher: "NostaNES",
  icons: {
    icon: [
      { url: "/nostanes.png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/nostanes.png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NostaNES",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "NostaNES",
    title: "NostaNES - Online NES Super Game Collection & Web Emulator",
    description:
      "Play classic 8-bit NES games online right in your browser. NostaNES features an authentic NES super game collection with gamepad support, CRT filters, save states, cheats, and mobile touch controls.",
    images: [
      {
        url: "/nostanes.png",
        width: 1200,
        height: 630,
        alt: "NostaNES - Online NES Super Game Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NostaNES - Online NES Super Game Collection & Web Emulator",
    description:
      "Play classic 8-bit NES games online right in your browser. Features save states, cheat codes, gamepad support, and mobile touch controls.",
    images: ["/nostanes.png"],
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
  themeColor: "#071422",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "NostaNES",
  alternateName: "Online NES Super Game Collection",
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript and HTML5 / WebAssembly support",
  description:
    "Play your favorite classic 8-bit NES games online in your browser. NostaNES is the ultimate online NES super game collection featuring save states, cheat codes, gamepad support, CRT shaders, and responsive mobile touch controls.",
  image: `${siteUrl}/nostanes.png`,
  url: siteUrl,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Online NES Super Game Collection",
    "In-browser NES WebAssembly emulation",
    "Save and load game states",
    "Libretro NES cheat codes support",
    "CRT scanline and retro display shaders",
    "USB / Bluetooth gamepad and mobile touch D-Pad controls",
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
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
