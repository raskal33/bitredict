'use client';

import React, { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { usePoolCore, usePoolFactory, useFaucet } from '@/hooks/useContractInteractions';
import { toast } from 'react-hot-toast';

interface CreateGuidedMarketFormProps {
  onSuccess?: (poolId: string) => void;
  onClose?: () => void;
}

interface MarketFormData {
  // Basic pool data
  predictedOutcome: string;
  odds: string;
  creatorStake: string;
  eventStartTime: string;
  eventEndTime: string;
  league: string;
  category: 'football' | 'crypto' | 'other';
  region: string;
  useBitr: boolean;
  maxBetPerUser: string;
  isPrivate: boolean;
  marketId: string;
  
  // Boost data
  enableBoost: boolean;
  boostTier: number;
  
  // Team data (for football)
  homeTeam?: string;
  awayTeam?: string;
  title?: string;
}

const BOOST_TIERS = [
  { value: 0, label: 'No Boost', cost: '0 STT' },
  { value: 1, label: 'Bronze Boost', cost: '100 STT' },
  { value: 2, label: 'Silver Boost', cost: '500 STT' },
  { value: 3, label: 'Gold Boost', cost: '1000 STT' },
  { value: 4, label: 'Platinum Boost', cost: '2500 STT' },
];

const LEAGUES = [
  'Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Champions League',
  'Europa League',
  'World Cup',
  'Euro Championship',
  'Other',
];

export default function CreateGuidedMarketForm({ onSuccess, onClose }: CreateGuidedMarketFormProps) {
  const { address, isConnected } = useAccount();
  const { createPool } = usePoolCore();
  const { createPoolWithBoost } = usePoolFactory();
  const { checkEligibility } = useFaucet();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<MarketFormData>({
    predictedOutcome: '',
    odds: '',
    creatorStake: '100',
    eventStartTime: '',
    eventEndTime: '',
    league: '',
    category: 'football',
    region: 'Global',
    useBitr: false,
    maxBetPerUser: '',
    isPrivate: false,
    marketId: '',
    enableBoost: false,
    boostTier: 0,
    homeTeam: '',
    awayTeam: '',
    title: '',
  });

  const [errors, setErrors] = useState<Partial<MarketFormData>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<MarketFormData> = {};

    if (!formData.predictedOutcome.trim()) {
      newErrors.predictedOutcome = 'Predicted outcome is required';
    }

    if (!formData.odds || parseFloat(formData.odds) <= 0) {
      newErrors.odds = 'Valid odds are required';
    }

    if (!formData.eventStartTime) {
      newErrors.eventStartTime = 'Event start time is required';
    }

    if (!formData.eventEndTime) {
      newErrors.eventEndTime = 'Event end time is required';
    }

    if (!formData.league) {
      newErrors.league = 'League is required';
    }

    if (formData.category === 'football' && (!formData.homeTeam || !formData.awayTeam)) {
      newErrors.homeTeam = 'Both teams are required for football markets';
      newErrors.awayTeam = 'Both teams are required for football markets';
    }

    if (formData.maxBetPerUser && parseFloat(formData.maxBetPerUser) <= 0) {
      newErrors.maxBetPerUser = 'Max bet per user must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field: keyof MarketFormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsLoading(true);

    try {
      // Check faucet eligibility if needed
      if (!formData.useBitr) {
        const isEligible = await checkEligibility();
        if (!isEligible) {
          toast.error('You need to claim from the faucet first to create pools');
          return;
        }
      }

      // Prepare pool data with all required parameters
      const poolData = {
        predictedOutcome: formData.predictedOutcome,
        odds: BigInt(Math.floor(parseFloat(formData.odds) * 100)), // Convert to basis points
        creatorStake: BigInt(parseFloat(formData.creatorStake || "100") * 1e18), // Add creator stake
        eventStartTime: BigInt(Math.floor(new Date(formData.eventStartTime).getTime() / 1000)),
        eventEndTime: BigInt(Math.floor(new Date(formData.eventEndTime).getTime() / 1000)),
        league: formData.league,
        category: formData.category,
        region: formData.region || "Global", // Add region
        isPrivate: formData.isPrivate,
        maxBetPerUser: formData.maxBetPerUser ? BigInt(parseFloat(formData.maxBetPerUser) * 1e18) : BigInt(0),
        useBitr: formData.useBitr,
        oracleType: 0, // GUIDED oracle type
        marketId: formData.marketId || "", // Add market ID
        marketType: 0, // MONEYLINE market type
      };

      let txHash: `0x${string}`;

      if (formData.enableBoost && formData.boostTier > 0) {
        // Create pool with boost using factory
        txHash = await createPoolWithBoost({
          ...poolData,
          boostTier: formData.boostTier,
        });
      } else {
        // Create regular pool
        txHash = await createPool(poolData);
      }

      toast.success('Market creation transaction submitted!');
      
      if (onSuccess) {
        onSuccess(txHash);
      }
      
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Error creating market:', error);
      toast.error('Failed to create market');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, validateForm, checkEligibility, createPool, createPoolWithBoost, formData, onSuccess, onClose]);


  return (
    <div className="bg-gray-900 rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Create Guided Market</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Market Category
          </label>
          <div className="flex space-x-4">
            {(['football', 'crypto', 'other'] as const).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleInputChange('category', category)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  formData.category === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Football-specific fields */}
        {formData.category === 'football' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Home Team
                </label>
                <input
                  type="text"
                  value={formData.homeTeam || ''}
                  onChange={(e) => handleInputChange('homeTeam', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Manchester United"
                />
                {errors.homeTeam && (
                  <p className="text-red-500 text-sm mt-1">{errors.homeTeam}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Away Team
                </label>
                <input
                  type="text"
                  value={formData.awayTeam || ''}
                  onChange={(e) => handleInputChange('awayTeam', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Liverpool"
                />
                {errors.awayTeam && (
                  <p className="text-red-500 text-sm mt-1">{errors.awayTeam}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Predicted Outcome */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Predicted Outcome
          </label>
          <input
            type="text"
            value={formData.predictedOutcome}
            onChange={(e) => handleInputChange('predictedOutcome', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Home team wins, Bitcoin reaches $100k"
          />
          {errors.predictedOutcome && (
            <p className="text-red-500 text-sm mt-1">{errors.predictedOutcome}</p>
          )}
        </div>

        {/* Odds */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Odds (Decimal)
          </label>
          <input
            type="number"
            step="0.01"
            min="1.01"
            value={formData.odds}
            onChange={(e) => handleInputChange('odds', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2.50"
          />
          {errors.odds && (
            <p className="text-red-500 text-sm mt-1">{errors.odds}</p>
          )}
        </div>

        {/* Creator Stake */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Creator Stake ({formData.useBitr ? 'BITR' : 'STT'})
          </label>
          <input
            type="number"
            step="0.01"
            min={formData.useBitr ? "1000" : "5"}
            value={formData.creatorStake}
            onChange={(e) => handleInputChange('creatorStake', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={formData.useBitr ? "1000" : "5"}
          />
          <p className="text-xs text-gray-400 mt-1">
            Minimum: {formData.useBitr ? "1000 BITR" : "5 STT"}
          </p>
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Region
          </label>
          <input
            type="text"
            value={formData.region}
            onChange={(e) => handleInputChange('region', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Global, Europe, North America"
          />
        </div>

        {/* Market ID */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Market ID (Optional)
          </label>
          <input
            type="text"
            value={formData.marketId}
            onChange={(e) => handleInputChange('marketId', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="External market reference (e.g., SportMonks fixture ID)"
          />
        </div>

        {/* League */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            League
          </label>
          <select
            value={formData.league}
            onChange={(e) => handleInputChange('league', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select League</option>
            {LEAGUES.map((league) => (
              <option key={league} value={league}>
                {league}
              </option>
            ))}
          </select>
          {errors.league && (
            <p className="text-red-500 text-sm mt-1">{errors.league}</p>
          )}
        </div>

        {/* Event Times */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Start Time
            </label>
            <input
              type="datetime-local"
              value={formData.eventStartTime}
              onChange={(e) => handleInputChange('eventStartTime', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.eventStartTime && (
              <p className="text-red-500 text-sm mt-1">{errors.eventStartTime}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event End Time
            </label>
            <input
              type="datetime-local"
              value={formData.eventEndTime}
              onChange={(e) => handleInputChange('eventEndTime', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.eventEndTime && (
              <p className="text-red-500 text-sm mt-1">{errors.eventEndTime}</p>
            )}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Advanced Options</h3>
          
          {/* Max Bet Per User */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Bet Per User (STT)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.maxBetPerUser}
              onChange={(e) => handleInputChange('maxBetPerUser', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0 for unlimited"
            />
            {errors.maxBetPerUser && (
              <p className="text-red-500 text-sm mt-1">{errors.maxBetPerUser}</p>
            )}
          </div>

          {/* Use BITR */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useBitr"
              checked={formData.useBitr}
              onChange={(e) => handleInputChange('useBitr', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="useBitr" className="text-sm font-medium text-gray-300">
              Use BITR tokens for this pool
            </label>
          </div>

          {/* Private Pool */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPrivate" className="text-sm font-medium text-gray-300">
              Make this a private pool
            </label>
          </div>
        </div>

        {/* Boost Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enableBoost"
              checked={formData.enableBoost}
              onChange={(e) => handleInputChange('enableBoost', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="enableBoost" className="text-sm font-medium text-gray-300">
              Enable pool boost
            </label>
          </div>

          {formData.enableBoost && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Boost Tier
              </label>
              <div className="grid grid-cols-1 gap-2">
                {BOOST_TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => handleInputChange('boostTier', tier.value)}
                    className={`p-3 rounded-lg text-left ${
                      formData.boostTier === tier.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-medium">{tier.label}</div>
                    <div className="text-sm opacity-75">{tier.cost}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading || !isConnected}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Creating Market...' : 'Create Market'}
          </button>
          
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {!isConnected && (
          <p className="text-red-500 text-sm text-center">
            Please connect your wallet to create a market
          </p>
        )}
      </form>
    </div>
  );
}
