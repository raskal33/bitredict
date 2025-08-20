"use client";

// Remove Solana wallet imports since we're using Ethereum/Somnia
// import "@solana/wallet-adapter-react-ui/styles.css";
// import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
// import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
// import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// import { ... } from "@solana/wallet-adapter-wallets";
// import { clusterApiUrl } from "@solana/web3.js";
// import { useMemo } from "react";

export default function AppWalletProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Remove Solana wallet configuration since we're using Wagmi for Ethereum/Somnia
  // const network = WalletAdapterNetwork.Devnet;
  // const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  // const wallets = useMemo(() => [...], [network]);

  return (
    // Remove Solana wallet providers
    // <ConnectionProvider endpoint={endpoint}>
    //   <WalletProvider wallets={wallets} autoConnect={false}>
    //     <WalletModalProvider>
          {children}
    //     </WalletModalProvider>
    //   </WalletProvider>
    // </ConnectionProvider>
  );
}
