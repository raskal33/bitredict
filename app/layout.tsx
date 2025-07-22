import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppWalletProvider from "./AppWalletProvider";
import AppWagmiProvider from "./WagmiProvider";
import ClientOnly from "@/components/ClientOnly";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bitredict",
  description: "Decentralized prediction market platform",
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

// Global BigInt serialization fix
if (typeof globalThis !== 'undefined') {
  // Add BigInt to global if needed for serialization
  if (typeof BigInt !== 'undefined') {
    (BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function(this: bigint) {
      return this.toString();
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientOnly>
          <AppWagmiProvider>
            <AppWalletProvider>
              {children}
            </AppWalletProvider>
          </AppWagmiProvider>
        </ClientOnly>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1a1a1a",
              color: "#fff",
              border: "1px solid #333",
            },
          }}
        />
      </body>
    </html>
  );
}
