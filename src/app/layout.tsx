import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppToaster from '@/components/ui/Toaster'
import Pwa from '@/components/providers/Pwa'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "Ratio Tuta - Modern Inventory & Financial Management System",
    template: "%s | Ratio Tuta"
  },
  description: "Secure, modern inventory tracking and financial management for teams. Real-time stock management, POS system, team collaboration, and comprehensive reporting. Built with Next.js and TypeScript.",
  keywords: [
    // Primary keywords
    "inventory management",
    "inventory management system",
    "inventory software",
    "financial management",
    "financial management software",
    "POS system",
    "point of sale system",
    "stock tracking",
    "stock management",

    // Feature keywords
    "team collaboration",
    "receipt management",
    "warehouse management",
    "business management",
    "sales tracking",
    "real-time inventory",
    "inventory control",
    "stock control software",

    // Use case keywords
    "small business inventory",
    "retail inventory management",
    "restaurant POS system",
    "multi-location inventory",
    "inventory tracking app",

    // Local SEO
    "inventory management Lithuania",
    "atsargų valdymas",
    "finansų valdymas",

    // Technology keywords
    "cloud inventory software",
    "web-based POS",
    "online inventory system",
    "inventory management SaaS",
  ],
  authors: [{ name: "Tomas Dudovicius", url: "https://github.com/parukom" }],
  creator: "Tomas Dudovicius",
  publisher: "Ratio Tuta",

  // Open Graph (Facebook, LinkedIn)
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["lt_LT"],
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: "Ratio Tuta - Modern Inventory & Financial Management",
    description: "Secure inventory tracking and financial management system for modern teams. Real-time stock control, POS, and comprehensive reporting.",
    siteName: "Ratio Tuta",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ratio Tuta - Inventory Management System",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Ratio Tuta - Modern Inventory & Financial Management",
    description: "Secure inventory tracking and financial management for teams. Real-time stock control & comprehensive reporting.",
    images: ["/images/twitter-image.png"],
    creator: "@ratiotuta",
  },

  // Additional metadata
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Icons
  icons: {
    icon: [
      { url: "/images/icons/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/images/icons/icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },

  appleWebApp: {
    capable: true,
    title: "Ratio Tuta",
    statusBarStyle: "black-translucent",
  },

  // Verification (add your verification codes when you have them)
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  // },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className="h-full bg-gray-50 dark:bg-gray-900">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <AppToaster />
        <Pwa />
        {children}
      </body>
    </html>
  );
}
