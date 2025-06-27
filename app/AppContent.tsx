"use client";

import App from "./App";
import ProfileCreationModal from "@/components/ProfileCreationModal";
import Web3ModalInit from "@/components/Web3ModalInit";

export default function AppContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Web3ModalInit />
      <App>{children}</App>
      <ProfileCreationModal />
    </>
  );
} 