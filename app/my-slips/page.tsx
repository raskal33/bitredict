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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">My Slips</h1>
            <p className="text-gray-300">Track your prediction performance and history</p>
          </div>

          {/* Current Cycle Info */}
          {currentCycle && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Current Cycle #{currentCycle.cycleId}</h2>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentCycle.state === 1 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {currentCycle.state === 1 ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Prize Pool</div>
                    <div className="text-lg font-bold text-yellow-400">
                      {(currentCycle.prizePool / 1e18).toFixed(2)} STT
                    </div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Total Slips</div>
                    <div className="text-lg font-bold text-blue-400">
                      {currentCycle.cycleSlipCount}
                    </div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="text-sm text-gray-400">End Time</div>
                    <div className="text-lg font-bold text-white">
                      {new Date(currentCycle.endTime * 1000).toLocaleString()}
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

          {/* Platform Stats */}
          {cycleStats && (
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Platform Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Total Slips</div>
                  <div className="text-lg font-bold text-white">{cycleStats.slipCount}</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Total Users</div>
                  <div className="text-lg font-bold text-blue-400">{cycleStats.userCount}</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Total Volume</div>
                  <div className="text-lg font-bold text-green-400">
                    {(cycleStats.volume / 1e18).toFixed(2)} STT
                  </div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Winners</div>
                  <div className="text-lg font-bold text-yellow-400">{cycleStats.winnersCount}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
