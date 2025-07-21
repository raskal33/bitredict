"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function MarketsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to trending markets as the default view
    router.replace("/markets/trending");
  }, [router]);

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-300 mt-4">Redirecting to Markets...</p>
        </div>
      </div>
    </div>
  );
}
