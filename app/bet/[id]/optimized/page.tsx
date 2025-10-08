"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
// import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { formatEther } from "viem";
import { useBetPageOptimization } from "@/hooks/useBetPageOptimization";
import { usePoolPrefetch } from "@/hooks/useMarketsQuery";
import SkeletonLoader from "@/components/SkeletonLoader";
import PoolTitleRow from "@/components/PoolTitleRow";
import CryptoTitleRow from "@/components/CryptoTitleRow";
import PoolStatusBanner from "@/components/PoolStatusBanner";
import { PoolExplanationService } from "@/services/poolExplanationService";
import { getMarketTypeString } from "@/services/contractDataMapping";

export default function OptimizedBetPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const poolId = parseInt(params.id as string);

  // Use optimized bet page hook
  const {
    pool,
    progress,
    isLoading,
    error,
    isError,
    navigateToPool,
    refetch
  } = useBetPageOptimization({ poolId });

  // Prefetch utilities
  const { prefetchPoolAndProgress } = usePoolPrefetch();

  // State for betting
  const [betAmount, setBetAmount] = useState("");
  const [isBetting, setIsBetting] = useState(false);

  // Handle pool selection with prefetch
  const handlePoolNavigation = useCallback(async (targetPoolId: number) => {
    console.log('🎯 Navigating to pool with prefetch:', targetPoolId);
    await prefetchPoolAndProgress(targetPoolId);
    navigateToPool(targetPoolId);
  }, [navigateToPool, prefetchPoolAndProgress]);

  // Handle betting
  const handleBet = useCallback(async (isForOutcome: boolean) => {
    if (!address || !pool || !betAmount) return;

    setIsBetting(true);
    try {
      console.log('🎯 Placing bet:', { poolId, amount: betAmount, isForOutcome });
      
      // TODO: Implement actual betting logic
      toast.success(`Bet placed: ${betAmount} for ${isForOutcome ? 'outcome' : 'against'}`);
      
      // Refresh data after bet
      refetch();
    } catch (error) {
      console.error('Bet failed:', error);
      toast.error('Bet failed. Please try again.');
    } finally {
      setIsBetting(false);
    }
  }, [address, pool, betAmount, poolId, refetch]);

  // Prefetch related pools on mount
  useEffect(() => {
    if (poolId) {
      // Prefetch nearby pools
      const prefetchPromises = [];
      for (let i = Math.max(1, poolId - 2); i <= poolId + 2; i++) {
        if (i !== poolId) {
          prefetchPromises.push(prefetchPoolAndProgress(i));
        }
      }
      Promise.allSettled(prefetchPromises);
    }
  }, [poolId, prefetchPoolAndProgress]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <SkeletonLoader type="bet-page" />
        </div>
      </div>
    );
  }

  if (isError || !pool) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="text-red-400 text-2xl mb-4">⚠️ Pool not found</div>
            <div className="text-gray-400 mb-8">
              {error?.message || 'This pool may have been removed or does not exist.'}
            </div>
            <button
              onClick={() => router.push('/markets')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Back to Markets
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generate pool explanation
  const explanationData = {
    id: poolId.toString(),
    homeTeam: pool.homeTeam,
    awayTeam: pool.awayTeam,
    league: pool.league,
    category: pool.category,
    region: pool.region,
    predictedOutcome: pool.predictedOutcome,
    odds: pool.odds,
    marketType: pool.marketType,
    eventStartTime: pool.eventStartTime,
    eventEndTime: pool.eventEndTime,
    usesBitr: parseFloat(pool.creatorStake || "0") / 1e18 >= 1000,
    creatorStake: pool.creatorStake
  };

  const poolExplanation = PoolExplanationService.generateExplanation(explanationData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pool Status Banner */}
        <PoolStatusBanner
          pool={{
            id: poolId,
            settled: pool.settled || false,
            creatorSideWon: pool.creatorSideWon,
            eventStartTime: pool.eventStartTime,
            eventEndTime: pool.eventEndTime,
            bettingEndTime: pool.eventStartTime,
            arbitrationDeadline: pool.eventEndTime + (7 * 24 * 60 * 60),
            result: pool.result || '',
            resultTimestamp: pool.resultTimestamp,
            oracleType: 'GUIDED',
            marketId: pool.marketId || ''
          }}
          className="mb-6"
        />

        {/* Title Section */}
        {poolExplanation && (
          pool.category === 'crypto' || pool.category === 'cryptocurrency' ? (
            <CryptoTitleRow
              asset={pool.homeTeam || 'BTC'}
              targetPrice={pool.predictedOutcome || '0'}
              direction={pool.predictedOutcome?.includes('above') ? 'above' : 'below'}
              timeframe="24h"
              odds={pool.odds}
              currency="STT"
              className="mb-6"
            />
          ) : (
            <PoolTitleRow
              title={`${pool.homeTeam || 'Team A'} vs ${pool.awayTeam || 'Team B'}`}
              currencyBadge={{
                type: parseFloat(pool.creatorStake || "0") / 1e18 >= 1000 ? 'BITR' : 'STT',
                color: parseFloat(pool.creatorStake || "0") / 1e18 >= 1000 ? 'text-yellow-400' : 'text-blue-400',
                bgColor: parseFloat(pool.creatorStake || "0") / 1e18 >= 1000 ? 'bg-yellow-500/20' : 'bg-blue-500/20'
              }}
              marketTypeBadge={{
                label: getMarketTypeString(pool.marketType),
                color: 'text-purple-400',
                bgColor: 'bg-purple-500/20'
              }}
              league={pool.league}
              time={new Date(pool.eventStartTime * 1000).toLocaleString()}
              odds={pool.odds.toString()}
              className="mb-6"
            />
          )
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pool Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Creator Prediction */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-4">Creator Prediction</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Prediction:</span>
                  <span className="text-white font-medium">{pool.predictedOutcome}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Odds:</span>
                  <span className="text-white font-medium">{pool.odds}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Creator Stake:</span>
                  <span className="text-white font-medium">
                    {parseFloat(formatEther(BigInt(pool.creatorStake || "0"))).toFixed(2)} 
                    {parseFloat(pool.creatorStake || "0") / 1e18 >= 1000 ? ' BITR' : ' STT'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pool Progress */}
            {progress && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-4">Pool Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Staked:</span>
                    <span className="text-white font-medium">
                      {parseFloat(formatEther(BigInt(progress.totalStaked || "0"))).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Bettor Count:</span>
                    <span className="text-white font-medium">{progress.bettorCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Creator Side:</span>
                    <span className="text-white font-medium">
                      {parseFloat(formatEther(BigInt(progress.creatorSideStake || "0"))).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Bettor Side:</span>
                    <span className="text-white font-medium">
                      {parseFloat(formatEther(BigInt(progress.bettorSideStake || "0"))).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Betting Interface */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-4">Place Your Bet</h3>
              
              {!address ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">Connect your wallet to place bets</div>
                  <button
                    onClick={() => {/* Connect wallet logic */}}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Bet Amount
                    </label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleBet(true)}
                      disabled={isBetting || !betAmount}
                      className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      {isBetting ? 'Betting...' : 'For Outcome'}
                    </button>
                    <button
                      onClick={() => handleBet(false)}
                      disabled={isBetting || !betAmount}
                      className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      {isBetting ? 'Betting...' : 'Against'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-4">Navigation</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handlePoolNavigation(poolId - 1)}
                  disabled={poolId <= 1}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  ← Previous Pool
                </button>
                <button
                  onClick={() => handlePoolNavigation(poolId + 1)}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Next Pool →
                </button>
                <button
                  onClick={() => router.push('/markets')}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Back to Markets
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
