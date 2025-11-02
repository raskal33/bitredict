'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import Image from 'next/image';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  CalculatorIcon,
  TrophyIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { GuidedMarketService, FootballMatch } from '@/services/guidedMarketService';
import { useComboPools, ComboCondition } from '@/hooks/useComboPools';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useTransactionFeedback, TransactionFeedback } from '@/components/TransactionFeedback';
import Button from '@/components/button';
import AmountInput from '@/components/AmountInput';

interface SelectedCondition {
  id: string;
  matchId: string;
  match: FootballMatch;
  marketType: string;
  outcome: string;
  odds: number; // Individual odds for this condition (1.01 - 100.0)
  description: string;
  eventStartTime: Date;
  eventEndTime: Date;
}

interface MarketTypeOption {
  value: string;
  label: string;
  getOdds: (match: FootballMatch) => number | null;
  getOutcome: (match: FootballMatch, selection: 'YES' | 'NO') => string;
}

const MARKET_TYPES: MarketTypeOption[] = [
  {
    value: 'home',
    label: 'Home Win',
    getOdds: (m) => m.odds?.home || null,
    getOutcome: () => 'Home wins',
  },
  {
    value: 'draw',
    label: 'Draw',
    getOdds: (m) => m.odds?.draw || null,
    getOutcome: () => 'Draw',
  },
  {
    value: 'away',
    label: 'Away Win',
    getOdds: (m) => m.odds?.away || null,
    getOutcome: () => 'Away wins',
  },
  {
    value: 'over25',
    label: 'Over 2.5',
    getOdds: (m) => m.odds?.over25 || null,
    getOutcome: () => 'Over 2.5',
  },
  {
    value: 'under25',
    label: 'Under 2.5',
    getOdds: (m) => m.odds?.under25 || null,
    getOutcome: () => 'Under 2.5',
  },
  {
    value: 'over35',
    label: 'Over 3.5',
    getOdds: (m) => m.odds?.over35 || null,
    getOutcome: () => 'Over 3.5',
  },
  {
    value: 'under35',
    label: 'Under 3.5',
    getOdds: (m) => m.odds?.under35 || null,
    getOutcome: () => 'Under 3.5',
  },
  {
    value: 'bttsYes',
    label: 'BTTS Yes',
    getOdds: (m) => m.odds?.bttsYes || null,
    getOutcome: () => 'Yes',
  },
  {
    value: 'bttsNo',
    label: 'BTTS No',
    getOdds: (m) => m.odds?.bttsNo || null,
    getOutcome: () => 'No',
  },
];

// Calculate combined odds from individual odds (multiply them)
const calculateCombinedOdds = (conditions: SelectedCondition[]): number => {
  if (conditions.length === 0) return 1.0;
  return conditions.reduce((product, condition) => product * condition.odds, 1.0);
};

export default function GuidedFootballComboPoolTable({
  onSuccess,
  onClose,
}: {
  onSuccess?: (poolId: string) => void;
  onClose?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const { connectWallet } = useWalletConnection();
  const { createComboPool } = useComboPools();
  const { transactionStatus, showPending, showConfirming, showSuccess, showError, clearStatus } = useTransactionFeedback();

  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<SelectedCondition[]>([]);
  const [creatorStake, setCreatorStake] = useState<string>('100');
  const [useBitr, setUseBitr] = useState(false);
  const [maxBetPerUser, setMaxBetPerUser] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  
  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({ 
    hash: txHash || undefined 
  });
  
  // Handle transaction confirmation
  useEffect(() => {
    if (!txHash) return;
    
    if (isConfirming) {
      showConfirming('Transaction Confirming', `Waiting for block confirmation...`, txHash);
    }
    
    if (txSuccess) {
      const finalCombinedOdds = calculateCombinedOdds(selectedConditions);
      showSuccess(
        'Combo Pool Created!',
        `Your combo pool has been created with ${selectedConditions.length} conditions and ${finalCombinedOdds.toFixed(2)}x combined odds.`,
        txHash
      );
      
      if (onSuccess) {
        onSuccess(txHash);
      }
      
      // Clear state after a delay to allow user to see success message
      setTimeout(() => {
        setTxHash(null);
      }, 3000);
    }
  }, [txHash, isConfirming, txSuccess, selectedConditions, showConfirming, showSuccess, onSuccess]);

  // Load matches function - must be declared before useEffect
  const loadMatches = useCallback(async () => {
    setIsLoadingMatches(true);
    try {
      const fetchedMatches = await GuidedMarketService.getFootballMatches(7, 200);
      setMatches(fetchedMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setIsLoadingMatches(false);
    }
  }, []);

  // Fetch matches on mount
  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Filter matches based on search query
  const filteredMatches = matches.filter((match) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      match.homeTeam.name.toLowerCase().includes(query) ||
      match.awayTeam.name.toLowerCase().includes(query) ||
      match.league.name?.toLowerCase().includes(query)
    );
  });

  // Add condition
  const handleAddCondition = useCallback((match: FootballMatch, marketType: string) => {
    if (selectedConditions.length >= 5) {
      toast.error('Maximum 5 conditions allowed');
      return;
    }

    const marketOption = MARKET_TYPES.find((mt) => mt.value === marketType);
    if (!marketOption) return;

    const odds = marketOption.getOdds(match);
    if (!odds || odds < 1.01) {
      toast.error('Invalid odds for this market type');
      return;
    }

    const outcome = marketOption.getOutcome(match, 'YES');
    const matchDate = new Date(match.matchDate);
    const eventEndTime = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours after match start

    const condition: SelectedCondition = {
      id: `${match.id}-${marketType}-${Date.now()}`,
      matchId: match.id,
      match,
      marketType,
      outcome,
      odds,
      description: `${match.homeTeam.name} vs ${match.awayTeam.name}: ${marketOption.label}`,
      eventStartTime: matchDate,
      eventEndTime,
    };

    setSelectedConditions((prev) => [...prev, condition]);
    toast.success('Condition added');
  }, [selectedConditions.length]);

  // Remove condition
  const handleRemoveCondition = useCallback((conditionId: string) => {
    setSelectedConditions((prev) => prev.filter((c) => c.id !== conditionId));
  }, []);

  // Calculate combined odds
  const combinedOdds = calculateCombinedOdds(selectedConditions);

  // Calculate earliest event start and latest event end
  const earliestEventStart = selectedConditions.length > 0
    ? Math.min(...selectedConditions.map((c) => c.eventStartTime.getTime()))
    : Date.now();
  const latestEventEnd = selectedConditions.length > 0
    ? Math.max(...selectedConditions.map((c) => c.eventEndTime.getTime()))
    : Date.now() + 24 * 60 * 60 * 1000;

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      try {
        await connectWallet();
      } catch {
        toast.error('Failed to connect wallet');
      }
      return;
    }

    if (selectedConditions.length < 2) {
      toast.error('At least 2 conditions required for combo pools');
      return;
    }

    if (selectedConditions.length > 5) {
      toast.error('Maximum 5 conditions allowed');
      return;
    }

    const stakeNum = parseFloat(creatorStake);
    if (isNaN(stakeNum) || stakeNum <= 0) {
      toast.error('Invalid creator stake');
      return;
    }

    if (combinedOdds < 1.01 || combinedOdds > 500) {
      toast.error('Combined odds must be between 1.01x and 500x');
      return;
    }

    setIsSubmitting(true);
    showPending('Creating Combo Pool', 'Preparing transaction...');

    try {
      // ✅ CRITICAL: Transform conditions to match contract format exactly
      // Contract expects: marketId (bytes32), expectedOutcome (bytes32), odds (uint16 in basis points)
      // Each condition has individual odds stored, but we pass combinedOdds as a single value
      // The useComboPools hook will handle bytes32 encoding, but we pass raw strings
      const contractConditions: ComboCondition[] = selectedConditions.map((condition) => ({
        marketId: condition.matchId, // SportMonks fixture ID as string (will be encoded to bytes32 in hook)
        expectedOutcome: condition.outcome, // e.g., "Home wins", "Over 2.5" (will be encoded to bytes32 in hook)
        description: condition.description, // Human readable description
        odds: condition.odds, // Individual odds as float (1.85) - hook will convert to basis points (185)
      }));

      const comboPoolData = {
        conditions: contractConditions,
        combinedOdds: combinedOdds, // Already calculated from individual odds
        creatorStake: BigInt(Math.floor(stakeNum * 1e18)),
        earliestEventStart: BigInt(Math.floor(earliestEventStart / 1000)),
        latestEventEnd: BigInt(Math.floor(latestEventEnd / 1000)),
        category: 'football',
        maxBetPerUser: maxBetPerUser ? BigInt(Math.floor(parseFloat(maxBetPerUser) * 1e18)) : BigInt(0),
        useBitr: useBitr,
      };

      const hash = await createComboPool(comboPoolData);
      
      if (!hash) {
        throw new Error('Transaction hash not received');
      }
      
      setTxHash(hash);
      // Transaction confirmation will be handled by useWaitForTransactionReceipt hook in useEffect
      
      toast.success(`Combo pool creation transaction submitted! ${selectedConditions.length} conditions, ${combinedOdds.toFixed(2)}x combined odds.`);
    } catch (error) {
      console.error('Error creating combo pool:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create combo pool';
      showError('Creation Failed', errorMessage);
      toast.error('Failed to create combo pool');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isConnected,
    address,
    selectedConditions,
    creatorStake,
    combinedOdds,
    earliestEventStart,
    latestEventEnd,
    maxBetPerUser,
    useBitr,
    connectWallet,
    createComboPool,
    showPending,
    showError,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <TransactionFeedback
        status={transactionStatus}
        onClose={clearStatus}
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <TrophyIcon className="h-8 w-8 text-yellow-500" />
              Create Combo Pool
            </h1>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>
          <p className="text-gray-400">
            Select 2-5 football match conditions to create a combo pool with combined odds
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Match Selection Table */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search matches by team or league..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Matches Table */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Match
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Home
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Draw
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Away
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        O/U 2.5
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        O/U 3.5
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        BTTS
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50 bg-gray-900/30">
                    {isLoadingMatches ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                            <span>Loading matches...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredMatches.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                          <div className="flex flex-col items-center gap-2">
                            <MagnifyingGlassIcon className="h-8 w-8 text-gray-500" />
                            <span>No matches found. Try a different search.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredMatches.map((match) => (
                        <tr
                          key={match.id}
                          className="hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                {match.homeTeam.logoUrl && (
                                  <Image 
                                    src={match.homeTeam.logoUrl} 
                                    alt={match.homeTeam.name} 
                                    width={20} 
                                    height={20} 
                                    className="rounded" 
                                  />
                                )}
                                <div className="text-sm font-semibold text-white">
                                  {match.homeTeam.name}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-7">
                                {match.awayTeam.logoUrl && (
                                  <Image 
                                    src={match.awayTeam.logoUrl} 
                                    alt={match.awayTeam.name} 
                                    width={20} 
                                    height={20} 
                                    className="rounded" 
                                  />
                                )}
                                <div className="text-sm font-semibold text-white">
                                  {match.awayTeam.name}
                                </div>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {match.league.name || 'Unknown League'}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                {new Date(match.matchDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} {new Date(match.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {match.odds?.home ? (
                              <button
                                onClick={() => handleAddCondition(match, 'home')}
                                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 hover:scale-105 active:scale-95 text-blue-400 rounded-lg transition-all text-sm font-semibold shadow-lg shadow-blue-500/10 border border-blue-500/20"
                                title="Add Home Win condition"
                              >
                                {match.odds.home.toFixed(2)}x
                              </button>
                            ) : (
                              <span className="text-gray-600 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {match.odds?.draw ? (
                              <button
                                onClick={() => handleAddCondition(match, 'draw')}
                                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 hover:scale-105 active:scale-95 text-blue-400 rounded-lg transition-all text-sm font-semibold shadow-lg shadow-blue-500/10 border border-blue-500/20"
                                title="Add Draw condition"
                              >
                                {match.odds.draw.toFixed(2)}x
                              </button>
                            ) : (
                              <span className="text-gray-600 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {match.odds?.away ? (
                              <button
                                onClick={() => handleAddCondition(match, 'away')}
                                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 hover:scale-105 active:scale-95 text-blue-400 rounded-lg transition-all text-sm font-semibold shadow-lg shadow-blue-500/10 border border-blue-500/20"
                                title="Add Away Win condition"
                              >
                                {match.odds.away.toFixed(2)}x
                              </button>
                            ) : (
                              <span className="text-gray-600 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col gap-1">
                              {match.odds?.over25 ? (
                                <button
                                  onClick={() => handleAddCondition(match, 'over25')}
                                  className="px-2 py-1 bg-green-600/20 hover:bg-green-600/40 hover:scale-105 active:scale-95 text-green-400 rounded text-xs font-semibold shadow-md shadow-green-500/10 border border-green-500/20 transition-all"
                                  title="Add Over 2.5 goals condition"
                                >
                                  O {match.odds.over25.toFixed(2)}x
                                </button>
                              ) : (
                                <span className="text-gray-600 text-xs">-</span>
                              )}
                              {match.odds?.under25 ? (
                                <button
                                  onClick={() => handleAddCondition(match, 'under25')}
                                  className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 hover:scale-105 active:scale-95 text-red-400 rounded text-xs font-semibold shadow-md shadow-red-500/10 border border-red-500/20 transition-all"
                                  title="Add Under 2.5 goals condition"
                                >
                                  U {match.odds.under25.toFixed(2)}x
                                </button>
                              ) : (
                                <span className="text-gray-600 text-xs">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col gap-1">
                              {match.odds?.over35 ? (
                                <button
                                  onClick={() => handleAddCondition(match, 'over35')}
                                  className="px-2 py-1 bg-green-600/20 hover:bg-green-600/40 hover:scale-105 active:scale-95 text-green-400 rounded text-xs font-semibold shadow-md shadow-green-500/10 border border-green-500/20 transition-all"
                                  title="Add Over 3.5 goals condition"
                                >
                                  O {match.odds.over35.toFixed(2)}x
                                </button>
                              ) : (
                                <span className="text-gray-600 text-xs">-</span>
                              )}
                              {match.odds?.under35 ? (
                                <button
                                  onClick={() => handleAddCondition(match, 'under35')}
                                  className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 hover:scale-105 active:scale-95 text-red-400 rounded text-xs font-semibold shadow-md shadow-red-500/10 border border-red-500/20 transition-all"
                                  title="Add Under 3.5 goals condition"
                                >
                                  U {match.odds.under35.toFixed(2)}x
                                </button>
                              ) : (
                                <span className="text-gray-600 text-xs">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col gap-1">
                              {match.odds?.bttsYes ? (
                                <button
                                  onClick={() => handleAddCondition(match, 'bttsYes')}
                                  className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 hover:scale-105 active:scale-95 text-purple-400 rounded text-xs font-semibold shadow-md shadow-purple-500/10 border border-purple-500/20 transition-all"
                                  title="Add Both Teams To Score Yes condition"
                                >
                                  Yes {match.odds.bttsYes.toFixed(2)}x
                                </button>
                              ) : (
                                <span className="text-gray-600 text-xs">-</span>
                              )}
                              {match.odds?.bttsNo ? (
                                <button
                                  onClick={() => handleAddCondition(match, 'bttsNo')}
                                  className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 hover:scale-105 active:scale-95 text-purple-400 rounded text-xs font-semibold shadow-md shadow-purple-500/10 border border-purple-500/20 transition-all"
                                  title="Add Both Teams To Score No condition"
                                >
                                  No {match.odds.bttsNo.toFixed(2)}x
                                </button>
                              ) : (
                                <span className="text-gray-600 text-xs">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {selectedConditions.some((c) => c.matchId === match.id) ? (
                              <span className="text-xs text-green-400 font-semibold flex items-center justify-center gap-1">
                                <CheckIcon className="h-4 w-4" />
                                Selected
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">Click odds to add</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Selected Conditions & Pool Config */}
          <div className="space-y-4">
            {/* Selected Conditions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                Selected Conditions ({selectedConditions.length}/5)
              </h2>
              {selectedConditions.length === 0 ? (
                <p className="text-gray-400 text-sm">No conditions selected. Click odds buttons to add conditions.</p>
              ) : (
                <div className="space-y-3">
                  {selectedConditions.map((condition) => (
                    <motion.div
                      key={condition.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">
                            {condition.match.homeTeam.name} vs {condition.match.awayTeam.name}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {MARKET_TYPES.find((mt) => mt.value === condition.marketType)?.label}: {condition.outcome}
                          </div>
                          <div className="text-xs text-blue-400 mt-1 font-semibold">
                            {condition.odds.toFixed(2)}x
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCondition(condition.id)}
                          className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Combined Odds Display */}
            {selectedConditions.length >= 2 && (
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl border border-yellow-500/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalculatorIcon className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">Combined Odds</h3>
                </div>
                <div className="text-3xl font-bold text-yellow-400">
                  {combinedOdds.toFixed(2)}x
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  Calculated from {selectedConditions.length} condition{selectedConditions.length > 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Pool Configuration */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 space-y-4">
              <h3 className="text-lg font-semibold text-white">Pool Configuration</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Creator Stake ({useBitr ? 'BITR' : 'STT'})
                </label>
                <AmountInput
                  value={creatorStake}
                  onChange={setCreatorStake}
                  placeholder="100"
                  min={useBitr ? 1000 : 5}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Minimum: {useBitr ? '1000 BITR' : '5 STT'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Bet Per User ({useBitr ? 'BITR' : 'STT'}) (Optional)
                </label>
                <AmountInput
                  value={maxBetPerUser}
                  onChange={setMaxBetPerUser}
                  placeholder="0 = Unlimited"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="useBitr"
                  checked={useBitr}
                  onChange={(e) => setUseBitr(e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="useBitr" className="text-sm text-gray-300">
                  Use BITR Token (instead of STT)
                </label>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={selectedConditions.length < 2 || selectedConditions.length > 5 || isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </span>
                ) : selectedConditions.length < 2 ? (
                  'Select 2-5 Conditions'
                ) : (
                  'Create Combo Pool'
                )}
              </Button>
              {selectedConditions.length > 0 && selectedConditions.length < 2 && (
                <p className="text-xs text-yellow-400 text-center">
                  Need {2 - selectedConditions.length} more condition{2 - selectedConditions.length > 1 ? 's' : ''} to create pool
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

