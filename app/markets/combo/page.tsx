"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedTitle from "@/components/AnimatedTitle";
import MarketsList from "@/components/MarketsList";
import { Pool, ComboPool } from "@/hooks/usePools";
import { FaStar, FaCubes, FaCalculator } from "react-icons/fa";

export default function ComboMarketsPage() {
  const router = useRouter();
  const [selectedPool, setSelectedPool] = useState<Pool | ComboPool | null>(null);

  const handlePoolSelect = (pool: Pool | ComboPool) => {
    setSelectedPool(pool);
  };

  const handleCreateMarket = () => {
    router.push("/markets/create?type=combo");
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <AnimatedTitle>Combo Markets</AnimatedTitle>
        <p className="text-xl text-gray-300 mt-4 max-w-3xl mx-auto">
          Multi-event prediction markets where you bet on multiple outcomes simultaneously. 
          Higher risk, higher reward parlay-style betting with amplified returns.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Markets List */}
        <div className="lg:col-span-2">
          <MarketsList
            marketType="combo"
            poolType="combo"
            title="Combo Markets"
            description="Parlay-style markets where you predict multiple outcomes for amplified odds and rewards."
            onPoolSelect={handlePoolSelect}
            onCreateMarket={handleCreateMarket}
          />
        </div>

        {/* Sidebar - Pool Details or Combo Info */}
        <div className="lg:col-span-1">
          {selectedPool ? (
            <div className="glass-card p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <FaStar className="h-5 w-5 text-green-400" />
                <h3 className="text-xl font-bold text-white">Combo Pool Details</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Pool ID</label>
                  <p className="text-white font-medium">#{selectedPool.id}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Category</label>
                  <p className="text-white font-medium">{selectedPool.category}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Combined Odds</label>
                  <p className="text-2xl font-bold text-green-400">
                    {Number((selectedPool as ComboPool).combinedOdds) / 100}x
                  </p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Total Volume</label>
                  <p className="text-white font-medium">
                    {Number((selectedPool as ComboPool).totalCreatorSideStake || 0).toLocaleString()} BITR
                  </p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Conditions</label>
                  <p className="text-white font-medium">
                    {(selectedPool as ComboPool).conditions?.length || 0} Events
                  </p>
                </div>
                {'maxBetPerUser' in selectedPool && selectedPool.maxBetPerUser > 0 && (
                  <div>
                    <label className="text-gray-400 text-sm">Max Bet Per User</label>
                    <p className="text-white font-medium">
                      {Number(selectedPool.maxBetPerUser).toLocaleString()} BITR
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <FaCubes className="h-5 w-5 text-green-400" />
                <h3 className="text-xl font-bold text-white">Combo Markets</h3>
              </div>
              <div className="space-y-4 text-gray-300">
                <p>
                  Combo markets allow you to combine multiple predictions into a single bet, 
                  similar to sports parlays. All conditions must be correct to win.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FaCalculator className="h-4 w-4 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white">Multiplied Odds</h4>
                      <p className="text-sm">Individual odds are multiplied together for higher payouts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaStar className="h-4 w-4 text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white">All or Nothing</h4>
                      <p className="text-sm">All predictions must be correct to win anything</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaCubes className="h-4 w-4 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white">Multi-Event</h4>
                      <p className="text-sm">Combine 2-10 different market outcomes</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-600">
                  <h4 className="font-semibold text-white mb-2">Example:</h4>
                  <div className="bg-black/20 rounded-lg p-3 text-sm">
                    <p className="text-green-400 font-medium">Event A: 2.0x odds</p>
                    <p className="text-blue-400 font-medium">Event B: 1.5x odds</p>
                    <p className="text-purple-400 font-medium">Event C: 3.0x odds</p>
                    <div className="border-t border-gray-600 mt-2 pt-2">
                      <p className="text-yellow-400 font-bold">
                        Combined: 9.0x odds (2.0 × 1.5 × 3.0)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleCreateMarket}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all"
                  >
                    Create Combo Market
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 