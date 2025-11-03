"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { optimizedPoolService } from "@/services/optimizedPoolService";
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";
import InfoComp from "../InfoComp";

interface UserBet {
  id: string;
  poolId: number;
  poolTitle: string;
  category: string;
  league?: string;
  homeTeam?: string;
  awayTeam?: string;
  amount: string;
  isForOutcome: boolean;
  timestamp: number;
  isSettled: boolean;
  creatorSideWon?: boolean;
  currency: string;
  // Calculated fields
  result?: 'won' | 'lost' | 'pending';
  totalBet?: number;
  amountWon?: number;
  profitLoss?: number;
  profitLossPercent?: number;
}

interface ProfitLossData {
  date: string;
  profitLoss: number;
}

export default function PublicProfilePage() {
  const params = useParams();
  const profileAddress = params?.address as string;
  
  const [activeTab, setActiveTab] = useState<'positions' | 'activity'>('positions');
  const [positionFilter, setPositionFilter] = useState<'active' | 'closed'>('closed');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'ALL'>('ALL');
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [profitLossData, setProfitLossData] = useState<ProfitLossData[]>([]);
  
  // Fetch profile data
  const { data: profileData, isLoading: profileLoading } = useUserProfile(profileAddress);
  
  // Fetch user bets
  useEffect(() => {
    const fetchUserBets = async () => {
      if (!profileAddress) return;
      
      setLoading(true);
      try {
        // Fetch bets from optimized pools endpoint
        const bets = await optimizedPoolService.getUserBets(profileAddress, 100);
        
        // Transform and enrich bets with settlement status
        const enrichedBets: UserBet[] = bets.map((bet) => {
          const betAmount = parseFloat(bet.amount) || 0;
          let result: 'won' | 'lost' | 'pending' = 'pending';
          let amountWon = 0;
          let profitLoss = 0;
          let profitLossPercent = 0;
          
          if (bet.isSettled) {
            // Determine if bettor won or lost
            // If creatorSideWon = true, bettors lost (contrarian logic)
            // If creatorSideWon = false, bettors won
            if (bet.isForOutcome) {
              // YES bet
              if (bet.creatorSideWon === false) {
                // Bettor won - calculate payout using odds
                result = 'won';
                const odds = bet.odds || 200; // Default 2x if odds not available
                const grossPayout = betAmount * (odds / 100);
                // Apply 5% fee on profit (simplified)
                const profit = grossPayout - betAmount;
                const fee = profit * 0.05;
                amountWon = grossPayout - fee;
                profitLoss = amountWon - betAmount;
                profitLossPercent = (profitLoss / betAmount) * 100;
              } else {
                // Bettor lost
                result = 'lost';
                amountWon = 0;
                profitLoss = -betAmount;
                profitLossPercent = -100;
              }
            } else {
              // NO bet (liquidity provider) - opposite logic
              if (bet.creatorSideWon === true) {
                result = 'won';
                // LP wins get share of bettor stakes
                // Simplified calculation - would need total creator side stake
                const lpShare = betAmount * 1.2; // Simplified
                amountWon = lpShare;
                profitLoss = amountWon - betAmount;
                profitLossPercent = (profitLoss / betAmount) * 100;
              } else {
                result = 'lost';
                amountWon = 0;
                profitLoss = -betAmount;
                profitLossPercent = -100;
              }
            }
          }
          
          return {
            id: bet.id,
            poolId: bet.poolId,
            poolTitle: bet.poolTitle || `Pool #${bet.poolId}`,
            category: bet.category || 'General',
            league: bet.league,
            homeTeam: bet.homeTeam,
            awayTeam: bet.awayTeam,
            amount: bet.amount,
            isForOutcome: bet.isForOutcome,
            timestamp: bet.timestamp,
            isSettled: bet.isSettled || false,
            creatorSideWon: bet.creatorSideWon,
            currency: bet.currency || 'STT',
            result,
            totalBet: betAmount,
            amountWon,
            profitLoss,
            profitLossPercent
          };
        });
        
        setUserBets(enrichedBets);
        
        // Calculate profit/loss over time (simplified)
        const plData: ProfitLossData[] = enrichedBets
          .filter(bet => bet.isSettled && bet.result !== 'pending')
          .sort((a, b) => a.timestamp - b.timestamp)
          .reduce((acc: ProfitLossData[], bet, index) => {
            const prevPL = index > 0 ? acc[index - 1].profitLoss : 0;
            const currentPL = bet.profitLoss ?? 0;
            acc.push({
              date: new Date(bet.timestamp * 1000).toISOString().split('T')[0],
              profitLoss: prevPL + currentPL
            });
            return acc;
          }, []);
        
        setProfitLossData(plData);
      } catch (error) {
        console.error('Error fetching user bets:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserBets();
  }, [profileAddress]);
  
  // Filter bets based on active/closed
  const filteredBets = userBets.filter(bet => {
    if (positionFilter === 'active') {
      return !bet.isSettled;
    } else {
      return bet.isSettled;
    }
  });
  
  // Calculate total P/L
  const totalProfitLoss = filteredBets
    .filter(bet => bet.isSettled && bet.result !== 'pending')
    .reduce((sum, bet) => sum + (bet.profitLoss || 0), 0);
  
  // Calculate positions value (active bets)
  const positionsValue = userBets
    .filter(bet => !bet.isSettled)
    .reduce((sum, bet) => sum + (bet.totalBet || 0), 0);
  
  // Get biggest win
  const biggestWin = Math.max(
    ...filteredBets
      .filter(bet => bet.result === 'won')
      .map(bet => bet.amountWon || 0),
    0
  );
  
  const formatCurrency = (value: number, currency: string = 'STT') => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K ${currency}`;
    }
    return `${value.toFixed(2)} ${currency}`;
  };
  
  if (profileLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Profile Header */}
      <div className="mb-8">
        <InfoComp targetAddress={profileAddress} />
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6">
          <div className="text-sm text-text-muted mb-1">Positions Value</div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(positionsValue, 'STT')}
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="text-sm text-text-muted mb-1">Biggest Win</div>
          <div className="text-2xl font-bold text-green-400">
            {biggestWin > 0 ? formatCurrency(biggestWin, 'STT') : '-'}
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="text-sm text-text-muted mb-1">Predictions</div>
          <div className="text-2xl font-bold text-white">
            {profileData?.stats?.totalBets || 0}
          </div>
        </div>
      </div>
      
      {/* Profit/Loss Section */}
      <div className="glass-card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-primary" />
            Profit/Loss
          </h2>
          <div className="flex gap-2">
            {(['1D', '1W', '1M', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-primary text-white'
                    : 'bg-bg-card text-text-muted hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="text-4xl font-bold mb-2 text-white">
            {totalProfitLoss >= 0 ? (
              <span className="text-green-400">+{formatCurrency(totalProfitLoss)}</span>
            ) : (
              <span className="text-red-400">{formatCurrency(totalProfitLoss)}</span>
            )}
          </div>
          <p className="text-text-muted">Total {timeframe === 'ALL' ? 'All Time' : timeframe} P/L</p>
          
          {/* Simple chart placeholder */}
          {profitLossData.length > 0 && (
            <div className="mt-8 h-48 bg-bg-card rounded-lg flex items-end justify-between p-4">
              {profitLossData.slice(-10).map((data, index) => (
                <div
                  key={index}
                  className="flex-1 mx-1 bg-gradient-to-t from-primary/50 to-primary rounded-t"
                  style={{
                    height: `${Math.max(10, Math.abs(data.profitLoss) / Math.max(...profitLossData.map(d => Math.abs(d.profitLoss))) * 100)}%`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'positions'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              Positions
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'activity'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              Activity
            </button>
          </div>
          
          {activeTab === 'positions' && (
            <div className="flex gap-2">
              <button
                onClick={() => setPositionFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  positionFilter === 'active'
                    ? 'bg-primary text-white'
                    : 'bg-bg-card text-text-muted hover:text-white'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setPositionFilter('closed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  positionFilter === 'closed'
                    ? 'bg-primary text-white'
                    : 'bg-bg-card text-text-muted hover:text-white'
                }`}
              >
                Closed
              </button>
            </div>
          )}
        </div>
        
        {/* Positions Table */}
        {activeTab === 'positions' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-text-muted text-sm font-medium">RESULT</th>
                  <th className="text-left py-3 px-4 text-text-muted text-sm font-medium">MARKET</th>
                  <th className="text-right py-3 px-4 text-text-muted text-sm font-medium">TOTAL BET</th>
                  <th className="text-right py-3 px-4 text-text-muted text-sm font-medium">AMOUNT WON</th>
                </tr>
              </thead>
              <tbody>
                {filteredBets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-text-muted">
                      No {positionFilter} positions found
                    </td>
                  </tr>
                ) : (
                  filteredBets.map((bet) => (
                    <tr key={bet.id} className="border-b border-gray-700/50 hover:bg-bg-card/50 transition-colors">
                      <td className="py-4 px-4">
                        {bet.result === 'won' ? (
                          <CheckCircleIcon className="w-6 h-6 text-green-400" />
                        ) : bet.result === 'lost' ? (
                          <XCircleIcon className="w-6 h-6 text-red-400" />
                        ) : (
                          <ClockIcon className="w-6 h-6 text-yellow-400" />
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                            <span className="text-primary font-bold">
                              {bet.category.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{bet.poolTitle}</div>
                            {bet.homeTeam && bet.awayTeam && (
                              <div className="text-sm text-text-muted">
                                {bet.homeTeam} vs {bet.awayTeam}
                              </div>
                            )}
                            <div className="text-xs text-text-muted mt-1">
                              {bet.isForOutcome ? 'YES' : 'NO'} at {bet.amount} {bet.currency}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-white font-medium">
                          {formatCurrency(bet.totalBet || 0, bet.currency)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {bet.result === 'won' ? (
                          <>
                            <div className="text-white font-medium">
                              {formatCurrency(bet.amountWon || 0, bet.currency)}
                            </div>
                            <div className="text-sm text-green-400">
                              {bet.profitLossPercent && bet.profitLossPercent > 0 ? '+' : ''}
                              {bet.profitLossPercent?.toFixed(2)}%
                            </div>
                          </>
                        ) : bet.result === 'lost' ? (
                          <>
                            <div className="text-white font-medium">0 {bet.currency}</div>
                            <div className="text-sm text-red-400">
                              {bet.profitLossPercent?.toFixed(2)}%
                            </div>
                          </>
                        ) : (
                          <div className="text-text-muted">Pending</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            {profileData?.recentActivity && profileData.recentActivity.length > 0 ? (
              profileData.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-bg-card hover:bg-bg-card-hover transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'bet_won' ? 'bg-green-500/20 text-green-400' :
                    activity.type === 'bet_lost' ? 'bg-red-500/20 text-red-400' :
                    activity.type === 'pool_created' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {activity.type === 'bet_won' ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : activity.type === 'bet_lost' ? (
                      <XCircleIcon className="w-6 h-6" />
                    ) : (
                      <TrophyIcon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{activity.description}</div>
                    <div className="text-sm text-text-muted mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                    {activity.amount && (
                      <div className={`text-sm font-medium mt-1 ${
                        activity.type === 'bet_won' ? 'text-green-400' :
                        activity.type === 'bet_lost' ? 'text-red-400' :
                        'text-text-secondary'
                      }`}>
                        {activity.amount}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-text-muted">
                No activity found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

