"use client";

import Footer from "@/components/footer";
import Header from "@/components/header";
import WalletConnectionDebug from "@/components/WalletConnectionDebug";

export default function App({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className={`container-nav mx-auto my-16 grow`}>
        {children}
      </main>
      <Footer />
      <WalletConnectionDebug />
    </>
  );
}
