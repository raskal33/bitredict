'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { 
  PlusIcon, 
  TrashIcon, 
  CubeIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Button from '@/components/button';
import AmountInput from '@/components/AmountInput';
import Textarea from '@/components/textarea';
import { useComboPools } from '@/hooks/useComboPools';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useReputationStore } from '@/stores/useReputationStore';
import { GuidedMarketService, FootballMatch, Cryptocurrency } from '@/services/guidedMarketService';

interface ComboCondition {
  id: string;
  type: 'football' | 'crypto';
  matchId?: string;
  cryptoId?: string;
  market: string;
  odds: number;
  selection: 'YES' | 'NO';
  description: string;
  eventStartTime: Date;
  eventEndTime: Date;
  // Football specific
  homeTeam?: string;
  awayTeam?: string;
  league?: string;
  // Crypto specific
  symbol?: string;
  name?: string;
  currentPrice?: number;
}

interface ComboPoolFormData {
  title: string;
  description: string;
  creatorStake: number;
  combinedOdds: number;
  betType: 'fixed' | 'max';
  fixedBetAmount?: number;
  maxBetPerUser?: number;
  useBitr: boolean;
  isPrivate: boolean;
  conditions: ComboCondition[];
  eventStartTime: Date;
  eventEndTime: Date;
  bettingEndTime: Date;
  category?: string;
}

export default function EnhancedComboPoolCreationForm({ onSuccess, onClose }: {
  onSuccess?: (poolId: string) => void;
  onClose?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const { connectWallet } = useWalletConnection();
  const { createComboPool } = useComboPools();
  const { getUserReputation, canCreateMarket } = useReputationStore();

  const [formData, setFormData] = useState<ComboPoolFormData>({
    title: '',
    description: '',
    creatorStake: 100,
    combinedOdds: 2.0,
    betType: 'fixed',
    fixedBetAmount: 1000,
    maxBetPerUser: 1000,
    useBitr: false,
    isPrivate: false,
    conditions: [],
    eventStartTime: new Date(),
    eventEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    bettingEndTime: new Date(Date.now() + 23 * 60 * 60 * 1000)
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FootballMatch[] | Cryptocurrency[]>([]);
  const [selectedType, setSelectedType] = useState<'football' | 'crypto' | null>(null);

  const userReputation = address ? getUserReputation(address) : null;
  const canCreate = address ? canCreateMarket(address) : false;

  // Calculate potential winnings
  const potentialWinnings = formData.creatorStake * (formData.combinedOdds - 1);

  // Calculate max bettors
  const maxBettors = formData.betType === 'fixed' && formData.fixedBetAmount 
    ? Math.floor(formData.creatorStake / formData.fixedBetAmount)
    : 0;

  const addCondition = useCallback(() => {
    if (formData.conditions.length >= 5) {
      toast.error('Maximum 5 conditions allowed for combo pools');
      return;
    }
    
    const newCondition: ComboCondition = {
      id: Date.now().toString(),
      type: 'football',
      market: '',
      odds: 2.0,
      selection: 'YES',
      description: '',
      eventStartTime: new Date(),
      eventEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  }, [formData.conditions.length]);

  const removeCondition = useCallback((conditionId: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== conditionId)
    }));
  }, []);

  const updateCondition = useCallback((conditionId: string, field: keyof ComboCondition, value: string | number | Date) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => 
        c.id === conditionId ? { ...c, [field]: value } : c
      )
    }));
  }, []);

  const handleSearch = useCallback(async (query: string, type: 'football' | 'crypto') => {
    if (!query.trim()) return;
    
    try {
      if (type === 'football') {
        const matches = await GuidedMarketService.getFootballMatches(7, 100);
        const filtered = matches.filter(match => 
          match.homeTeam.name.toLowerCase().includes(query.toLowerCase()) ||
          match.awayTeam.name.toLowerCase().includes(query.toLowerCase()) ||
          match.league.name?.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
      } else {
        const cryptos = await GuidedMarketService.getCryptocurrencies();
        const filtered = cryptos.filter(crypto => 
          crypto.name.toLowerCase().includes(query.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search');
    }
  }, []);

  const selectItem = useCallback((item: FootballMatch | Cryptocurrency, conditionId: string) => {
    const condition = formData.conditions.find(c => c.id === conditionId);
    if (!condition) return;

    if ('homeTeam' in item) {
      // Football match
      updateCondition(conditionId, 'type', 'football');
      updateCondition(conditionId, 'matchId', item.id);
      updateCondition(conditionId, 'homeTeam', item.homeTeam.name);
      updateCondition(conditionId, 'awayTeam', item.awayTeam.name);
      updateCondition(conditionId, 'league', item.league.name || '');
      updateCondition(conditionId, 'eventStartTime', new Date(item.matchDate));
    } else {
      // Cryptocurrency
      updateCondition(conditionId, 'type', 'crypto');
      updateCondition(conditionId, 'cryptoId', item.id);
      updateCondition(conditionId, 'symbol', item.symbol);
      updateCondition(conditionId, 'name', item.name);
      updateCondition(conditionId, 'currentPrice', item.currentPrice);
    }
    
    setSearchQuery('');
    setSearchResults([]);
    setSelectedType(null);
  }, [formData.conditions, updateCondition]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Pool title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Pool description is required';
    }

    if (formData.conditions.length < 2) {
      newErrors.conditions = 'At least 2 conditions are required for combo pools';
    }

    if (formData.conditions.length > 10) {
      newErrors.conditions = 'Maximum 10 conditions allowed for combo pools';
    }

    formData.conditions.forEach((condition, index) => {
      if (!condition.market.trim()) {
        newErrors[`condition_${index}_market`] = 'Market selection is required';
      }
      if (condition.odds < 1.01 || condition.odds > 100) {
        newErrors[`condition_${index}_odds`] = 'Odds must be between 1.01 and 100';
      }
    });

    if (formData.creatorStake < 50) {
      newErrors.creatorStake = 'Minimum creator stake is 50 tokens';
    }

    if (formData.betType === 'fixed' && (!formData.fixedBetAmount || formData.fixedBetAmount < 1)) {
      newErrors.fixedBetAmount = 'Fixed bet amount must be at least 1 token';
    }

    if (formData.betType === 'max' && (!formData.maxBetPerUser || formData.maxBetPerUser < 1)) {
      newErrors.maxBetPerUser = 'Max bet per user must be at least 1 token';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      try {
        await connectWallet();
      } catch {
        toast.error('Failed to connect wallet');
      }
      return;
    }

    if (!canCreate) {
      toast.error('Insufficient reputation to create combo pools');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsLoading(true);

    try {
      const comboPoolData = {
        conditions: formData.conditions.map(condition => ({
          marketId: condition.matchId || condition.cryptoId || '',
          expectedOutcome: `${condition.market} ${condition.selection}`,
          description: `${condition.market} ${condition.selection}`,
          odds: 1.0 // Not used in contract, but required by interface
        })),
        combinedOdds: formData.combinedOdds, // Use form input
        creatorStake: BigInt(Math.floor(formData.creatorStake * 1e18)),
        earliestEventStart: BigInt(Math.floor(formData.eventStartTime.getTime() / 1000)),
        latestEventEnd: BigInt(Math.floor(formData.eventEndTime.getTime() / 1000)),
        category: formData.category || "football",
        maxBetPerUser: BigInt(Math.floor((formData.betType === 'fixed' ? formData.fixedBetAmount! : formData.maxBetPerUser!) * 1e18)),
        useBitr: formData.useBitr
      };

      const txHash = await createComboPool(comboPoolData);
      
      toast.success('Combo pool creation transaction submitted!');
      
      if (onSuccess) {
        onSuccess(txHash);
      }
      
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Error creating combo pool:', error);
      toast.error('Failed to create combo pool');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, canCreate, validateForm, createComboPool, formData, onSuccess, onClose, connectWallet]);

  const renderTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Choose Market Type</h2>
        <p className="text-text-secondary">Select the type of market for your combo pool</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setSelectedType('football')}
          className={`p-6 rounded-xl border-2 transition-all ${
            selectedType === 'football'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border-input bg-bg-card text-text-secondary hover:border-primary/50'
          }`}
        >
          <TrophyIcon className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Football</h3>
          <p className="text-sm">Create combo pools with football matches</p>
        </button>

        <button
          onClick={() => setSelectedType('crypto')}
          className={`p-6 rounded-xl border-2 transition-all ${
            selectedType === 'crypto'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border-input bg-bg-card text-text-secondary hover:border-primary/50'
          }`}
        >
          <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Cryptocurrency</h3>
          <p className="text-sm">Create combo pools with crypto predictions</p>
        </button>
      </div>

      {selectedType && (
        <div className="flex justify-center">
          <Button
            onClick={() => setStep(2)}
            variant="primary"
            className="flex items-center gap-2"
          >
            Continue to Selection
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  const renderItemSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Select {selectedType === 'football' ? 'Football Matches' : 'Cryptocurrencies'}
          </h2>
          <p className="text-text-secondary">
            Choose the {selectedType === 'football' ? 'matches' : 'cryptocurrencies'} for your combo pool
          </p>
        </div>
        <Button
          onClick={() => setStep(1)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value, selectedType!);
            }}
            placeholder={`Search ${selectedType === 'football' ? 'football matches' : 'cryptocurrencies'}...`}
            className="w-full pl-10 pr-4 py-3 bg-bg-card border border-border-input rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-bg-card border border-border-input rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  // This will be handled by the condition form
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-full p-4 text-left hover:bg-bg-card/50 border-b border-border-input last:border-b-0"
              >
                {'homeTeam' in item ? (
                  <div>
                    <div className="font-semibold text-text-primary">
                      {item.homeTeam.name} vs {item.awayTeam.name}
                    </div>
                    <div className="text-sm text-text-muted">{item.league.name}</div>
                    <div className="text-xs text-text-muted">{new Date(item.matchDate).toLocaleString()}</div>
                  </div>
                ) : (
                  <div>
                    <div className="font-semibold text-text-primary">
                      {item.symbol} - {item.name}
                    </div>
                    <div className="text-sm text-text-muted">${item.currentPrice.toLocaleString()}</div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Condition Button */}
      <div className="text-center">
        <Button
          onClick={addCondition}
          variant="outline"
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add {selectedType === 'football' ? 'Match' : 'Crypto'} Condition
        </Button>
      </div>

      {/* Conditions List */}
      <div className="space-y-4">
        {formData.conditions.map((condition, index) => (
          <motion.div
            key={condition.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 border border-border-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <CubeIcon className="h-5 w-5 text-primary" />
                Condition {index + 1}
              </h3>
              {formData.conditions.length > 2 && (
                <button
                  onClick={() => removeCondition(condition.id)}
                  className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Item Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {selectedType === 'football' ? 'Select Match' : 'Select Cryptocurrency'} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value, selectedType!);
                    }}
                    placeholder={`Search ${selectedType === 'football' ? 'matches' : 'cryptocurrencies'}...`}
                    className="w-full px-4 py-3 bg-bg-card border border-border-input rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-bg-card border border-border-input rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => selectItem(item, condition.id)}
                          className="w-full p-4 text-left hover:bg-bg-card/50 border-b border-border-input last:border-b-0"
                        >
                          {'homeTeam' in item ? (
                            <div>
                              <div className="font-semibold text-text-primary">
                                {item.homeTeam.name} vs {item.awayTeam.name}
                              </div>
                              <div className="text-sm text-text-muted">{item.league.name}</div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold text-text-primary">
                                {item.symbol} - {item.name}
                              </div>
                              <div className="text-sm text-text-muted">${item.currentPrice.toLocaleString()}</div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Market Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Market Type *
                </label>
                <select
                  value={condition.market}
                  onChange={(e) => updateCondition(condition.id, 'market', e.target.value)}
                  className="w-full px-4 py-3 bg-bg-card border border-border-input rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                >
                  <option value="">Select market...</option>
                  {selectedType === 'football' ? (
                    <>
                      <option value="1X2">1X2 (Match Result)</option>
                      <option value="Over/Under 2.5">Over/Under 2.5 Goals</option>
                      <option value="Both Teams to Score">Both Teams to Score</option>
                      <option value="Half Time Result">Half Time Result</option>
                    </>
                  ) : (
                    <>
                      <option value="Price Target">Price Target</option>
                      <option value="24h Change">24h Price Change</option>
                      <option value="Weekly Change">Weekly Price Change</option>
                    </>
                  )}
                </select>
                {errors[`condition_${index}_market`] && (
                  <p className="text-error text-sm mt-1">{errors[`condition_${index}_market`]}</p>
                )}
              </div>

              {/* Odds */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Odds (Decimal)
                </label>
                <AmountInput
                  value={condition.odds.toString()}
                  onChange={(value) => updateCondition(condition.id, 'odds', parseFloat(value || '0'))}
                  placeholder="2.00"
                  min={1.01}
                  max={100}
                  step={0.01}
                  allowDecimals={true}
                  currency="x"
                  error={errors[`condition_${index}_odds`]}
                />
              </div>

              {/* Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Your Prediction
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateCondition(condition.id, 'selection', 'YES')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      condition.selection === 'YES'
                        ? 'border-success bg-success/10 text-success'
                        : 'border-border-input bg-bg-card text-text-secondary hover:border-success/50'
                    }`}
                  >
                    <div className="font-semibold">YES</div>
                  </button>
                  <button
                    onClick={() => updateCondition(condition.id, 'selection', 'NO')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      condition.selection === 'NO'
                        ? 'border-error bg-error/10 text-error'
                        : 'border-border-input bg-bg-card text-text-secondary hover:border-error/50'
                    }`}
                  >
                    <div className="font-semibold">NO</div>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description
                </label>
                <Textarea
                  value={condition.description}
                  onChange={(e) => updateCondition(condition.id, 'description', e.target.value)}
                  placeholder="Describe this condition..."
                  rows={2}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {formData.conditions.length >= 2 && (
        <div className="flex justify-between">
          <Button onClick={() => setStep(1)} variant="outline">
            Back: Type Selection
          </Button>
          <Button onClick={() => setStep(3)} variant="primary">
            Next: Configuration
          </Button>
        </div>
      )}
    </div>
  );

  const renderConfiguration = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Pool Configuration</h2>
          <p className="text-text-secondary">Configure your combo pool settings and stake</p>
        </div>
        <Button
          onClick={() => setStep(2)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pool Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Pool Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Premier League Champions + Bitcoin Bull Run"
            className="w-full px-4 py-3 bg-bg-card border border-border-input rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
          {errors.title && (
            <p className="text-error text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <Textarea
            label="Pool Description *"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your combo pool and the conditions..."
            rows={4}
            error={errors.description}
          />
        </div>

        {/* Creator Stake */}
        <div>
          <AmountInput
            label="Creator Stake *"
            value={formData.creatorStake.toString()}
            onChange={(value) => setFormData(prev => ({ ...prev, creatorStake: parseFloat(value || '0') }))}
            placeholder="100.0"
            min={50}
            max={1000000}
            step={0.1}
            allowDecimals={true}
            currency={formData.useBitr ? 'BITR' : 'STT'}
            help="Your stake that acts as liquidity for the pool"
            error={errors.creatorStake}
          />
        </div>

        {/* Bet Type */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Bet Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormData(prev => ({ ...prev, betType: 'fixed' }))}
              className={`p-3 rounded-xl border text-center transition-all ${
                formData.betType === 'fixed'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border-input bg-bg-card text-text-secondary hover:border-primary/50'
              }`}
            >
              <div className="font-semibold">Fixed Bet</div>
              <div className="text-xs mt-1">Exact amount</div>
            </button>
            <button
              onClick={() => setFormData(prev => ({ ...prev, betType: 'max' }))}
              className={`p-3 rounded-xl border text-center transition-all ${
                formData.betType === 'max'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border-input bg-bg-card text-text-secondary hover:border-primary/50'
              }`}
            >
              <div className="font-semibold">Max Bet</div>
              <div className="text-xs mt-1">Up to limit</div>
            </button>
          </div>
        </div>

        {/* Bet Amount */}
        {formData.betType === 'fixed' ? (
          <div>
            <AmountInput
              label="Fixed Bet Amount *"
              value={formData.fixedBetAmount?.toString() || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, fixedBetAmount: parseFloat(value || '0') }))}
              placeholder="1000.0"
              min={1}
              max={1000000}
              step={0.1}
              allowDecimals={true}
              currency={formData.useBitr ? 'BITR' : 'STT'}
              help="Exact bet amount users must place"
              error={errors.fixedBetAmount}
            />
          </div>
        ) : (
          <div>
            <AmountInput
              label="Max Bet Per User *"
              value={formData.maxBetPerUser?.toString() || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, maxBetPerUser: parseFloat(value || '0') }))}
              placeholder="1000.0"
              min={1}
              max={1000000}
              step={0.1}
              allowDecimals={true}
              currency={formData.useBitr ? 'BITR' : 'STT'}
              help="Maximum bet amount per user"
              error={errors.maxBetPerUser}
            />
          </div>
        )}

        {/* Payment Token */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Payment Token
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormData(prev => ({ ...prev, useBitr: false }))}
              className={`p-3 rounded-xl border text-center transition-all ${
                !formData.useBitr
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border-input bg-bg-card text-text-secondary hover:border-primary/50'
              }`}
            >
              <div className="font-semibold">STT</div>
              <div className="text-xs mt-1">Somnia Network</div>
            </button>
            <button
              onClick={() => setFormData(prev => ({ ...prev, useBitr: true }))}
              className={`p-3 rounded-xl border text-center transition-all ${
                formData.useBitr
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border-input bg-bg-card text-text-secondary hover:border-primary/50'
              }`}
            >
              <div className="font-semibold">BITR</div>
              <div className="text-xs mt-1">Reduced fees</div>
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Pool Privacy
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormData(prev => ({ ...prev, isPrivate: false }))}
              className={`p-3 rounded-xl border text-center transition-all ${
                !formData.isPrivate
                  ? 'border-success bg-success/10 text-success'
                  : 'border-border-input bg-bg-card text-text-secondary hover:border-success/50'
              }`}
            >
              <div className="font-semibold">Public</div>
              <div className="text-xs mt-1">Anyone can bet</div>
            </button>
            <button
              onClick={() => setFormData(prev => ({ ...prev, isPrivate: true }))}
              className={`p-3 rounded-xl border text-center transition-all ${
                formData.isPrivate
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-input bg-bg-card text-text-secondary hover:border-accent/50'
              }`}
            >
              <div className="font-semibold">Private</div>
              <div className="text-xs mt-1">Whitelist only</div>
            </button>
          </div>
        </div>
      </div>

      {/* Calculations */}
      {formData.betType === 'fixed' && formData.fixedBetAmount && (
        <div className="glass-card p-6 border border-primary/20">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <CalculatorIcon className="h-5 w-5 text-primary" />
            Pool Calculations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-text-muted text-sm">Max Bettors</label>
              <p className="text-text-primary font-semibold text-xl">{maxBettors}</p>
            </div>
            <div>
              <label className="text-text-muted text-sm">Combined Odds</label>
              <p className="text-primary font-bold text-xl">{formData.combinedOdds.toFixed(2)}x</p>
            </div>
            <div>
              <label className="text-text-muted text-sm">Potential Win</label>
              <p className="text-success font-bold text-xl">
                {potentialWinnings.toFixed(2)} {formData.useBitr ? 'BITR' : 'STT'}
              </p>
            </div>
          </div>
          {maxBettors > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-text-muted">Bettor Progress</span>
                <span className="text-text-primary">0 / {maxBettors}</span>
              </div>
              <div className="w-full bg-bg-card rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button onClick={() => setStep(2)} variant="outline">
          Back: Selection
        </Button>
        <Button onClick={() => setStep(4)} variant="primary">
          Next: Review
        </Button>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Pool Summary</h2>
          <p className="text-text-secondary">Review your combo pool before creation</p>
        </div>
        <Button
          onClick={() => setStep(3)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="glass-card p-6 border border-primary/20">
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-2">{formData.title}</h4>
            <p className="text-text-secondary">{formData.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-muted text-sm">Conditions</label>
              <p className="text-text-primary font-semibold">{formData.conditions.length}</p>
            </div>
            <div>
              <label className="text-text-muted text-sm">Combined Odds</label>
              <p className="text-primary font-bold text-xl">{formData.combinedOdds.toFixed(2)}x</p>
            </div>
            <div>
              <label className="text-text-muted text-sm">Creator Stake</label>
              <p className="text-text-primary font-semibold">
                {formData.creatorStake} {formData.useBitr ? 'BITR' : 'STT'}
              </p>
            </div>
            <div>
              <label className="text-text-muted text-sm">Potential Win</label>
              <p className="text-success font-bold text-xl">
                {potentialWinnings.toFixed(2)} {formData.useBitr ? 'BITR' : 'STT'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border-card">
            <h5 className="font-semibold text-text-primary mb-3">Conditions:</h5>
            <div className="space-y-2">
              {formData.conditions.map((condition) => (
                <div key={condition.id} className="flex items-center justify-between p-3 bg-bg-card/50 rounded-lg">
                  <div>
                    <p className="text-text-primary font-medium">
                      {condition.type === 'football' 
                        ? `${condition.homeTeam} vs ${condition.awayTeam}` 
                        : `${condition.symbol} - ${condition.name}`
                      }
                    </p>
                    <p className="text-text-muted text-sm">{condition.market} - {condition.selection}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-semibold">{condition.odds}x</p>
                    <p className="text-text-muted text-xs">{condition.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button onClick={() => setStep(3)} variant="outline">
          Back: Configuration
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          loading={isLoading}
          variant="primary"
          className="min-w-[200px]"
        >
          {isLoading ? 'Creating Pool...' : 'Create Combo Pool'}
        </Button>
      </div>
    </div>
  );

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-warning mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-primary mb-2">Wallet Not Connected</h2>
        <p className="text-text-secondary mb-6">Please connect your wallet to create combo pools.</p>
        <Button onClick={connectWallet} variant="primary">
          Connect Wallet
        </Button>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-error mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-primary mb-2">Insufficient Reputation</h2>
        <p className="text-text-secondary mb-6">
          You need higher reputation to create combo pools. Participate in existing markets to build your reputation.
        </p>
        {userReputation && (
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg">
              <span className="text-sm font-medium">Current Reputation: {userReputation?.score || 0}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3, 4].map((stepNumber) => (
          <React.Fragment key={stepNumber}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= stepNumber 
                ? 'bg-primary text-white' 
                : 'bg-bg-card text-text-muted'
            }`}>
              {stepNumber}
            </div>
            {stepNumber < 4 && (
              <div className={`h-1 w-16 ${
                step > stepNumber ? 'bg-primary' : 'bg-bg-card'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="type-selection"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderTypeSelection()}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="item-selection"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderItemSelection()}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="configuration"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderConfiguration()}
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderSummary()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
