"use client";

import App from "./App";
import ProfileCreationModal from "@/components/ProfileCreationModal";

export default function AppContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <App>{children}</App>
      <ProfileCreationModal />
    </>
  );
} 