/**
 * Root Layout - NovaFlow Accounting
 * 
 * Senior Developer Note:
 * Dark Antigravity teması için optimize edilmiş root layout.
 * Tüm sayfalara global stiller ve fontlar uygulanır.
 * PWA desteği eklenmiştir.
 */

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

// Geist font family
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO Metadata
export const metadata: Metadata = {
  title: {
    default: "MEF Ön Muhasebe - Finansal Yönetim Sistemi",
    template: "%s | MEF Ön Muhasebe",
  },
  description: "Modern, kullanıcı dostu ön muhasebe ve finansal yönetim uygulaması.",
  keywords: ["muhasebe", "ön muhasebe", "finans", "fatura", "gelir gider", "MEF"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MEF Ön Muhasebe",
  },
  formatDetection: {
    telephone: false,
  },
};

// Viewport
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1a1a",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWAInstallPrompt />
        {children}
      </body>
    </html>
  );
}
