"use client";

import App from "./App";
import ProfileCreationModal from "@/components/ProfileCreationModal";
// import QueryProvider from "@/providers/QueryProvider";

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