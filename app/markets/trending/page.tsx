"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedTitle from "@/components/AnimatedTitle";
import MarketsList from "@/components/MarketsList";
import { Pool, ComboPool } from "@/hooks/usePools";

export default function TrendingMarketsPage() {
  const router = useRouter();
  const [selectedPool, setSelectedPool] = useState<Pool | ComboPool | null>(null);

  const handlePoolSelect = (pool: Pool | ComboPool) => {
    setSelectedPool(pool);
  };

  const handleCreateMarket = () => {
    router.push("/markets/create");
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <AnimatedTitle>Trending Markets</AnimatedTitle>
        <p className="text-xl text-gray-300 mt-4 max-w-3xl mx-auto">
          The most active prediction markets right now. These markets are attracting 
          the highest betting volume and participant engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Markets List */}
        <div className="lg:col-span-2">
          <MarketsList
            marketType="trending"
            poolType="both"
            title="Trending Markets"
            description="Markets sorted by activity level - total stakes, creator support, and participant count."
            onPoolSelect={handlePoolSelect}
            onCreateMarket={handleCreateMarket}
          />
        </div>

        {/* Sidebar - Pool Details or Trending Info */}
        <div className="lg:col-span-1">
          {selectedPool ? (
            <div className="glass-card p-6 sticky top-8">
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
                <div>
                  <label className="text-gray-400 text-sm">Total Volume</label>
                  <p className="text-white font-medium">
                    {Number(('totalCreatorSideStake' in selectedPool ? Number(selectedPool.totalCreatorSideStake) : 0) + ('totalBettorStake' in selectedPool ? Number(selectedPool.totalBettorStake) : 0)).toLocaleString()} BITR
                  </p>
                </div>
                {'liquidityPool' in selectedPool && (
                  <div>
                    <label className="text-gray-400 text-sm">Creator Support Pool</label>
                    <p className="text-white font-medium">
                      {Number(selectedPool.liquidityPool).toLocaleString()} BITR
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 sticky top-8">
              <h3 className="text-xl font-bold text-white mb-4">Trending Markets</h3>
              <div className="space-y-4 text-gray-300">
                <p>
                  Trending markets are ranked by their activity level, which includes:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-white">Total Stakes</h4>
                      <p className="text-sm">Combined BITR/STT committed by all participants</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-white">Creator Support</h4>
                      <p className="text-sm">Supporters staking on the same side as the creator</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-white">Recent Activity</h4>
                      <p className="text-sm">New bets and market interactions</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-600">
                  <p className="text-sm">
                    Trending markets represent the pulse of the prediction community. 
                    High activity often indicates important or time-sensitive events.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 