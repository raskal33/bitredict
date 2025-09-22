"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { usePools, Pool, ComboPool } from "@/hooks/usePools";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/button";
import { titleTemplatesService } from "@/services/title-templates";
import { 
  FaChartLine, 
  FaClock, 
  FaUsers,
  FaTrophy,
  FaLock,
  FaStar,
  FaBolt
} from "react-icons/fa";

interface MarketsListProps {
  marketType: "all" | "boosted" | "trending" | "private" | "combo";
  poolType?: "regular" | "combo" | "both";
  title: string;
  description: string;
  showCreateButton?: boolean;
  onPoolSelect?: (pool: Pool | ComboPool) => void;
  onCreateMarket?: () => void;
}

export default function MarketsList({
  marketType,
  poolType = "both",
  title,
  description,
  showCreateButton = true,
  onPoolSelect,
  onCreateMarket
}: MarketsListProps) {
  const { } = useAccount();
  const [pools, setPools] = useState<Pool[]>([]);
  const [comboPools, setComboPools] = useState<ComboPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPoolType, setSelectedPoolType] = useState<"regular" | "combo">(
    poolType === "combo" ? "combo" : "regular"
  );

  const poolsContract = usePools();

  const loadPools = useCallback(async () => {
    setLoading(true);
    try {
      // For trending markets, use the real-time API endpoint
      if (marketType === "trending") {
        try {
          const response = await fetch('/api/pools/trending?limit=50');
          const data = await response.json();
          
          if (data.success && data.data.pools) {
            // Convert API response to Pool format
            const trendingPools: Pool[] = data.data.pools.map((apiPool: Record<string, unknown>) => ({
              id: BigInt(String(apiPool.id || '0')),
              creator: String(apiPool.creator || ''),
              predictedOutcome: String(apiPool.predictedOutcome || ''),
              odds: Number(apiPool.odds || 0),
              creatorStake: BigInt(String(apiPool.creatorStake || '0')),
              totalCreatorSideStake: BigInt(String(apiPool.totalCreatorSideStake || '0')),
              maxBettorStake: BigInt(String(apiPool.maxBettorStake || '0')),
              totalBettorStake: BigInt(String(apiPool.totalBettorStake || '0')),
              result: String(apiPool.actualResult || ''),
              marketId: String(apiPool.marketId || ''),
              settled: Boolean(apiPool.isSettled || false),
              creatorSideWon: Boolean(apiPool.creatorSideWon || false),
              eventStartTime: BigInt(Math.floor(new Date(String(apiPool.eventStartTime || new Date())).getTime() / 1000)),
              eventEndTime: BigInt(Math.floor(new Date(String(apiPool.eventEndTime || new Date())).getTime() / 1000)),
              bettingEndTime: BigInt(Math.floor(new Date(String(apiPool.bettingEndTime || new Date())).getTime() / 1000)),
              resultTimestamp: BigInt(0),
              arbitrationDeadline: BigInt(0),
              league: String(apiPool.league || ''),
              category: String(apiPool.category || ''),
              region: String(apiPool.region || ''),
              isPrivate: Boolean(apiPool.isPrivate || false),
              maxBetPerUser: BigInt(String(apiPool.maxBetPerUser || '0')),
              usesBitr: Boolean(apiPool.usesBitr || false),
              filledAbove60: Boolean((apiPool.indexedData as Record<string, unknown>)?.fillPercentage as number >= 60 || false),
              oracleType: String(apiPool.oracleType) === 'GUIDED' ? 0 : 1
            }));
            
            setPools(trendingPools);
            setComboPools([]); // Trending API doesn't include combo pools yet
            return;
          }
        } catch (apiError) {
          console.error("Error fetching trending pools from API:", apiError);
          // Fall back to contract data if API fails
        }
      }

      // Fallback to contract data for non-trending or if API fails
      if (!poolsContract.poolCount && !poolsContract.comboPoolCount) return;
      
      const regularPools: Pool[] = [];
      const comboPools: ComboPool[] = [];

      // Helper functions defined inside useCallback
      const shouldIncludePool = (pool: Pool): boolean => {
        switch (marketType) {
          case "private":
            return pool.isPrivate;
          case "boosted":
            return !pool.isPrivate && poolsContract.getPoolBoost(Number(pool.id)).boostTier > 0;
          case "trending":
            return !pool.isPrivate && poolsContract.isPoolActive(pool);
          case "combo":
            return false; // Regular pools don't belong in combo section
          default:
            return true;
        }
      };

      const shouldIncludeComboPool = (comboPool: ComboPool): boolean => {
        switch (marketType) {
          case "private":
            return false; // Combo pools aren't private in current implementation
          case "boosted":
            return false; // Combo pools don't have boosts yet
          case "trending":
            return poolsContract.isComboPoolActive(comboPool);
          case "combo":
            return true;
          default:
            return true;
        }
      };

      const filterAndSortPools = (pools: Pool[]): Pool[] => {
        const filtered = [...pools];

        switch (marketType) {
          case "trending":
            // Sort by betting activity (total stake + creator support)
            filtered.sort((a, b) => {
              const aActivity = Number(a.totalCreatorSideStake) + Number(a.totalBettorStake);
              const bActivity = Number(b.totalCreatorSideStake) + Number(b.totalBettorStake);
              return bActivity - aActivity;
            });
            break;
          case "boosted":
            // Sort by boost amount
            filtered.sort((a, b) => {
              const aBoost = poolsContract.getPoolBoost(Number(a.id)).boostTier;
              const bBoost = poolsContract.getPoolBoost(Number(b.id)).boostTier;
              return bBoost - aBoost;
            });
            break;
          default:
            // Sort by creation time (newest first)
            filtered.sort((a, b) => Number(b.id) - Number(a.id));
        }

        return filtered;
      };

      const filterAndSortComboPools = (comboPools: ComboPool[]): ComboPool[] => {
        const filtered = [...comboPools];

        switch (marketType) {
          case "trending":
            // Sort by betting activity
            filtered.sort((a, b) => {
              const aActivity = Number(a.totalCreatorSideStake) + Number(a.totalBettorStake);
              const bActivity = Number(b.totalCreatorSideStake) + Number(b.totalBettorStake);
              return bActivity - aActivity;
            });
            break;
          default:
            // Sort by creation time (newest first)
            filtered.sort((a, b) => Number(b.id) - Number(a.id));
        }

        return filtered;
      };

      // Load regular pools
      if (poolType !== "combo") {
        for (let i = 0; i < Number(poolsContract.poolCount || 0); i++) {
          const { pool } = poolsContract.getPool(i);
          if (pool && shouldIncludePool(pool)) {
            regularPools.push(pool);
          }
        }
      }

      // Load combo pools
      if (poolType !== "regular") {
        for (let i = 0; i < Number(poolsContract.comboPoolCount || 0); i++) {
          const { comboPool } = poolsContract.getComboPool(i);
          if (comboPool && shouldIncludeComboPool(comboPool)) {
            comboPools.push(comboPool);
          }
        }
      }

      setPools(filterAndSortPools(regularPools));
      setComboPools(filterAndSortComboPools(comboPools));
    } catch (error) {
      console.error("Error loading pools:", error);
    } finally {
      setLoading(false);
    }
  }, [poolsContract, marketType, poolType]);

  useEffect(() => {
    loadPools();
  }, [poolsContract.poolCount, poolsContract.comboPoolCount, marketType, loadPools]);

  // Refresh trending pools every 30 seconds
  useEffect(() => {
    if (marketType === "trending") {
      const interval = setInterval(() => {
        loadPools();
      }, 30000); // 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [marketType, loadPools]);


  const getPoolTypeIcon = () => {
    switch (marketType) {
      case "boosted":
        return <FaBolt className="h-5 w-5 text-yellow-400" />;
      case "trending":
        return <FaTrophy className="h-5 w-5 text-orange-400" />;
      case "private":
        return <FaLock className="h-5 w-5 text-purple-400" />;
      case "combo":
        return <FaStar className="h-5 w-5 text-green-400" />;
      default:
        return <FaChartLine className="h-5 w-5 text-blue-400" />;
    }
  };

  const currentPools = selectedPoolType === "regular" ? pools : comboPools;
  const showPoolTypeToggle = poolType === "both" && marketType !== "combo";

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-8 border border-white/20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {getPoolTypeIcon()}
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {showPoolTypeToggle && (
            <div className="flex space-x-1 bg-black/20 rounded-lg p-1 w-full sm:w-auto">
              <button
                onClick={() => setSelectedPoolType("regular")}
                className={`py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none ${
                  selectedPoolType === "regular"
                    ? "bg-blue-500 text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Regular
              </button>
              <button
                onClick={() => setSelectedPoolType("combo")}
                className={`py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none ${
                  selectedPoolType === "combo"
                    ? "bg-blue-500 text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Combo
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-300 justify-center sm:justify-start">
            <FaUsers className="h-4 w-4" />
            <span className="text-sm sm:text-base">{currentPools.length} Markets</span>
          </div>
        </div>
      </div>

      <p className="text-gray-300 mb-6">{description}</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : currentPools.length === 0 ? (
        <div className="text-center py-12">
          <FaChartLine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No {title} Yet</h3>
          <p className="text-gray-400 mb-6">
            {marketType === "combo" 
              ? "Be the first to create a combo prediction market!"
              : `Be the first to create a ${marketType} prediction market!`
            }
          </p>
          {showCreateButton && onCreateMarket && (
            <Button
              onClick={onCreateMarket}
              className="bg-gradient-to-r from-blue-500 to-green-500"
            >
              Create Market
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentPools.map((pool, index) => {
            const isRegular = 'predictedOutcome' in pool;
            
            return (
              <motion.div
                key={isRegular ? Number((pool as Pool).id) : Number((pool as ComboPool).id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onPoolSelect?.(pool)}
                className="p-6 bg-black/20 hover:bg-black/30 rounded-xl border border-gray-600 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white">
                        {isRegular 
                          ? titleTemplatesService.generateProfessionalTitle(
                              (pool as Pool).predictedOutcome,
                              (pool as Pool).category || 'sports'
                            )
                          : `Combo Pool #${(pool as ComboPool).id}`
                        }
                      </h3>
                      
                      {/* Pool badges */}
                      <div className="flex items-center gap-2">
                        {marketType === "boosted" && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                            <FaBolt className="inline h-3 w-3 mr-1" />
                            Boosted
                          </span>
                        )}
                        {marketType === "private" && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/30">
                            <FaLock className="inline h-3 w-3 mr-1" />
                            Private
                          </span>
                        )}
                        {!isRegular && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                            <FaStar className="inline h-3 w-3 mr-1" />
                            Combo
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Category: {isRegular ? (pool as Pool).category : (pool as ComboPool).category}</span>
                      {isRegular && (
                        <span>League: {(pool as Pool).league || "General"}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">
                      {isRegular ? "Odds" : "Combined Odds"}
                    </div>
                    <div className="text-xl font-bold text-green-400">
                      {isRegular 
                        ? `${(pool as Pool).odds / 100}x`
                        : `${Number((pool as ComboPool).combinedOdds) / 100}x`
                      }
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-gray-400">
                      <FaUsers className="h-3 w-3" />
                      <span>{isRegular ? Number((pool as Pool).totalCreatorSideStake) + Number((pool as Pool).totalBettorStake) : Number((pool as ComboPool).totalCreatorSideStake) + Number((pool as ComboPool).totalBettorStake)} BITR</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <FaClock className="h-3 w-3" />
                      <span>
                        {new Date(Number((isRegular 
                            ? (pool as Pool).eventEndTime 
                            : (pool as ComboPool).eventEndTime) * BigInt(1000))).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {poolsContract.isPoolActive(pool as Pool) ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs font-medium rounded-full">
                        Ended
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
} 