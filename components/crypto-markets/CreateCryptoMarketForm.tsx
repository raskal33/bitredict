'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { keccak256, toHex } from 'viem';
import { usePoolCore, usePoolFactory, useFaucet } from '@/hooks/useContractInteractions';
import { toast } from 'react-hot-toast';

interface CreateCryptoMarketFormProps {
  onSuccess?: (poolId: string) => void;
  onClose?: () => void;
}

interface CryptoMarketFormData {
  // Basic pool data
  predictedOutcome: string;
  odds: string;
  eventStartTime: string;
  eventEndTime: string;
  league: string;
  category: string;
  useBitr: boolean;
  maxBetPerUser: string;
  isPrivate: boolean;
  creatorStake: string;
  marketId: string;
  
  // Crypto-specific data
  cryptoAsset: string;
  targetPrice: string;
  priceDirection: 'above' | 'below';
  timeFrame: string;
  
  // Required contract parameters
  homeTeam: string;
  awayTeam: string;
  title: string;
  
  // Market type and oracle
  marketType: number;
  oracleType: number;
  
  // Boost data
  enableBoost: boolean;
  boostTier: number;
}

const CRYPTO_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'BNB', name: 'Binance Coin', icon: '🟡' },
  { symbol: 'ADA', name: 'Cardano', icon: '🔵' },
  { symbol: 'SOL', name: 'Solana', icon: '☀️' },
  { symbol: 'DOT', name: 'Polkadot', icon: '🔴' },
  { symbol: 'MATIC', name: 'Polygon', icon: '🟣' },
  { symbol: 'AVAX', name: 'Avalanche', icon: '🔺' },
  { symbol: 'LINK', name: 'Chainlink', icon: '🔗' },
  { symbol: 'UNI', name: 'Uniswap', icon: '🦄' },
];

const TIME_FRAMES = [
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '3d', label: '3 Days' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
];

const BOOST_TIERS = [
  { value: 0, label: 'No Boost', cost: '0 STT' },
  { value: 1, label: 'Bronze Boost', cost: '100 STT' },
  { value: 2, label: 'Silver Boost', cost: '500 STT' },
  { value: 3, label: 'Gold Boost', cost: '1000 STT' },
  { value: 4, label: 'Platinum Boost', cost: '2500 STT' },
];

export default function CreateCryptoMarketForm({ onSuccess, onClose }: CreateCryptoMarketFormProps) {
  const { address, isConnected } = useAccount();
  const { createPool } = usePoolCore();
  const { createPoolWithBoost } = usePoolFactory();
  const { checkEligibility } = useFaucet();

  const [isLoading, setIsLoading] = useState(false);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [formData, setFormData] = useState<CryptoMarketFormData>({
    predictedOutcome: '',
    odds: '',
    eventStartTime: '',
    eventEndTime: '',
    league: 'Crypto',
    category: 'bitcoin',
    useBitr: true, // Default to BITR for crypto
    maxBetPerUser: '100',
    isPrivate: false,
    creatorStake: '1.0',
    marketId: '',
    cryptoAsset: 'BTC',
    targetPrice: '130000',
    priceDirection: 'above',
    timeFrame: '24h',
    homeTeam: 'BTC',
    awayTeam: 'USD',
    title: 'BTC Price Prediction',
    marketType: 0, // MONEYLINE for crypto price direction
    oracleType: 0, // GUIDED oracle type
    enableBoost: false,
    boostTier: 0,
  });

  const [errors, setErrors] = useState<Partial<CryptoMarketFormData>>({});

  // Fetch current crypto prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/crypto/prices');
        if (response.ok) {
          const data = await response.json();
          setCurrentPrices(data);
        }
      } catch (error) {
        console.error('Error fetching crypto prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);


  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<CryptoMarketFormData> = {};

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

    if (!formData.targetPrice || parseFloat(formData.targetPrice) <= 0) {
      newErrors.targetPrice = 'Valid target price is required';
    }

    if (formData.maxBetPerUser && parseFloat(formData.maxBetPerUser) <= 0) {
      newErrors.maxBetPerUser = 'Max bet per user must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field: keyof CryptoMarketFormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const generatePredictedOutcome = useCallback(() => {
    const targetPrice = parseFloat(formData.targetPrice);
    
    // Generate generic oracle-compatible outcome
    return `${formData.cryptoAsset} > $${targetPrice.toLocaleString()}`;
  }, [formData.cryptoAsset, formData.targetPrice]);

  const generateMarketId = useCallback(() => {
    const targetPrice = parseFloat(formData.targetPrice);
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '_');
    return `${formData.cryptoAsset.toLowerCase()}_${targetPrice}_${date}`;
  }, [formData.cryptoAsset, formData.targetPrice]);

  const calculateEventTimes = useCallback((timeframe: string) => {
    const now = new Date();
    const hours = getTimeframeHours(timeframe);
    
    // CORRECT LOGIC: 
    // - Event Start: Creator sets when betting closes and price tracking begins
    // - Event End: Event Start + Timeframe (when final price is fetched)
    // - Default: Event starts in 1 hour, ends after timeframe duration
    const eventStart = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour from now (default)
    const eventEnd = new Date(eventStart.getTime() + (hours * 60 * 60 * 1000)); // Event Start + Timeframe
    
    // ✅ FIX: Convert UTC dates to local datetime-local format
    // toISOString() gives UTC, but datetime-local expects local time
    // Format: "YYYY-MM-DDTHH:mm" in LOCAL timezone
    const formatDateTimeLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    return {
      eventStartTime: formatDateTimeLocal(eventStart), // Local time format for datetime-local input
      eventEndTime: formatDateTimeLocal(eventEnd) // Local time format for datetime-local input
    };
  }, []);

  const getTimeframeHours = (timeframe: string): number => {
    const hoursMap: Record<string, number> = {
      '1h': 1,
      '4h': 4,
      '24h': 24,
      '3d': 72,
      '7d': 168,
      '30d': 720
    };
    return hoursMap[timeframe] || 24;
  };

  // Auto-generate prediction outcome and market ID
  useEffect(() => {
    const predictedOutcome = generatePredictedOutcome();
    const marketId = generateMarketId();
    const times = calculateEventTimes(formData.timeFrame);
    
    setFormData(prev => ({
      ...prev,
      predictedOutcome,
      marketId,
      eventStartTime: times.eventStartTime,
      eventEndTime: times.eventEndTime,
      title: `${formData.cryptoAsset} Price Prediction`,
      homeTeam: formData.cryptoAsset,
      awayTeam: 'USD',
      category: 'cryptocurrency'
    }));
  }, [formData.cryptoAsset, formData.targetPrice, formData.timeFrame, generatePredictedOutcome, generateMarketId, calculateEventTimes]);

  const calculateOdds = useCallback(() => {
    const currentPrice = currentPrices[formData.cryptoAsset];
    const targetPrice = parseFloat(formData.targetPrice);
    
    if (!currentPrice || !targetPrice) return '';

    const priceChange = Math.abs(targetPrice - currentPrice) / currentPrice;
    const timeFrameMultiplier = {
      '1h': 0.5,
      '4h': 0.7,
      '24h': 1.0,
      '3d': 1.3,
      '7d': 1.6,
      '30d': 2.0,
    }[formData.timeFrame] || 1.0;

    // Simple odds calculation based on price change and time frame
    const baseOdds = 1 + (priceChange * timeFrameMultiplier * 2);
    return Math.max(1.1, Math.min(10, baseOdds)).toFixed(2);
  }, [currentPrices, formData.cryptoAsset, formData.targetPrice, formData.timeFrame]);

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

      // Generate predicted outcome if not provided
      const predictedOutcome = formData.predictedOutcome || generatePredictedOutcome();

      // Generate marketId hash for crypto market
      const marketIdString = `${formData.cryptoAsset.toLowerCase()}_${formData.targetPrice}_${Date.now()}`;
      const marketIdHash = keccak256(toHex(marketIdString));

      // ✅ FIX: Properly handle timezone conversion for datetime-local inputs
      // datetime-local inputs are in user's local timezone, but we need UTC timestamps
      // The string format is "YYYY-MM-DDTHH:mm" without timezone
      // We need to interpret it as local time and convert to UTC
      const parseDateTimeLocal = (dateTimeLocal: string): number => {
        // datetime-local format: "2025-11-02T23:00" (no timezone info)
        // JavaScript Date interprets this as LOCAL time, then we get UTC timestamp
        const localDate = new Date(dateTimeLocal);
        // Get UTC timestamp in seconds
        return Math.floor(localDate.getTime() / 1000);
      };
      
      // Validate that eventEndTime is eventStartTime + timeframe
      const eventStartTimestamp = parseDateTimeLocal(formData.eventStartTime);
      const eventEndTimestamp = parseDateTimeLocal(formData.eventEndTime);
      const timeframeHours = getTimeframeHours(formData.timeFrame);
      const expectedEndTimestamp = eventStartTimestamp + (timeframeHours * 3600);
      
      // Warn if there's a mismatch (user manually changed times)
      if (Math.abs(eventEndTimestamp - expectedEndTimestamp) > 60) {
        console.warn(`⚠️ Event end time (${eventEndTimestamp}) doesn't match timeframe (${timeframeHours}h from start ${eventStartTimestamp}). Expected: ${expectedEndTimestamp}`);
      }
      
      // Prepare pool data with all required contract parameters
      const poolData = {
        predictedOutcome,
        odds: BigInt(Math.floor(parseFloat(formData.odds) * 100)), // Convert to basis points
        eventStartTime: BigInt(eventStartTimestamp),
        eventEndTime: BigInt(eventEndTimestamp),
        league: formData.league,
        category: formData.category,
        useBitr: formData.useBitr,
        maxBetPerUser: formData.maxBetPerUser ? BigInt(parseFloat(formData.maxBetPerUser) * 1e18) : BigInt(0),
        isPrivate: formData.isPrivate,
        creatorStake: BigInt(parseFloat(formData.creatorStake) * 1e18),
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
        title: formData.title,
        oracleType: formData.oracleType, // GUIDED oracle type for crypto
        marketId: marketIdHash, // Use keccak256 hash for crypto markets
        marketType: formData.marketType, // MONEYLINE for crypto price direction
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

      toast.success('Crypto market creation transaction submitted!');
      
      if (onSuccess) {
        onSuccess(txHash);
      }
      
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Error creating crypto market:', error);
      toast.error('Failed to create crypto market');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, validateForm, checkEligibility, createPool, createPoolWithBoost, formData, generatePredictedOutcome, onSuccess, onClose]);

  const currentPrice = currentPrices[formData.cryptoAsset];
  const suggestedOdds = calculateOdds();

  return (
    <div className="bg-gray-900 rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Create Crypto Market</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Crypto Asset Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Crypto Asset
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CRYPTO_ASSETS.map((asset) => (
              <button
                key={asset.symbol}
                type="button"
                onClick={() => handleInputChange('cryptoAsset', asset.symbol)}
                className={`p-3 rounded-lg text-left ${
                  formData.cryptoAsset === asset.symbol
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{asset.icon}</span>
                  <div>
                    <div className="font-medium">{asset.symbol}</div>
                    <div className="text-sm opacity-75">{asset.name}</div>
                    {currentPrice && (
                      <div className="text-xs opacity-50">
                        ${currentPrice.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Price Prediction */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Price (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.targetPrice}
              onChange={(e) => handleInputChange('targetPrice', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 100000"
            />
            {errors.targetPrice && (
              <p className="text-red-500 text-sm mt-1">{errors.targetPrice}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price Direction
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleInputChange('priceDirection', 'above')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  formData.priceDirection === 'above'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Above
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('priceDirection', 'below')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  formData.priceDirection === 'below'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Below
              </button>
            </div>
          </div>
        </div>

        {/* Time Frame */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Time Frame
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TIME_FRAMES.map((timeFrame) => (
              <button
                key={timeFrame.value}
                type="button"
                onClick={() => {
                  handleInputChange('timeFrame', timeFrame.value);
                  // Update event times when timeframe changes
                  const times = calculateEventTimes(timeFrame.value);
                  setFormData(prev => ({
                    ...prev,
                    eventStartTime: times.eventStartTime,
                    eventEndTime: times.eventEndTime
                  }));
                }}
                className={`p-3 rounded-lg font-medium ${
                  formData.timeFrame === timeFrame.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {timeFrame.label}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-generated Values Display */}
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="text-lg font-medium text-white mb-3">🎯 Auto-Generated Values</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Prediction Outcome:
            </label>
            <div className="text-white text-sm font-mono bg-gray-700 p-2 rounded">
              {formData.predictedOutcome}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              This is the generic outcome sent to the oracle
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Market ID:
            </label>
            <div className="text-white text-sm font-mono bg-gray-700 p-2 rounded">
              {formData.marketId}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Unique identifier for this market
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Pool Title:
            </label>
            <div className="text-white text-sm font-mono bg-gray-700 p-2 rounded">
              {formData.title}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Home Team:
              </label>
              <div className="text-white text-sm font-mono bg-gray-700 p-2 rounded">
                {formData.homeTeam}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Away Team:
              </label>
              <div className="text-white text-sm font-mono bg-gray-700 p-2 rounded">
                {formData.awayTeam}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Prediction Override */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Custom Prediction (Optional)
          </label>
          <input
            type="text"
            value={formData.predictedOutcome}
            onChange={(e) => handleInputChange('predictedOutcome', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Override the generated prediction"
          />
          {errors.predictedOutcome && (
            <p className="text-red-500 text-sm mt-1">{errors.predictedOutcome}</p>
          )}
        </div>

        {/* Market Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Market Type
          </label>
          <select
            value={formData.marketType}
            onChange={(e) => handleInputChange('marketType', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>Moneyline (Price Direction) - Recommended</option>
            <option value={1}>Over/Under (Price Targets)</option>
            <option value={7}>Custom Market</option>
          </select>
          <p className="text-sm text-gray-400 mt-1">
            Moneyline is best for crypto price direction predictions
          </p>
        </div>

        {/* Oracle Type (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Oracle Type
          </label>
          <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300">
            GUIDED (Automatic Resolution)
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Crypto pools use guided oracle for automatic price resolution
          </p>
        </div>

        {/* Odds */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Odds (Decimal)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={formData.odds}
              onChange={(e) => handleInputChange('odds', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 2.50"
            />
            {suggestedOdds && (
              <button
                type="button"
                onClick={() => handleInputChange('odds', suggestedOdds)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
              >
                Use Suggested ({suggestedOdds})
              </button>
            )}
          </div>
          {errors.odds && (
            <p className="text-red-500 text-sm mt-1">{errors.odds}</p>
          )}
        </div>

        {/* Event Timeline */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3">⏰ Event Timeline</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event Start Time
              </label>
              <input
                type="datetime-local"
                value={formData.eventStartTime}
                onChange={(e) => {
                  handleInputChange('eventStartTime', e.target.value);
                  // ✅ FIX: Recalculate event end time when start time changes (preserve timeframe)
                  if (e.target.value) {
                    const startDate = new Date(e.target.value);
                    const timeframeHours = getTimeframeHours(formData.timeFrame);
                    const endDate = new Date(startDate.getTime() + (timeframeHours * 60 * 60 * 1000));
                    const formatDateTimeLocal = (date: Date): string => {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const hours = String(date.getHours()).padStart(2, '0');
                      const minutes = String(date.getMinutes()).padStart(2, '0');
                      return `${year}-${month}-${day}T${hours}:${minutes}`;
                    };
                    handleInputChange('eventEndTime', formatDateTimeLocal(endDate));
                  }
                }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                ⚠️ Time is in your local timezone. Will be converted to UTC on submit.
              </p>
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.eventEndTime && (
                <p className="text-red-500 text-sm mt-1">{errors.eventEndTime}</p>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Betting Window:</span>
              <span>Now → {new Date(formData.eventStartTime).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Event Window:</span>
              <span>{new Date(formData.eventStartTime).toLocaleString()} → {new Date(formData.eventEndTime).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Price Snapshot:</span>
              <span>{new Date(formData.eventEndTime).toLocaleString()}</span>
            </div>
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
            {isLoading ? 'Creating Market...' : 'Create Crypto Market'}
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
