import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Bitredict",
  description: "System administration and monitoring dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {children}
    </div>
  );
}
