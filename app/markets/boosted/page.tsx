"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedTitle from "@/components/AnimatedTitle";
import MarketsList from "@/components/MarketsList";
import { Pool, ComboPool } from "@/hooks/usePools";

export default function BoostedMarketsPage() {
  const router = useRouter();
  const [selectedPool, setSelectedPool] = useState<Pool | ComboPool | null>(null);

  const handlePoolSelect = (pool: Pool | ComboPool) => {
    setSelectedPool(pool);
    // Could navigate to pool detail page or open modal
  };

  const handleCreateMarket = () => {
    router.push("/markets/create");
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <AnimatedTitle>Boosted Markets</AnimatedTitle>
        <p className="text-xl text-gray-300 mt-4 max-w-3xl mx-auto">
          Discover prediction markets with enhanced rewards through pool boosting. 
          These markets offer higher potential returns thanks to community contributions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Markets List */}
        <div className="lg:col-span-2">
          <MarketsList
            marketType="boosted"
            poolType="both"
            title="Boosted Markets"
            description="Markets with active boost pools that increase potential winnings for all participants."
            onPoolSelect={handlePoolSelect}
            onCreateMarket={handleCreateMarket}
          />
        </div>

        {/* Sidebar - Pool Details or Create Instructions */}
        <div className="lg:col-span-1">
          {selectedPool ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-8">
              <h3 className="text-xl font-bold text-white mb-4">Pool Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Pool Name</label>
                  <p className="text-white font-medium">
                    {'predictedOutcome' in selectedPool 
                      ? selectedPool.predictedOutcome 
                      : `Combo Pool #${selectedPool.id}`
                    }
                  </p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Category</label>
                  <p className="text-white font-medium">{selectedPool.category}</p>
                </div>
                {/* Add more pool details as needed */}
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-8">
              <h3 className="text-xl font-bold text-white mb-4">About Boosted Markets</h3>
              <div className="space-y-4 text-gray-300">
                <p>
                  Boosted markets feature additional reward pools contributed by the community. 
                  When you participate in these markets, you have the chance to win from both 
                  the main pool and the boost pool.
                </p>
                <p>
                  Boost pools are funded by users who want to incentivize participation in 
                  specific markets, creating win-win scenarios for everyone involved.
                </p>
                <div className="pt-4">
                  <h4 className="font-semibold text-white mb-2">How Boosts Work:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Anyone can add BITR to boost a market</li>
                    <li>• Boost rewards are distributed to winners</li>
                    <li>• Higher boosts attract more participants</li>
                    <li>• Boosts increase total prize pools</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 