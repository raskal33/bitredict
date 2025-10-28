"use client";

import App from "./App";
import ProfileCreationModal from "@/components/ProfileCreationModal";
import NotificationToast from "@/components/NotificationToast";

export default function AppContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <App>{children}</App>
      <ProfileCreationModal />
      <NotificationToast />
    </>
  );
} 