"use client";

import App from "./App";
import ProfileCreationModal from "@/components/ProfileCreationModal";
import NotificationToast from "@/components/NotificationToast";
import { OddysseyLiveUpdates } from "@/components/OddysseyLiveUpdates";
import { LiveActivity } from "@/components/LiveActivity";
import { UniversalNotifications } from "@/components/UniversalNotifications";

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
      {/* Universal Notifications - handles all event types with unique IDs */}
      <UniversalNotifications />
      {/* Live Activity Panel - shows real-time events (bets, pools, liquidity) */}
      <LiveActivity />
    </>
  );
} 