"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import AnimatedTitle from "@/components/AnimatedTitle";
import MarketsList from "@/components/MarketsList";
import { Pool, ComboPool } from "@/hooks/usePools";
import { FaLock, FaKey, FaUserPlus, FaUsers } from "react-icons/fa";

export default function PrivateMarketsPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [selectedPool, setSelectedPool] = useState<Pool | ComboPool | null>(null);

  const handlePoolSelect = (pool: Pool | ComboPool) => {
    setSelectedPool(pool);
  };

  const handleCreateMarket = () => {
    router.push("/markets/create?type=private");
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <AnimatedTitle>Private Markets</AnimatedTitle>
        <p className="text-xl text-gray-300 mt-4 max-w-3xl mx-auto">
          Exclusive prediction markets accessible only to whitelisted participants. 
          These markets offer privacy and exclusivity for specialized communities.
        </p>
        
        {/* Duel Explanation */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6 mt-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 justify-center mb-4">
            <FaUsers className="h-6 w-6 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Perfect for Duels & Challenges</h3>
          </div>
          <p className="text-gray-300 text-lg">
            Create private 1v1 prediction duels where two people bet against each other on any topic. 
            Whether it&apos;s sports outcomes, market predictions, or personal challenges - settle debates 
            with skin in the game in a private, controlled environment.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-black/20 rounded-lg p-4">
              <h4 className="text-purple-400 font-semibold mb-2">Example Use Cases</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Sports predictions between friends</li>
                <li>• Stock market price bets</li>
                <li>• Personal achievement challenges</li>
                <li>• Academic or work performance wagers</li>
              </ul>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <h4 className="text-blue-400 font-semibold mb-2">Benefits</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Complete privacy and control</li>
                <li>• Custom participant whitelisting</li>
                <li>• Secure smart contract settlement</li>
                <li>• Transparent and immutable results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {!isConnected && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 text-orange-400">
            <FaLock className="h-5 w-5" />
            <h3 className="font-semibold">Wallet Connection Required</h3>
          </div>
          <p className="text-orange-300 mt-2">
            Connect your wallet to view private markets you have access to.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Markets List */}
        <div className="lg:col-span-2">
          <MarketsList
            marketType="private"
            poolType="regular"
            title="Private Markets"
            description="Whitelist-only markets that you have access to participate in."
            onPoolSelect={handlePoolSelect}
            onCreateMarket={handleCreateMarket}
          />
        </div>

        {/* Sidebar - Pool Details or Private Market Info */}
        <div className="lg:col-span-1">
          {selectedPool ? (
            <div className="glass-card p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <FaLock className="h-5 w-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Private Pool Details</h3>
              </div>
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
                  <label className="text-gray-400 text-sm">Access Level</label>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/30">
                      Whitelisted
                    </span>
                  </div>
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
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <FaKey className="h-5 w-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Private Markets</h3>
              </div>
              <div className="space-y-4 text-gray-300">
                <p>
                  Private markets are exclusive prediction pools that require whitelist access. 
                  They offer several advantages:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FaLock className="h-4 w-4 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white">Exclusivity</h4>
                      <p className="text-sm">Only invited participants can access and bet</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaUserPlus className="h-4 w-4 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white">Controlled Access</h4>
                      <p className="text-sm">Market creators manage participant lists</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaKey className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white">Custom Limits</h4>
                      <p className="text-sm">Special betting limits and rules</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-600">
                  <h4 className="font-semibold text-white mb-2">How to Get Access:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Contact the market creator</li>
                    <li>• Join communities that create private markets</li>
                    <li>• Create your own private markets</li>
                    <li>• Participate in events that grant access</li>
                  </ul>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleCreateMarket}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition-all"
                  >
                    Create Private Market
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