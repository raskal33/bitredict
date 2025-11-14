"use client";

import App from "./App";
import ProfileCreationModal from "@/components/ProfileCreationModal";
import NotificationToast from "@/components/NotificationToast";
import { OddysseyLiveUpdates } from "@/components/OddysseyLiveUpdates";
import { SDSConnectionIndicator } from "@/components/SDSConnectionIndicator";
import { SDSDebugPanel } from "@/components/SDSDebugPanel";

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
      {/* Debug panel - only in development */}
      {process.env.NODE_ENV === 'development' && <SDSDebugPanel />}
    </>
  );
} 