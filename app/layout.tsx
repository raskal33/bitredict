import type { Metadata } from "next";
import "./globals.css";
import "@/styles/appkit-custom.css";
import { Onest } from "next/font/google";
import WalletProvider from "@/providers/WalletProvider";
import AppContent from "./AppContent";
import ScrollToTop from "@/components/ScrollToTop";

const onest = Onest({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-onest",
});

export const metadata: Metadata = {
  title: "BitRedict",
  description: "Decentralized prediction market on Somnia",
  keywords: ["prediction market", "blockchain", "somnia", "defi", "betting", "crypto"],
  authors: [{ name: "BitRedict Team" }],
  creator: "BitRedict",
  publisher: "BitRedict",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://bitredict.vercel.app'),
  openGraph: {
    title: "BitRedict - Decentralized Prediction Markets",
    description: "Trade on real-world outcomes with transparent, blockchain-powered markets on Somnia Network",
    url: "https://bitredict.vercel.app",
    siteName: "BitRedict",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "BitRedict - Prediction Markets",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BitRedict - Decentralized Prediction Markets",
    description: "Trade on real-world outcomes with transparent, blockchain-powered markets",
    creator: "@bitredict",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${onest.className} ${onest.variable} flex min-h-screen flex-col bg-bg-main text-text-primary antialiased`}
      >
        <WalletProvider>
          <ScrollToTop />
          <AppContent>{children}</AppContent>
        </WalletProvider>
      </body>
    </html>
  );
}
