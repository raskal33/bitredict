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
import { useReputationStore } from "@/stores/useReputationStore";
import ReputationBadge from "@/components/ReputationBadge";
import { GuidedMarketService, FootballMatch, Cryptocurrency } from "@/services/guidedMarketService";

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

interface GuidedMarketData {
  // Common fields
  category: 'football' | 'cryptocurrency' | '';
  odds: number;
  creatorStake: number;
  description: string;
  
  // Football specific
  selectedMatch?: FootballMatch;
  outcome?: 'home' | 'away' | 'draw';
  
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

  // Search states
  const [footballSearchQuery, setFootballSearchQuery] = useState('');
  const [cryptoSearchQuery, setCryptoSearchQuery] = useState('');
  const [filteredMatches, setFilteredMatches] = useState<FootballMatch[]>([]);
  const [filteredCryptos, setFilteredCryptos] = useState<Cryptocurrency[]>([]);

  const userReputation = address ? getUserReputation(address) : null;
  const canCreate = address ? canCreateMarket(address) : false;

  // Initialize data
  useEffect(() => {
    setFilteredMatches(GuidedMarketService.getFootballMatches());
    setFilteredCryptos(GuidedMarketService.getCryptocurrencies());
  }, []);

  // Search functionality
  useEffect(() => {
    if (footballSearchQuery) {
      setFilteredMatches(GuidedMarketService.searchFootballMatches(footballSearchQuery));
    } else {
      setFilteredMatches(GuidedMarketService.getFootballMatches());
    }
  }, [footballSearchQuery]);

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
    const newData = { ...data, [field]: value };
    setData(newData);
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-generate title when key fields change
    if (field === 'outcome' && newData.selectedMatch && newData.outcome) {
      const title = GuidedMarketService.generateFootballMarketTitle(newData.selectedMatch, newData.outcome);
      setData(prev => ({ ...prev, title }));
    }
    
    if ((field === 'direction' || field === 'targetPrice' || field === 'timeframe') && newData.selectedCrypto && newData.targetPrice && newData.timeframe && newData.direction) {
      const title = GuidedMarketService.generateCryptoMarketTitle(
        newData.selectedCrypto, 
        newData.targetPrice,
        newData.timeframe, 
        newData.direction
      );
      setData(prev => ({ ...prev, title }));
    }
  };

  const handleMatchSelect = (match: FootballMatch) => {
    setData(prev => ({ ...prev, selectedMatch: match }));
    const matchDate = new Date(match.date);
    const startTime = new Date(matchDate.getTime() - 60 * 60 * 1000); // 1 hour before match
    const endTime = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours after match start
    setData(prev => ({ ...prev, eventStartTime: startTime, eventEndTime: endTime }));
  };

  const handleCryptoSelect = (crypto: Cryptocurrency) => {
    setData(prev => ({ ...prev, selectedCrypto: crypto }));
  };

  const handleTimeframeSelect = (timeframe: string) => {
    const timeOption = GuidedMarketService.getTimeOptions().find(opt => opt.value === timeframe);
    if (timeOption) {
      const { startTime, endTime } = GuidedMarketService.calculateEventTimes(timeOption);
      setData(prev => ({ 
        ...prev, 
        timeframe,
        eventStartTime: startTime,
        eventEndTime: endTime
      }));
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep >= 1) {
      if (!data.category) {
        newErrors.category = 'Please select a category';
      }
    }

    if (currentStep >= 2) {
      if (data.category === 'football') {
        if (!data.selectedMatch) {
          newErrors.selectedMatch = 'Please select a football match';
        }
        if (!data.outcome) {
          newErrors.outcome = 'Please select an outcome';
        }
      }

      if (data.category === 'cryptocurrency') {
        if (!data.selectedCrypto) {
          newErrors.selectedCrypto = 'Please select a cryptocurrency';
        }
        if (!data.targetPrice || data.targetPrice <= 0) {
          newErrors.targetPrice = 'Please enter a valid target price';
        }
        if (!data.timeframe) {
          newErrors.timeframe = 'Please select a timeframe';
        }
        if (!data.direction) {
          newErrors.direction = 'Please select price direction';
        }
      }
    }

    if (currentStep >= 3) {
      if (!data.odds || data.odds < 101 || data.odds > 1000) {
        newErrors.odds = 'Odds must be between 1.01x and 10x for guided markets';
      }
      if (!data.creatorStake || data.creatorStake < 10) {
        newErrors.creatorStake = 'Minimum creator stake is 10 tokens';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 4) {
        setStep(step + 1);
      } else {
        handleDeploy();
      }
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleDeploy = async () => {
    if (!validateStep(4) || !isConnected || !data.title) return;

    try {
      setIsLoading(true);
      const predictedOutcomeBytes32 = `0x${Buffer.from(data.title, 'utf8').toString('hex').padEnd(64, '0')}`;
      const eventStartTime = Math.floor((data.eventStartTime?.getTime() || 0) / 1000);
      const eventEndTime = Math.floor((data.eventEndTime?.getTime() || 0) / 1000);
      const creatorStakeWei = parseEther(data.creatorStake.toString());

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: BITREDICT_POOL_ABI,
        functionName: "createPool",
        args: [
          predictedOutcomeBytes32 as `0x${string}`,
          BigInt(data.odds),
          creatorStakeWei,
          BigInt(eventStartTime),
          BigInt(eventEndTime),
          data.category === 'football' ? data.selectedMatch?.competition || '' : 'Crypto',
          data.category,
          'Global',
          false, // Not private for guided markets
          BigInt(0), // No max bet limit
          useBitr
        ]
      });
    } catch (error) {
      console.error('Deployment error:', error);
      toast.error('Failed to create market');
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setData({
      category: '',
      odds: 200,
      creatorStake: 10,
      description: ''
    });
    setErrors({});
    setStep(1);
    setDeploymentHash('');
    setFootballSearchQuery('');
    setCryptoSearchQuery('');
  };

  // If user can't create markets
  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-yellow-500" />
          <h2 className="mt-4 text-xl font-semibold text-white">Connect Your Wallet</h2>
          <p className="mt-2 text-text-muted">Please connect your wallet to create prediction markets.</p>
        </div>
          </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center max-w-md">
          <ShieldCheckIcon className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold text-white">Insufficient Reputation</h2>
          <p className="mt-2 text-text-muted">
            You need at least 40 reputation points to create markets. 
            Participate in betting and community activities to build your reputation.
          </p>
          {userReputation && (
            <div className="mt-4">
              <ReputationBadge reputation={userReputation} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Success screen
  if (deploymentHash) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center max-w-lg">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-2xl font-semibold text-white">Market Created Successfully!</h2>
          <p className="mt-2 text-text-muted">Your guided prediction market has been deployed to the blockchain.</p>
          
          <div className="mt-6 rounded-lg bg-bg-card p-4">
            <div className="text-sm text-text-muted">Transaction Hash:</div>
            <div className="break-all text-xs text-primary">{deploymentHash}</div>
          </div>
          
          <div className="mt-6 flex justify-center gap-4">
            <Button onClick={resetForm} variant="outline">
              Create Another Market
            </Button>
            <Button onClick={() => window.location.href = '/dashboard'}>
              View Dashboard
            </Button>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <AnimatedTitle 
          size="lg" 
          leftIcon={CurrencyDollarIcon}
          rightIcon={UserGroupIcon}
          className="mb-4"
        >
          Create Guided Market
        </AnimatedTitle>
        <p className="text-text-muted text-center max-w-2xl mx-auto">
          Create secure, oracle-backed prediction markets for football matches and cryptocurrency prices.
        </p>
        
        {userReputation && (
          <div className="mt-6 flex items-center justify-between">
            <ReputationBadge reputation={userReputation} showDetails />
            <div className="text-sm text-text-muted">
              Guided Markets Only (40-99 Rep)
            </div>
        </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-between">
        {[1, 2, 3, 4].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium ${
              step >= stepNum 
                ? 'border-primary bg-primary text-white' 
                : 'border-gray-500 text-gray-500'
            }`}>
              {stepNum}
    </div>
            {stepNum < 4 && (
              <div className={`h-0.5 w-16 ${step > stepNum ? 'bg-primary' : 'bg-gray-500'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="glass-card p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="mb-6 text-xl font-semibold text-white">Select Category</h2>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div
                  className={`cursor-pointer rounded-lg border-2 p-6 transition-all ${
                    data.category === 'football'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => handleInputChange('category', 'football')}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">⚽</div>
                    <h3 className="text-lg font-semibold text-white">Football</h3>
                    <p className="mt-2 text-sm text-text-muted">
                      Predict outcomes of football matches from major leagues. 
                      Results verified by Sportmonks API.
                    </p>
        </div>
      </div>
      
                <div
                  className={`cursor-pointer rounded-lg border-2 p-6 transition-all ${
                    data.category === 'cryptocurrency'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => handleInputChange('category', 'cryptocurrency')}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">₿</div>
                    <h3 className="text-lg font-semibold text-white">Cryptocurrency</h3>
                    <p className="mt-2 text-sm text-text-muted">
                      Predict cryptocurrency price movements. 
                      Results verified by CoinGecko API.
        </p>
      </div>
    </div>
              </div>

              {errors.category && (
                <p className="mt-2 text-sm text-red-400">{errors.category}</p>
              )}

              <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    <strong>Guided Markets:</strong> As an Elementary user (40-99 reputation), you can only create 
                    oracle-backed markets. These are safer and help you build reputation through accurate predictions.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && data.category === 'football' && (
            <motion.div
              key="step2-football"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="mb-6 text-xl font-semibold text-white">Select Football Match</h2>
              
              {/* Search */}
              <div className="relative mb-6">
                <AnimatePresence>
                  {!footballSearchQuery && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <Input
                  type="text"
                  placeholder="Search teams, competitions, or venues..."
                  value={footballSearchQuery}
                  onChange={(e) => setFootballSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Matches */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredMatches.map((match) => (
                  <div
                    key={match.id}
                    className={`cursor-pointer rounded-lg border p-4 transition-all ${
                      data.selectedMatch?.id === match.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => handleMatchSelect(match)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {match.homeTeam} vs {match.awayTeam}
                        </div>
                        <div className="text-sm text-text-muted">
                          {match.competition} • {new Date(match.date).toLocaleDateString()} {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-text-muted">{match.venue}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {errors.selectedMatch && (
                <p className="mt-2 text-sm text-red-400">{errors.selectedMatch}</p>
              )}

              {/* Outcome Selection */}
              {data.selectedMatch && (
                <div className="mt-6">
                  <h3 className="mb-4 text-lg font-medium text-white">Select Outcome</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'home', label: `${data.selectedMatch.homeTeam} Win` },
                      { value: 'draw', label: 'Draw' },
                      { value: 'away', label: `${data.selectedMatch.awayTeam} Win` }
                    ].map((outcome) => (
                      <div
                        key={outcome.value}
                        className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                          data.outcome === outcome.value
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => handleInputChange('outcome', outcome.value as 'home' | 'draw' | 'away')}
                      >
                        <div className="font-medium text-white">{outcome.label}</div>
                      </div>
                    ))}
                  </div>

                  {errors.outcome && (
                    <p className="mt-2 text-sm text-red-400">{errors.outcome}</p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && data.category === 'cryptocurrency' && (
            <motion.div
              key="step2-crypto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="mb-6 text-xl font-semibold text-white">Configure Cryptocurrency Prediction</h2>
              
              {/* Crypto Search */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-white">Select Cryptocurrency</label>
                <div className="relative">
                  <AnimatePresence>
                    {!cryptoSearchQuery && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Input
                    type="text"
                    placeholder="Search cryptocurrencies..."
                    value={cryptoSearchQuery}
                    onChange={(e) => setCryptoSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                  {filteredCryptos.map((crypto) => (
                    <div
                      key={crypto.id}
                      className={`cursor-pointer rounded-lg border p-3 transition-all ${
                        data.selectedCrypto?.id === crypto.id
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => handleCryptoSelect(crypto)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{crypto.logo}</span>
                          <div>
                            <div className="font-medium text-white">{crypto.name}</div>
                            <div className="text-sm text-text-muted">{crypto.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-white">${crypto.currentPrice.toLocaleString()}</div>
                          <div className="text-xs text-text-muted">Current Price</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {errors.selectedCrypto && (
                  <p className="mt-2 text-sm text-red-400">{errors.selectedCrypto}</p>
                )}
              </div>

              {data.selectedCrypto && (
                <>
                  {/* Target Price */}
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-white">Target Price (USD)</label>
            <Input
              type="number"
                      min="0"
                      step="0.0001"
                      placeholder="Enter target price"
                      value={data.targetPrice || ''}
                      onChange={(e) => handleInputChange('targetPrice', parseFloat(e.target.value))}
                    />
                    {data.selectedCrypto && (
                      <p className="mt-1 text-xs text-text-muted">
                        Current price: ${data.selectedCrypto.currentPrice.toLocaleString()}
                      </p>
                    )}
                    {errors.targetPrice && (
                      <p className="mt-1 text-sm text-red-400">{errors.targetPrice}</p>
                    )}
                  </div>

                  {/* Timeframe */}
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-white">Timeframe</label>
                    <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
                      {GuidedMarketService.getTimeOptions().map((option) => (
                        <div
                          key={option.value}
                          className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all ${
                            data.timeframe === option.value
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                          onClick={() => handleTimeframeSelect(option.value)}
                        >
                          <div className="text-sm font-medium text-white">{option.value}</div>
                          <div className="text-xs text-text-muted">{option.label}</div>
                        </div>
                      ))}
                    </div>
                    {errors.timeframe && (
                      <p className="mt-2 text-sm text-red-400">{errors.timeframe}</p>
                    )}
                  </div>

                  {/* Direction */}
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-white">Price Direction</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                          data.direction === 'above'
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => handleInputChange('direction', 'above')}
                      >
                        <div className="text-2xl mb-2">📈</div>
                        <div className="font-medium text-white">Above Target</div>
                        <div className="text-sm text-text-muted">Price will be higher</div>
                      </div>
                      <div
                        className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                          data.direction === 'below'
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => handleInputChange('direction', 'below')}
                      >
                        <div className="text-2xl mb-2">📉</div>
                        <div className="font-medium text-white">Below Target</div>
                        <div className="text-sm text-text-muted">Price will be lower</div>
                      </div>
                    </div>
                    {errors.direction && (
                      <p className="mt-2 text-sm text-red-400">{errors.direction}</p>
                    )}
                  </div>
                </>
              )}
          </motion.div>
        )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="mb-6 text-xl font-semibold text-white">Market Configuration</h2>
              
              {/* Generated Title */}
              {data.title && (
                <div className="mb-6 rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                  <div className="text-sm text-blue-300 mb-2">Generated Market Title:</div>
                  <div className="font-medium text-white">{data.title}</div>
                </div>
              )}

              {/* Odds */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-white">
                  Odds (Your Multiplier)
                </label>
        <Input
                  type="number"
                  min="101"
                  max="1000"
                  step="1"
                  value={data.odds}
                  onChange={(e) => handleInputChange('odds', parseFloat(e.target.value))}
                />
                <div className="mt-1 flex justify-between text-xs text-text-muted">
                  <span>Min: 1.01x</span>
                  <span>Current: {(data.odds / 100).toFixed(2)}x</span>
                  <span>Max: 10x</span>
                </div>
                {errors.odds && (
                  <p className="mt-1 text-sm text-red-400">{errors.odds}</p>
                )}
              </div>

              {/* Creator Stake */}
              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-white">
                    Your Stake ({useBitr ? 'BITR' : 'STT'})
                  </label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setUseBitr(false)}
                      className={`px-2 py-1 text-xs rounded-md ${!useBitr ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'}`}
                    >
                      STT
                    </button>
                    <button 
                      onClick={() => setUseBitr(true)}
                      className={`px-2 py-1 text-xs rounded-md ${useBitr ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'}`}
                    >
                      BITR
                    </button>
                  </div>
                </div>
                <Input
                  type="number"
                  min="10"
                  max="10000"
                  step="1"
                  value={data.creatorStake}
                  onChange={(e) => handleInputChange('creatorStake', parseFloat(e.target.value))}
                />
                <div className="mt-1 text-xs text-text-muted">
                  Minimum: 10 {useBitr ? 'BITR' : 'STT'} for guided markets
                </div>
                {errors.creatorStake && (
                  <p className="mt-1 text-sm text-red-400">{errors.creatorStake}</p>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-white">
                  Description (Optional)
                </label>
                <Textarea
                  rows={3}
                  placeholder="Add your analysis, reasoning, or additional information..."
                  value={data.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
        />
      </div>

              {/* Market Info */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-bg-card p-4">
                  <div className="text-sm text-text-muted mb-2">Betting Closes</div>
                  <div className="font-medium text-white">
                    {data.eventStartTime ? data.eventStartTime.toLocaleString() : 'Not set'}
                  </div>
                </div>
                <div className="rounded-lg bg-bg-card p-4">
                  <div className="text-sm text-text-muted mb-2">Market Resolves</div>
                  <div className="font-medium text-white">
                    {data.eventEndTime ? data.eventEndTime.toLocaleString() : 'Not set'}
    </div>
        </div>
      </div>

              {/* Win/Loss Info */}
              <div className="mt-6 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="text-sm text-yellow-300">
                    <div className="font-medium mb-2">How you win/lose:</div>
                    <div className="space-y-1">
                      <div><strong>If you&apos;re RIGHT:</strong> You win up to {((data.creatorStake * 100) / (data.odds - 100)).toFixed(1)} {useBitr ? 'BITR' : 'STT'} from bettors</div>
                      <div><strong>If you&apos;re WRONG:</strong> You lose your {data.creatorStake} {useBitr ? 'BITR' : 'STT'} stake to bettors</div>
                      <div><strong>Oracle Resolution:</strong> Results verified automatically by external APIs</div>
          </div>
        </div>
      </div>
    </div>
            </motion.div>
          )}

          {step === 4 && (
      <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="mb-6 text-xl font-semibold text-white">Review & Deploy</h2>
              
              <div className="space-y-6">
                {/* Market Summary */}
                <div className="rounded-lg bg-bg-card p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Market Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Category:</span>
                      <span className="text-white capitalize">{data.category}</span>
        </div>
            <div className="flex justify-between">
                      <span className="text-text-muted">Title:</span>
                      <span className="text-white text-right flex-1 ml-4">{data.title}</span>
            </div>
            <div className="flex justify-between">
                      <span className="text-text-muted">Your Odds:</span>
                      <span className="text-white">{(data.odds / 100).toFixed(2)}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Your Stake:</span>
                      <span className="text-white">{data.creatorStake} {useBitr ? 'BITR' : 'STT'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Max Payout:</span>
                      <span className="text-white">{((data.creatorStake * 100) / (data.odds - 100)).toFixed(1)} {useBitr ? 'BITR' : 'STT'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Betting Closes:</span>
                      <span className="text-white">{data.eventStartTime?.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Resolves:</span>
                      <span className="text-white">{data.eventEndTime?.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Fees */}
                <div className="rounded-lg bg-bg-card p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Transaction Fees</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Platform Fee:</span>
                      <span className="text-white">1 {useBitr ? 'BITR' : 'STT'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Gas Fee:</span>
                      <span className="text-white">~0.001 ETH</span>
            </div>
          </div>
        </div>

                {/* Reputation Bonus */}
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5" />
                    <div className="text-sm text-green-300">
                      <strong>Reputation Bonus:</strong> You&apos;ll earn +8 reputation points for creating this guided market, 
                      helping you unlock more features as you build your track record.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 1}
          >
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isPending || isConfirming || isLoading}
            loading={isPending || isConfirming || isLoading}
          >
            {step === 4 ? 'Deploy Market' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
