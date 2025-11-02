'use client';

import React, { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { usePoolCore, useFaucet } from '@/hooks/useContractInteractions'; // ✅ FIX: Removed usePoolFactory - not needed
import { toast } from 'react-hot-toast';
import { 
  OracleType, 
  MarketType, 
  BoostTier, 
  PoolFormData, 
  validatePoolData, 
  convertFormToContractData,
  generateFootballMarketId,
  generateFootballTitle,
  MARKET_TYPE_LABELS,
  MARKET_TYPE_CONFIG,
  BOOST_TIER_CONFIG
} from '@/types/contracts';

interface CreateGuidedMarketFormProps {
  onSuccess?: (poolId: string) => void;
  onClose?: () => void;
}

// Use the proper boost tier configuration
const BOOST_TIERS = Object.entries(BOOST_TIER_CONFIG).map(([value, config]) => ({
  value: parseInt(value),
  label: config.label,
  cost: config.costLabel,
}));

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
  // ✅ FIX: Removed usePoolFactory - createPool now handles boost internally
  const { checkEligibility } = useFaucet();

  const [isLoading, setIsLoading] = useState(false);
  // Helper function to get default timestamps
  const getDefaultTimestamps = () => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
    
    return {
      startTime: startTime.toISOString().slice(0, 16), // Format for datetime-local input
      endTime: endTime.toISOString().slice(0, 16),
    };
  };

  const defaultTimestamps = getDefaultTimestamps();

  const [formData, setFormData] = useState<PoolFormData>({
    predictedOutcome: '',
    odds: '', // REMOVED: default odds - creators must set their own odds
    creatorStake: '100',
    eventStartTime: defaultTimestamps.startTime,
    eventEndTime: defaultTimestamps.endTime,
    league: '',
    category: 'football',
    region: 'Global',
    useBitr: false,
    maxBetPerUser: '',
    isPrivate: false,
    marketId: '',
    oracleType: OracleType.GUIDED,
    marketType: MarketType.MONEYLINE,
    enableBoost: false,
    boostTier: BoostTier.NONE,
    homeTeam: '',
    awayTeam: '',
    title: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((): boolean => {
    const validationErrors = validatePoolData(formData);
    
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach(error => {
        // Map validation errors to form fields
        if (error.includes('predicted outcome')) errorMap.predictedOutcome = error;
        else if (error.includes('odds')) errorMap.odds = error;
        else if (error.includes('start time')) errorMap.eventStartTime = error;
        else if (error.includes('end time')) errorMap.eventEndTime = error;
        else if (error.includes('league')) errorMap.league = error;
        else if (error.includes('Home team')) errorMap.homeTeam = error;
        else if (error.includes('Away team')) errorMap.awayTeam = error;
        else if (error.includes('stake')) errorMap.creatorStake = error;
        else errorMap.general = error;
      });
      setErrors(errorMap);
      return false;
    }
    
    setErrors({});
    return true;
  }, [formData]);

  const handleInputChange = useCallback((field: keyof PoolFormData, value: string | boolean | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Handle market type changes - clear predicted outcome but let creators set their own odds
      if (field === 'marketType') {
        // Clear predicted outcome to encourage user to enter market-specific outcome
        newData.predictedOutcome = '';
        // REMOVED: automatic odds setting - creators must set their own odds
      }
      
      // Auto-generate market ID and title for football matches
      if (field === 'homeTeam' || field === 'awayTeam' || field === 'league' || field === 'marketType') {
        if (newData.category === 'football' && newData.homeTeam && newData.awayTeam && newData.league) {
          newData.marketId = generateFootballMarketId(newData.homeTeam, newData.awayTeam, newData.league);
          newData.title = generateFootballTitle(newData.homeTeam, newData.awayTeam, newData.marketType);
        }
      }
      
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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
      // Convert form data to contract data using the helper function
      const poolData = convertFormToContractData(formData);

      // Check faucet eligibility if needed (only for STT pools)
      if (!formData.useBitr) {
        const isEligible = await checkEligibility();
        if (!isEligible) {
          toast.error('You need to claim from the faucet first to create pools');
          return;
        }
      }

      // ✅ FIX: Convert BoostTier enum to string and pass to createPool
      // BoostTier enum: NONE=0, BRONZE=1, SILVER=2, GOLD=3
      let boostTierString: 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD' = 'NONE';
      if (formData.enableBoost && formData.boostTier !== undefined && formData.boostTier !== BoostTier.NONE) {
        if (formData.boostTier === BoostTier.BRONZE) {
          boostTierString = 'BRONZE';
        } else if (formData.boostTier === BoostTier.SILVER) {
          boostTierString = 'SILVER';
        } else if (formData.boostTier === BoostTier.GOLD) {
          boostTierString = 'GOLD';
        }
      }

      // ✅ FIX: Use createPool with boostTier parameter (it handles factory call internally)
      const txHash = await createPool({
        ...poolData,
        boostTier: boostTierString,
      });

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
  }, [isConnected, address, validateForm, checkEligibility, createPool, formData, onSuccess, onClose]); // ✅ FIX: Removed createPoolWithBoost from deps


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

        {/* Team fields - show when required by market type or football category */}
        {(formData.category === 'football' || MARKET_TYPE_CONFIG[formData.marketType]?.requiresTeams) && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Home Team
                  {MARKET_TYPE_CONFIG[formData.marketType]?.requiresTeams && (
                    <span className="text-xs text-gray-400 ml-2">(Required for this market type)</span>
                  )}
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
                  {MARKET_TYPE_CONFIG[formData.marketType]?.requiresTeams && (
                    <span className="text-xs text-gray-400 ml-2">(Required for this market type)</span>
                  )}
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

        {/* Market Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Market Type
          </label>
          <select
            value={formData.marketType}
            onChange={(e) => handleInputChange('marketType', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(MARKET_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {/* Market type description */}
          {MARKET_TYPE_CONFIG[formData.marketType] && (
            <p className="text-sm text-gray-400 mt-1">
              {MARKET_TYPE_CONFIG[formData.marketType].description}
            </p>
          )}
        </div>

        {/* Market Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Market Title
            <span className="text-xs text-gray-400 ml-2">(Auto-generated, can be customized)</span>
          </label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Auto-generated based on teams and market type"
          />
          {formData.homeTeam && formData.awayTeam && (
            <p className="text-xs text-gray-400 mt-1">
              Auto-generated: {generateFootballTitle(formData.homeTeam, formData.awayTeam, formData.marketType)}
            </p>
          )}
        </div>

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
            placeholder={MARKET_TYPE_CONFIG[formData.marketType]?.placeholder || "e.g., Home team wins, Bitcoin reaches $100k"}
          />
          {/* Common outcomes suggestions */}
          {MARKET_TYPE_CONFIG[formData.marketType]?.commonOutcomes && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-1">Common outcomes:</p>
              <div className="flex flex-wrap gap-2">
                {MARKET_TYPE_CONFIG[formData.marketType].commonOutcomes.map((outcome, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleInputChange('predictedOutcome', outcome)}
                    className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"
                  >
                    {outcome}
                  </button>
                ))}
              </div>
            </div>
          )}
          {errors.predictedOutcome && (
            <p className="text-red-500 text-sm mt-1">{errors.predictedOutcome}</p>
          )}
        </div>

        {/* Odds */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Odds (Decimal) *
            <span className="text-xs text-gray-400 ml-2">
              (You must set your own odds)
            </span>
          </label>
          <input
            type="number"
            step="0.01"
            min="1.01"
            value={formData.odds}
            onChange={(e) => handleInputChange('odds', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your odds (e.g., 2.50)"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Set your own odds for this prediction (e.g., 2.50 means 2.5x return). This is required.
          </p>
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

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pool Title
          </label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Auto-generated for football matches"
          />
        </div>

        {/* Market ID */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Market ID (Auto-generated)
          </label>
          <input
            type="text"
            value={formData.marketId}
            onChange={(e) => handleInputChange('marketId', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Auto-generated for football matches"
            readOnly={formData.category === 'football'}
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
