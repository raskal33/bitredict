"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { toast } from "react-hot-toast";
import { 
  CurrencyDollarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import Button from "@/components/button";
import Input from "@/components/input";
import Textarea from "@/components/textarea";
import AnimatedTitle from "@/components/AnimatedTitle";
import FixtureSelector from "@/components/FixtureSelector";
import { useReputationStore } from "@/stores/useReputationStore";
import ReputationBadge from "@/components/ReputationBadge";
import { GuidedMarketService, Cryptocurrency } from "@/services/guidedMarketService";

// Contract ABI for createPool function
const BITREDICT_POOL_ABI = [
  {
    name: "createPool",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_predictedOutcome", type: "bytes32" },
      { name: "_odds", type: "uint256" },
      { name: "_creatorStake", type: "uint256" },
      { name: "_eventStartTime", type: "uint256" },
      { name: "_eventEndTime", type: "uint256" },
      { name: "_league", type: "string" },
      { name: "_category", type: "string" },
      { name: "_region", type: "string" },
      { name: "_isPrivate", type: "bool" },
      { name: "_maxBetPerUser", type: "uint256" },
      { name: "_useBitr", type: "bool" }
    ],
    outputs: []
  }
] as const;

const CONTRACT_ADDRESS = "0x742d35Cc6635C0532925a3b8D84e4123a4b37A12";

// SportMonks Fixture interface
interface Fixture {
  id: number;
  homeTeam: {
    id: number;
    name: string;
  };
  awayTeam: {
    id: number;
    name: string;
  };
  league: {
    id: number;
    name: string;
    season?: number;
  };
  round?: string;
  matchDate: string;
  venue?: {
    name: string;
    city: string;
  };
  status: string;
  odds?: {
    home: number;
    draw: number;
    away: number;
    over25: number;
    under25: number;
    bttsYes: number;
    bttsNo: number;
    updatedAt: string;
  };
}

interface GuidedMarketData {
  // Common fields
  category: 'football' | 'cryptocurrency' | '';
  odds: number;
  creatorStake: number;
  description: string;
  
  // Football specific (updated for SportMonks)
  selectedFixture?: Fixture;
  outcome?: 'home' | 'away' | 'draw' | 'over25' | 'under25';
  
  // Cryptocurrency specific
  selectedCrypto?: Cryptocurrency;
  targetPrice?: number;
  timeframe?: string;
  direction?: 'above' | 'below';
  
  // Generated fields
  title?: string;
  eventStartTime?: Date;
  eventEndTime?: Date;
}

export default function CreateMarketPage() {
  const { address, isConnected } = useAccount();
  const { getUserReputation, canCreateMarket, addReputationAction } = useReputationStore();
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [data, setData] = useState<GuidedMarketData>({
    category: '',
    odds: 200, // 2.0x default
    creatorStake: 10, // Minimum for guided markets
    description: ''
  });

  const [useBitr, setUseBitr] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [deploymentHash, setDeploymentHash] = useState<string>('');

  // Search states for crypto (football now uses FixtureSelector)
  const [cryptoSearchQuery, setCryptoSearchQuery] = useState('');
  const [filteredCryptos, setFilteredCryptos] = useState<Cryptocurrency[]>([]);

  const userReputation = address ? getUserReputation(address) : null;
  const canCreate = address ? canCreateMarket(address) : false;

  // Initialize data
  useEffect(() => {
    setFilteredCryptos(GuidedMarketService.getCryptocurrencies());
  }, []);

  // Search functionality for crypto
  useEffect(() => {
    if (cryptoSearchQuery) {
      setFilteredCryptos(GuidedMarketService.searchCryptocurrencies(cryptoSearchQuery));
    } else {
      setFilteredCryptos(GuidedMarketService.getCryptocurrencies());
    }
  }, [cryptoSearchQuery]);

  // Handle transaction results
  useEffect(() => {
    if (writeError) {
      toast.error(writeError.message || 'Transaction failed');
      setIsLoading(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success('Market created successfully!');
      setDeploymentHash(hash);
      setIsLoading(false);
      
      // Add reputation points for market creation
      if (address) {
        addReputationAction(address, {
          type: 'market_created',
          points: 8,
          description: 'Created a guided market',
          marketId: hash
        });
      }
    }
  }, [isSuccess, hash, address, addReputationAction]);

  const handleInputChange = <K extends keyof GuidedMarketData>(field: K, value: GuidedMarketData[K]) => {
    setData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate title and timing for football matches
      if (field === 'selectedFixture' && value) {
        const fixture = value as Fixture;
        updated.title = `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`;
        updated.eventStartTime = new Date(fixture.matchDate);
        updated.eventEndTime = new Date(new Date(fixture.matchDate).getTime() + 2 * 60 * 60 * 1000); // 2 hours after start
      }

      // Auto-generate title for crypto
      if (field === 'selectedCrypto' && value) {
        const crypto = value as Cryptocurrency;
        if (data.direction && data.targetPrice) {
          updated.title = `${crypto.symbol} ${data.direction} $${data.targetPrice}`;
        }
      }

      if ((field === 'direction' || field === 'targetPrice') && data.selectedCrypto) {
        updated.title = `${data.selectedCrypto.symbol} ${updated.direction} $${updated.targetPrice}`;
      }

      return updated;
    });
  };

  const handleFixtureSelect = (fixture: Fixture) => {
    handleInputChange('selectedFixture', fixture);
    
    // Auto-populate some fields based on fixture
    if (fixture.odds) {
      // Use the most balanced odd as default (often the draw)
      const defaultOdds = Math.floor(fixture.odds.draw * 100) || 200;
      handleInputChange('odds', defaultOdds);
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!data.category) {
        newErrors.category = 'Please select a category';
      }

      if (data.category === 'football') {
        if (!data.selectedFixture) {
          newErrors.selectedFixture = 'Please select a football match';
        }
        if (!data.outcome) {
          newErrors.outcome = 'Please select an outcome to predict';
        }
      }

      if (data.category === 'cryptocurrency') {
        if (!data.selectedCrypto) {
          newErrors.selectedCrypto = 'Please select a cryptocurrency';
        }
        if (!data.direction) {
          newErrors.direction = 'Please select price direction';
        }
        if (!data.targetPrice || data.targetPrice <= 0) {
          newErrors.targetPrice = 'Please enter a valid target price';
        }
        if (!data.timeframe) {
          newErrors.timeframe = 'Please select a timeframe';
        }
      }
    }

    if (stepNumber === 2) {
      if (!data.odds || data.odds < 110 || data.odds > 10000) {
        newErrors.odds = 'Odds must be between 1.10x and 100.0x';
      }
      
      if (!data.creatorStake || data.creatorStake < 1) {
        newErrors.creatorStake = 'Creator stake must be at least 1 token';
      }

      if (!data.description.trim()) {
        newErrors.description = 'Please provide a description';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const generatePredictedOutcome = (): string => {
    if (data.category === 'football' && data.selectedFixture) {
      const fixture = data.selectedFixture;
      switch (data.outcome) {
        case 'home':
          return `${fixture.awayTeam.name}_wins`; // Predict away won't win (home will)
        case 'away':
          return `${fixture.homeTeam.name}_wins`; // Predict home won't win (away will)  
        case 'draw':
          return `no_draw`; // Predict there won't be a draw
        case 'over25':
          return `under_25_goals`; // Predict under 2.5 goals (over won't happen)
        case 'under25':
          return `over_25_goals`; // Predict over 2.5 goals (under won't happen)
        default:
          return `${fixture.homeTeam.name}_vs_${fixture.awayTeam.name}`;
      }
    }

    if (data.category === 'cryptocurrency' && data.selectedCrypto) {
      const crypto = data.selectedCrypto;
      if (data.direction === 'above') {
        return `${crypto.symbol}_below_${data.targetPrice}`; // Predict it won't go above
      } else {
        return `${crypto.symbol}_above_${data.targetPrice}`; // Predict it won't go below
      }
    }

    return 'unknown_outcome';
  };

  const handleCreateMarket = async () => {
    if (!validateStep(2) || !address) return;

    setIsLoading(true);

    try {
      const predictedOutcome = generatePredictedOutcome();
      const eventStartTime = data.eventStartTime ? Math.floor(data.eventStartTime.getTime() / 1000) : Math.floor(Date.now() / 1000) + 3600;
      const eventEndTime = data.eventEndTime ? Math.floor(data.eventEndTime.getTime() / 1000) : eventStartTime + 7200;
      
      let league = '';
      let region = '';
      
      if (data.category === 'football' && data.selectedFixture) {
        league = data.selectedFixture.league.name;
        region = data.selectedFixture.venue?.city || 'Unknown';
      } else if (data.category === 'cryptocurrency' && data.selectedCrypto) {
        league = data.selectedCrypto.name;
        region = 'Global';
      }

      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: BITREDICT_POOL_ABI,
        functionName: 'createPool',
        args: [
          `0x${Buffer.from(predictedOutcome, 'utf8').toString('hex').padEnd(64, '0')}`,
          BigInt(data.odds),
          parseEther(data.creatorStake.toString()),
          BigInt(eventStartTime),
          BigInt(eventEndTime),
          league,
          data.category,
          region,
          false, // isPrivate
          parseEther('0'), // maxBetPerUser (0 = no limit)
          useBitr
        ],
        value: useBitr ? undefined : parseEther((data.creatorStake + 1).toString()) // +1 for creation fee
      });
    } catch (error) {
      console.error('Error creating market:', error);
      toast.error('Failed to create market');
      setIsLoading(false);
    }
  };

  // Render functions
  const renderCategorySelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Select Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleInputChange('category', 'football')}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              data.category === 'football'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-gray-600 bg-gray-800/50 hover:border-cyan-400'
            }`}
          >
            <div className="text-2xl mb-2">⚽</div>
            <h4 className="text-lg font-semibold text-white mb-2">Football Matches</h4>
            <p className="text-gray-400 text-sm">
              Create predictions on real upcoming football matches with live odds from SportMonks
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleInputChange('category', 'cryptocurrency')}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              data.category === 'cryptocurrency'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-gray-600 bg-gray-800/50 hover:border-cyan-400'
            }`}
          >
            <div className="text-2xl mb-2">₿</div>
            <h4 className="text-lg font-semibold text-white mb-2">Cryptocurrency</h4>
            <p className="text-gray-400 text-sm">
              Predict cryptocurrency price movements with time-based outcomes
            </p>
          </motion.button>
        </div>
        {errors.category && (
          <p className="text-red-400 text-sm mt-2">{errors.category}</p>
        )}
      </div>

      {/* Football Match Selection */}
      {data.category === 'football' && (
        <div>
          <FixtureSelector
            onFixtureSelect={handleFixtureSelect}
            selectedFixture={data.selectedFixture || null}
            className="mt-6"
          />
          {errors.selectedFixture && (
            <p className="text-red-400 text-sm mt-2">{errors.selectedFixture}</p>
          )}

          {/* Outcome Selection */}
          {data.selectedFixture && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-white mb-4">Select Outcome to Predict</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'home', label: `${data.selectedFixture.homeTeam.name} Wins`, color: 'green' },
                  { key: 'draw', label: 'Draw', color: 'yellow' },
                  { key: 'away', label: `${data.selectedFixture.awayTeam.name} Wins`, color: 'red' },
                  { key: 'over25', label: 'Over 2.5 Goals', color: 'orange' },
                  { key: 'under25', label: 'Under 2.5 Goals', color: 'blue' }
                ].map(outcome => (
                  <motion.button
                    key={outcome.key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleInputChange('outcome', outcome.key as any)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      data.outcome === outcome.key
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                        : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-cyan-400'
                    }`}
                  >
                    {outcome.label}
                    {data.selectedFixture.odds && (
                      <div className="text-xs mt-1 opacity-75">
                        {outcome.key === 'home' && `${data.selectedFixture.odds.home.toFixed(2)}`}
                        {outcome.key === 'draw' && `${data.selectedFixture.odds.draw.toFixed(2)}`}
                        {outcome.key === 'away' && `${data.selectedFixture.odds.away.toFixed(2)}`}
                        {outcome.key === 'over25' && `${data.selectedFixture.odds.over25.toFixed(2)}`}
                        {outcome.key === 'under25' && `${data.selectedFixture.odds.under25.toFixed(2)}`}
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
              {errors.outcome && (
                <p className="text-red-400 text-sm mt-2">{errors.outcome}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cryptocurrency Selection (existing logic, keeping as is for now) */}
      {data.category === 'cryptocurrency' && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Select Cryptocurrency</h4>
          
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search cryptocurrencies..."
              value={cryptoSearchQuery}
              onChange={(e) => setCryptoSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredCryptos.map(crypto => (
              <motion.button
                key={crypto.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => handleInputChange('selectedCrypto', crypto)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  data.selectedCrypto?.id === crypto.id
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-gray-600 bg-gray-800/50 hover:border-cyan-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{crypto.symbol}</div>
                    <div className="text-sm text-gray-400">{crypto.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white">${crypto.currentPrice.toFixed(2)}</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
          {errors.selectedCrypto && (
            <p className="text-red-400 text-sm mt-2">{errors.selectedCrypto}</p>
          )}

          {/* Crypto prediction settings */}
          {data.selectedCrypto && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price Direction</label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleInputChange('direction', 'above')}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      data.direction === 'above'
                        ? 'border-green-500 bg-green-500/10 text-green-400'
                        : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-green-400'
                    }`}
                  >
                    Above Target
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleInputChange('direction', 'below')}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      data.direction === 'below'
                        ? 'border-red-500 bg-red-500/10 text-red-400'
                        : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-red-400'
                    }`}
                  >
                    Below Target
                  </motion.button>
                </div>
                {errors.direction && (
                  <p className="text-red-400 text-sm mt-2">{errors.direction}</p>
                )}
              </div>

              <div>
                <Input
                  label="Target Price ($)"
                  type="number"
                  value={data.targetPrice?.toString() || ''}
                  onChange={(e) => handleInputChange('targetPrice', parseFloat(e.target.value) || 0)}
                  placeholder={`Current: $${data.selectedCrypto.currentPrice.toFixed(2)}`}
                  error={errors.targetPrice}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
                <select
                  value={data.timeframe || ''}
                  onChange={(e) => handleInputChange('timeframe', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select timeframe</option>
                  <option value="1hour">1 Hour</option>
                  <option value="4hours">4 Hours</option>
                  <option value="1day">1 Day</option>
                  <option value="3days">3 Days</option>
                  <option value="1week">1 Week</option>
                </select>
                {errors.timeframe && (
                  <p className="text-red-400 text-sm mt-2">{errors.timeframe}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderMarketDetails = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Market Details</h3>
        
        {/* Generated Title Preview */}
        {data.title && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
            <label className="block text-sm font-medium text-gray-300 mb-2">Generated Title</label>
            <p className="text-white font-semibold">{data.title}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Odds Multiplier"
            type="number"
            step="0.01"
            min="1.10"
            max="100.00"
            value={(data.odds / 100).toFixed(2)}
            onChange={(e) => handleInputChange('odds', Math.round(parseFloat(e.target.value) * 100))}
            placeholder="2.00"
            error={errors.odds}
            help="How much bettors win if they're correct (e.g., 2.00 = 2x their stake)"
          />

          <Input
            label={`Creator Stake (${useBitr ? 'BITR' : 'STT'})`}
            type="number"
            step="0.1"
            min="1"
            value={data.creatorStake.toString()}
            onChange={(e) => handleInputChange('creatorStake', parseFloat(e.target.value) || 0)}
            placeholder="10"
            error={errors.creatorStake}
            help="Your stake that acts as liquidity for the market"
          />
        </div>

        <div className="mt-6">
          <Textarea
            label="Market Description"
            value={data.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your market prediction and any additional context..."
            rows={4}
            error={errors.description}
            help="Explain what you're predicting and why others should participate"
          />
        </div>

        {/* Token Selection */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Payment Token</label>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setUseBitr(false)}
              className={`p-3 rounded-lg border text-center transition-all ${
                !useBitr
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-cyan-400'
              }`}
            >
              <div className="font-semibold">STT (Native)</div>
              <div className="text-xs mt-1">Standard platform token</div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setUseBitr(true)}
              className={`p-3 rounded-lg border text-center transition-all ${
                useBitr
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-cyan-400'
              }`}
            >
              <div className="font-semibold">BITR</div>
              <div className="text-xs mt-1">Reduced fees & bonuses</div>
            </motion.button>
          </div>
        </div>

        {/* Market Summary */}
        {data.selectedFixture && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
            <h4 className="font-semibold text-white mb-3">Market Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Match:</span>
                <span className="text-white">{data.selectedFixture.homeTeam.name} vs {data.selectedFixture.awayTeam.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">League:</span>
                <span className="text-white">{data.selectedFixture.league.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Match Date:</span>
                <span className="text-white">{new Date(data.selectedFixture.matchDate).toLocaleString()}</span>
              </div>
              {data.outcome && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Prediction:</span>
                  <span className="text-white">
                    {data.outcome === 'home' && `${data.selectedFixture.homeTeam.name} to win`}
                    {data.outcome === 'away' && `${data.selectedFixture.awayTeam.name} to win`}
                    {data.outcome === 'draw' && 'Match to end in draw'}
                    {data.outcome === 'over25' && 'Over 2.5 goals'}
                    {data.outcome === 'under25' && 'Under 2.5 goals'}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-300">Odds:</span>
                <span className="text-white">{(data.odds / 100).toFixed(2)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Your Stake:</span>
                <span className="text-white">{data.creatorStake} {useBitr ? 'BITR' : 'STT'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center"
      >
        <CheckCircleIcon className="h-8 w-8 text-green-400" />
      </motion.div>
      
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Market Created Successfully!</h3>
        <p className="text-gray-400">
          Your prediction market has been deployed to the blockchain.
        </p>
      </div>

      {deploymentHash && (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
          <p className="text-sm text-gray-300 mb-2">Transaction Hash:</p>
          <p className="text-xs text-cyan-400 font-mono break-all">{deploymentHash}</p>
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <Button
          onClick={() => window.location.href = '/markets'}
          variant="primary"
        >
          View All Markets
        </Button>
        <Button
          onClick={() => {
            setStep(1);
            setData({
              category: '',
              odds: 200,
              creatorStake: 10,
              description: ''
            });
            setDeploymentHash('');
          }}
          variant="outline"
        >
          Create Another
        </Button>
      </div>
    </div>
  );

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Wallet Not Connected</h2>
          <p className="text-gray-400 mb-6">Please connect your wallet to create prediction markets.</p>
        </div>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ShieldCheckIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Insufficient Reputation</h2>
          <p className="text-gray-400 mb-6">
            You need at least 40 reputation points to create guided markets. 
            Participate in existing markets to build your reputation.
          </p>
          {userReputation && (
            <div className="mb-6">
              <ReputationBadge 
                reputation={userReputation.points} 
                level={userReputation.level}
                size="large"
              />
            </div>
          )}
          <Button
            onClick={() => window.location.href = '/markets'}
            variant="primary"
          >
            Browse Markets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <AnimatedTitle>Create Prediction Market</AnimatedTitle>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
              Create guided prediction markets with real-time data sources. 
              Build your reputation and earn from accurate predictions.
            </p>
            
            {userReputation && (
              <div className="mt-6 flex justify-center">
                <ReputationBadge 
                  reputation={userReputation.points} 
                  level={userReputation.level}
                />
              </div>
            )}
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((stepNumber) => (
                <React.Fragment key={stepNumber}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step >= stepNumber 
                      ? 'bg-cyan-500 text-white' 
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {isSuccess && stepNumber === 3 ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`h-1 w-16 ${
                      step > stepNumber ? 'bg-cyan-500' : 'bg-gray-700'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-center space-x-16 mt-2">
              <span className="text-xs text-gray-400">Select Market</span>
              <span className="text-xs text-gray-400">Configure</span>
              <span className="text-xs text-gray-400">Deploy</span>
            </div>
          </div>

          {/* Main Content */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
          >
            {step === 1 && renderCategorySelection()}
            {step === 2 && renderMarketDetails()}
            {step === 3 && renderSuccess()}
          </motion.div>

          {/* Navigation */}
          {step < 3 && !isSuccess && (
            <div className="flex justify-between mt-8">
              <Button
                onClick={handlePrevStep}
                variant="outline"
                disabled={step === 1}
              >
                Previous
              </Button>
              
              {step === 2 ? (
                <Button
                  onClick={handleCreateMarket}
                  variant="primary"
                  disabled={isLoading || isPending || isConfirming}
                  loading={isLoading || isPending || isConfirming}
                >
                  {isConfirming ? 'Confirming...' : 'Create Market'}
                </Button>
              ) : (
                <Button
                  onClick={handleNextStep}
                  variant="primary"
                >
                  Next
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
