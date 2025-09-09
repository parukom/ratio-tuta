import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppToaster from '@/components/ui/Toaster'
import Pwa from '@/components/providers/Pwa'
import { NextIntlClientProvider } from "next-intl";
import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ratio Tuta",
  description: "secure account/calculations, management",
  manifest: "/manifest.webmanifest",
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
  themeColor: "#111827",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Resolve locale: cookie -> Accept-Language -> default
  let locale: Locale = defaultLocale;
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;
  if (isLocale(cookieLocale)) locale = cookieLocale;
  else {
    const accept = (await headers()).get("accept-language") || "";
    const preferred = accept.split(",").map(s => s.trim().split(";")[0])[0];
    const short = preferred?.slice(0, 2).toLowerCase();
    if (isLocale(short)) locale = short;
  }

  const messages = await getMessages(locale);

  return (
    <html lang={locale} className="h-full bg-gray-50 dark:bg-gray-900">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppToaster />
          <Pwa />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
