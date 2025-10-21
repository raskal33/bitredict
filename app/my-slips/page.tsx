"use client";

import { useAccount } from 'wagmi';
import UserSlipsDisplay from '@/components/UserSlipsDisplay';
import { useState, useEffect } from 'react';
import { OddysseyContractService, CycleInfo, DailyStats } from '@/services/oddysseyContractService';

export default function MySlipsPage() {
  const { address, isConnected } = useAccount();
  const [currentCycle, setCurrentCycle] = useState<CycleInfo | null>(null);
  const [cycleStats, setCycleStats] = useState<DailyStats | null>(null);

  useEffect(() => {
    const fetchCycleData = async () => {
      try {
        const [cycleInfo, stats] = await Promise.all([
          OddysseyContractService.getCurrentCycleInfo(),
          OddysseyContractService.getDailyStats(1) // Get stats for current cycle
        ]);
        
        setCurrentCycle(cycleInfo);
        setCycleStats(stats);
      } catch (error) {
        console.error('Error fetching cycle data:', error);
      }
    };

    fetchCycleData();
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <h1 className="text-4xl font-bold text-white mb-4">My Slips</h1>
              <p className="text-gray-300 mb-8">Connect your wallet to view your prediction slips</p>
              <div className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Connect Wallet
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Mobile-responsive Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Slips</h1>
            <p className="text-sm sm:text-base text-gray-300">Track your prediction performance and history</p>
          </div>

          {/* Mobile-optimized Current Cycle Info */}
          {currentCycle && (
            <div className="mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-3 sm:p-4 md:p-6 border border-blue-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">Current Cycle #{currentCycle.cycleId}</h2>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      currentCycle.state === 1 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {currentCycle.state === 1 ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  <div className="bg-gray-700/30 rounded-lg p-2 sm:p-3 md:p-4">
                    <div className="text-xs text-gray-400 mb-1">Prize Pool</div>
                    <div className="text-sm sm:text-base md:text-lg font-bold text-yellow-400">
                      {(currentCycle.prizePool / 1e18).toFixed(2)} STT
                    </div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-2 sm:p-3 md:p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Slips</div>
                    <div className="text-sm sm:text-base md:text-lg font-bold text-blue-400">
                      {currentCycle.cycleSlipCount}
                    </div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-2 sm:p-3 md:p-4">
                    <div className="text-xs text-gray-400 mb-1">End Time</div>
                    <div className="text-xs sm:text-sm md:text-lg font-bold text-white">
                      <span className="hidden sm:inline">{new Date(currentCycle.endTime * 1000).toLocaleString()}</span>
                      <span className="sm:hidden">{new Date(currentCycle.endTime * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Slips */}
          <UserSlipsDisplay 
            userAddress={address!} 
            className="mb-8"
          />

          {/* Mobile-optimized Platform Stats */}
          {cycleStats && (
            <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 md:p-6">
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Platform Statistics</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                <div className="bg-gray-700/30 rounded-lg p-2 sm:p-3">
                  <div className="text-xs text-gray-400 mb-1">Total Slips</div>
                  <div className="text-sm sm:text-base font-bold text-white">{cycleStats.slipCount}</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-2 sm:p-3">
                  <div className="text-xs text-gray-400 mb-1">Total Users</div>
                  <div className="text-sm sm:text-base font-bold text-blue-400">{cycleStats.userCount}</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-2 sm:p-3">
                  <div className="text-xs text-gray-400 mb-1">Total Volume</div>
                  <div className="text-sm sm:text-base font-bold text-green-400">
                    {(cycleStats.volume / 1e18).toFixed(2)} STT
                  </div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-2 sm:p-3">
                  <div className="text-xs text-gray-400 mb-1">Winners</div>
                  <div className="text-sm sm:text-base font-bold text-yellow-400">{cycleStats.winnersCount}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
