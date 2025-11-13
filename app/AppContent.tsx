"use client";

import App from "./App";
import ProfileCreationModal from "@/components/ProfileCreationModal";
import NotificationToast from "@/components/NotificationToast";
import { OddysseyLiveUpdates } from "@/components/OddysseyLiveUpdates";
import { SDSConnectionIndicator } from "@/components/SDSConnectionIndicator";

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
      <OddysseyLiveUpdates />
      <SDSConnectionIndicator />
    </>
  );
} 