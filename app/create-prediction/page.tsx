"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, parseUnits } from "viem";
import { GAS_SETTINGS } from "@/config/wagmi";
import { toast } from "react-hot-toast";
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  HandRaisedIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import Button from "@/components/button";
import AmountInput from "@/components/AmountInput";
import Textarea from "@/components/textarea";
import AnimatedTitle from "@/components/AnimatedTitle";
import FixtureSelector from "@/components/FixtureSelector";
import { useReputationStore } from "@/stores/useReputationStore";
import ReputationBadge from "@/components/ReputationBadge";
import { GuidedMarketService, Cryptocurrency } from "@/services/guidedMarketService";
import { CONTRACTS } from "@/contracts";
import { useBITRToken } from "@/hooks/useBITRToken";

// Contract ABI for createPool function
const BITREDICT_POOL_ABI = [
  {
    name: "createPool",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "_predictedOutcome", type: "bytes32" },
      { name: "_odds", type: "uint256" },
      { name: "_creatorStake", type: "uint250" },
      { name: "_eventStartTime", type: "uint256" },
      { name: "_eventEndTime", type: "uint256" },
      { name: "_league", type: "string" },
      { name: "_category", type: "string" },
      { name: "_region", type: "string" },
      { name: "_isPrivate", type: "bool" },
      { name: "_maxBetPerUser", type: "uint256" },
      { name: "_useBitr", type: "bool" },
      { name: "_oracleType", type: "uint8" },
      { name: "_marketId", type: "bytes32" }
    ],
    outputs: []
  }
] as const;

const CONTRACT_ADDRESS = CONTRACTS.BITREDICT_POOL.address;

// SportMonks Fixture interface
interface Fixture {
  id: number;
  name: string;
  homeTeam: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  league: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  round?: string;
  matchDate: string;
  venue?: {
    name: string;
    city: string;
  };
  status: string;
  odds?: {
    home: number | null;
    draw: number | null;
    away: number | null;
    over25: number | null;
    under25: number | null;
    over35: number | null;
    under35: number | null;
    bttsYes: number | null;
    bttsNo: number | null;
    htHome: number | null;
    htDraw: number | null;
    htAway: number | null;
    updatedAt: string;
  };
}

interface GuidedMarketData {
  // Common fields
  category: 'football' | 'cryptocurrency' | '';
  odds: number;
  creatorStake: number;
  description: string;
  predictionOutcome?: 'yes' | 'no'; // YES-NO selection
  
  // Football specific (updated for SportMonks)
  selectedFixture?: Fixture;
  outcome?: 'home' | 'away' | 'draw' | 'over25' | 'under25' | 'over35' | 'under35' | 'bttsYes' | 'bttsNo' | 'htHome' | 'htDraw' | 'htAway';
  fixtures?: { fixtures: Fixture[] };
  
  // Cryptocurrency specific
  selectedCrypto?: Cryptocurrency;
  targetPrice?: number;
  timeframe?: string;
  direction?: 'above' | 'below';
  
  // Boost and privacy options
  boostTier?: 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD';
  isPrivate?: boolean;
  maxBetPerUser?: number;
  
  // Generated fields
  title?: string;
  eventStartTime?: Date;
  eventEndTime?: Date;
  
  // User-selected event timing
  userEventStartTime?: Date;
}

export default function CreateMarketPage() {
  const { address, isConnected } = useAccount();
  const { getUserReputation, canCreateMarket, addReputationAction } = useReputationStore();
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  // BITR Token approval state
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);

  const [data, setData] = useState<GuidedMarketData>({
    category: '',
    odds: 200, // 2.0x default
    creatorStake: 20, // Minimum for guided markets (20 tokens)
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
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(false);
  const [filteringInfo, setFilteringInfo] = useState<string>('');

  const userReputation = address ? getUserReputation(address) : null;
  const canCreate = address ? canCreateMarket(address) : false;

  const token = useBITRToken();

  // Notify backend about pool creation for immediate indexing
  const notifyPoolCreation = useCallback(async (transactionHash: string) => {
    try {
      const response = await fetch('/api/pools/notify-creation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionHash,
          creator: address,
          category: data.category,
          useBitr,
          creatorStake: data.creatorStake,
          odds: data.odds
        }),
      });

      if (response.ok) {
        console.log('Pool creation notification sent successfully');
      }
    } catch (error) {
      console.error('Failed to notify pool creation:', error);
    }
  }, [address, data.category, useBitr, data.creatorStake, data.odds]);

  // Initialize data
  useEffect(() => {
    const loadCryptos = async () => {
      const cryptos = await GuidedMarketService.getCryptocurrencies();
      setFilteredCryptos(cryptos);
    };
    loadCryptos();
  }, []);

  // Load fixtures when football category is selected
  useEffect(() => {
    const loadFixtures = async () => {
      if (data.category === 'football' && fixtures.length === 0) {
        setIsLoadingFixtures(true);
        try {
          // Use the proper API service instead of direct fetch
          const fixturesData = await GuidedMarketService.getFootballMatches(7, 500);
          // Filter and transform fixtures to exclude matches starting within 30 minutes
          const currentTime = new Date();
          const thirtyMinutesFromNow = new Date(currentTime.getTime() + 30 * 60 * 1000); // 30 minutes from now
          
          const filteredFixtures = fixturesData.filter((fixture) => {
            // Parse match date and check if it's at least 30 minutes in the future
            const matchDate = new Date(fixture.matchDate || new Date().toISOString());
            return matchDate > thirtyMinutesFromNow;
          });
          
          console.log(`Filtered fixtures: ${filteredFixtures.length} out of ${fixturesData.length} (excluded matches starting within 30 minutes)`);
          
          // Set filtering info for display
          setFilteringInfo(`Showing ${filteredFixtures.length} matches (excluded ${fixturesData.length - filteredFixtures.length} matches starting within 30 minutes)`);
          
          const transformedFixtures = filteredFixtures.map((fixture) => {
            return {
              id: typeof fixture.id === 'string' ? parseInt(fixture.id, 10) || Math.floor(Math.random() * 1000000) : (fixture.id || Math.floor(Math.random() * 1000000)),
              name: `${fixture.homeTeam?.name || 'Unknown'} vs ${fixture.awayTeam?.name || 'Unknown'}`,
              homeTeam: {
                id: fixture.homeTeam?.id ? Number(fixture.homeTeam.id) : 0,
                name: fixture.homeTeam?.name || 'Unknown',
                logoUrl: fixture.homeTeam?.logoUrl
              },
              awayTeam: {
                id: fixture.awayTeam?.id ? Number(fixture.awayTeam.id) : 0,
                name: fixture.awayTeam?.name || 'Unknown',
                logoUrl: fixture.awayTeam?.logoUrl
              },
              league: {
                id: fixture.league?.id ? Number(fixture.league.id) : 0,
                name: fixture.league?.name || 'Unknown League',
                logoUrl: fixture.league?.logoUrl
              },
              matchDate: fixture.matchDate || new Date().toISOString(),
              status: fixture.status || 'scheduled',
              odds: fixture.odds ? {
                home: typeof fixture.odds.home === 'number' ? fixture.odds.home : null,
                draw: typeof fixture.odds.draw === 'number' ? fixture.odds.draw : null,
                away: typeof fixture.odds.away === 'number' ? fixture.odds.away : null,
                over25: typeof fixture.odds.over25 === 'number' ? fixture.odds.over25 : null,
                under25: typeof fixture.odds.under25 === 'number' ? fixture.odds.under25 : null,
                over35: typeof fixture.odds.over35 === 'number' ? fixture.odds.over35 : null,
                under35: typeof fixture.odds.under35 === 'number' ? fixture.odds.under35 : null,
                bttsYes: typeof fixture.odds.bttsYes === 'number' ? fixture.odds.bttsYes : null,
                bttsNo: typeof fixture.odds.bttsNo === 'number' ? fixture.odds.bttsNo : null,
                htHome: typeof fixture.odds.htHome === 'number' ? fixture.odds.htHome : null,
                htDraw: typeof fixture.odds.htDraw === 'number' ? fixture.odds.htDraw : null,
                htAway: typeof fixture.odds.htAway === 'number' ? fixture.odds.htAway : null,
                updatedAt: fixture.odds.updatedAt || new Date().toISOString()
              } : null
            };
          }) as unknown as Fixture[];
          
          setFixtures(transformedFixtures);
          setData(prev => ({ ...prev, fixtures: { fixtures: transformedFixtures } }));
        } catch (error) {
          console.error('Error loading fixtures:', error);
          toast.error('Failed to load fixtures');
        } finally {
          setIsLoadingFixtures(false);
        }
      }
    };
    loadFixtures();
  }, [data.category, fixtures.length]);

  // Search functionality for crypto
  useEffect(() => {
    const searchCryptos = async () => {
    if (cryptoSearchQuery) {
        const results = await GuidedMarketService.searchCryptocurrencies(cryptoSearchQuery);
        setFilteredCryptos(results);
    } else {
        const cryptos = await GuidedMarketService.getCryptocurrencies();
        setFilteredCryptos(cryptos);
    }
    };
    searchCryptos();
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

      // Notify backend about the new pool creation for indexing
      notifyPoolCreation(hash);
    }
  }, [isSuccess, hash, address, addReputationAction, notifyPoolCreation]);

  // Track approval transaction confirmation
  const { isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({ 
    hash: token.hash 
  });

  // Track approval confirmation
  useEffect(() => {
    if (isApprovalSuccess && !approvalConfirmed) {
      setApprovalConfirmed(true);
      toast.success('BITR token approval confirmed! You can now create the pool.');
    }
  }, [isApprovalSuccess, approvalConfirmed]);

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
    if (fixture.odds && typeof fixture.odds.draw === 'number') {
      // Use the most balanced odd as default (often the draw)
      const defaultOdds = Math.floor(fixture.odds.draw * 100) || 200;
      handleInputChange('odds', defaultOdds);
    } else {
      // Set default odds if no valid odds data
      handleInputChange('odds', 200);
    }

    // Auto-scroll to the next step after a short delay
    setTimeout(() => {
      const nextStepElement = document.getElementById('next-step-button');
      if (nextStepElement) {
        nextStepElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 300);
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
        if (!data.userEventStartTime) {
          newErrors.userEventStartTime = 'Please select an event start time';
        } else {
          const now = new Date();
          const minTime = new Date(now.getTime() + 60000); // 1 minute from now
          if (data.userEventStartTime < minTime) {
            newErrors.userEventStartTime = 'Event start time must be at least 1 minute from now';
          }
        }
      }
    }

    if (stepNumber === 2) {
      if (!data.odds || data.odds < 110 || data.odds > 10000) {
        newErrors.odds = 'Odds must be between 1.10x and 100.0x';
      }
      
      // Contract minimum stake requirements
      const minStake = useBitr ? 20 : 20; // Both STT and BITR have same minimum (20 tokens)
      if (!data.creatorStake || data.creatorStake < minStake) {
        newErrors.creatorStake = `Creator stake must be at least ${minStake} ${useBitr ? 'BITR' : 'STT'}`;
      }

      if (!data.predictionOutcome) {
        newErrors.predictionOutcome = 'Please select your prediction';
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

  // Calculate event times based on category and settings
  const calculateEventTimes = () => {
    const now = new Date();
    const bettingGracePeriod = 60; // 1 minute in seconds (from contract)
    
    if (data.category === 'football' && data.selectedFixture) {
      // For football, use match date with 1-minute grace period
      const matchDate = new Date(data.selectedFixture.matchDate);
      const eventStartTime = Math.floor(matchDate.getTime() / 1000);
      const eventEndTime = eventStartTime + (2 * 60 * 60); // 2 hours after match starts
      const bettingEndTime = eventStartTime - bettingGracePeriod;
      
      // Validate that event is in the future
      const currentTime = Math.floor(now.getTime() / 1000);
      if (eventStartTime <= currentTime) {
        console.warn('Match date is in the past, using future date');
        // Use a future date if match is in the past
        const futureEventStartTime = currentTime + (24 * 60 * 60); // 24 hours from now
        const futureEventEndTime = futureEventStartTime + (2 * 60 * 60);
        const futureBettingEndTime = futureEventStartTime - bettingGracePeriod;
        return { eventStartTime: futureEventStartTime, eventEndTime: futureEventEndTime, bettingEndTime: futureBettingEndTime };
      }
      
      return { eventStartTime, eventEndTime, bettingEndTime };
    }
    
    if (data.category === 'cryptocurrency' && data.userEventStartTime) {
      // For crypto, use user-selected event start time
      const eventStartTime = Math.floor(data.userEventStartTime.getTime() / 1000);
      const eventEndTime = eventStartTime + (60 * 60); // 1 hour after start
      const bettingEndTime = eventStartTime - bettingGracePeriod;
      
      return { eventStartTime, eventEndTime, bettingEndTime };
    }
    
    // Default fallback
    const eventStartTime = Math.floor(now.getTime() / 1000) + (24 * 60 * 60); // 24 hours from now
    const eventEndTime = eventStartTime + (2 * 60 * 60);
    const bettingEndTime = eventStartTime - bettingGracePeriod;
    
    return { eventStartTime, eventEndTime, bettingEndTime };
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
        case 'over35':
          return `over_35_goals`; // Predict over 3.5 goals (over won't happen)
        case 'under35':
          return `under_35_goals`; // Predict under 3.5 goals (under won't happen)
        case 'bttsYes':
          return `both_teams_to_score_yes`; // Predict both teams to score - Yes
        case 'bttsNo':
          return `both_teams_to_score_no`; // Predict both teams to score - No
        case 'htHome':
          return `${fixture.homeTeam.name}_home_team_wins`; // Predict home team wins
        case 'htDraw':
          return `draw_home_team_wins`; // Predict draw and home team wins
        case 'htAway':
          return `${fixture.awayTeam.name}_away_team_wins`; // Predict away team wins
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

  // BITR Token approval function
  const approveBitrTokens = async (amount: string) => {
    if (!address) return false;
    
    try {
      // Use the BITR token hook for approval
      await token.approve(CONTRACTS.BITREDICT_POOL.address, amount);
      toast.success('BITR token approval submitted. Please wait for confirmation.');
      return true;
    } catch (error) {
      console.error('BITR approval error:', error);
      toast.error('BITR token approval failed: ' + (error as Error).message);
      return false;
    }
  };

  const handleCreateMarket = async () => {
    console.log('Create Market button clicked');
    console.log('Address:', address);
    console.log('Is connected:', isConnected);
    console.log('Step validation:', validateStep(2));
    console.log('Data:', data);
    
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!isConnected) {
      toast.error('Wallet not connected');
      return;
    }
    
    if (!validateStep(2)) {
      toast.error('Please fix the validation errors');
      return;
    }

    // Check if prediction outcome is selected
    if (!data.predictionOutcome) {
      toast.error('Please select your prediction (YES or NO)');
      return;
    }

    setIsLoading(true);

    try {
      const predictedOutcome = generatePredictedOutcome();
      const { eventStartTime, eventEndTime } = calculateEventTimes();
      
      let league = '';
      let region = '';
      
      if (data.category === 'football' && data.selectedFixture) {
        league = data.selectedFixture.league.name;
        region = data.selectedFixture.venue?.city || 'Unknown';
      } else if (data.category === 'cryptocurrency' && data.selectedCrypto) {
        league = data.selectedCrypto.name;
        region = 'Global';
      }

      console.log('Contract config:', {
        predictedOutcome,
        odds: data.odds,
        creatorStake: data.creatorStake,
        eventStartTime,
        eventEndTime,
        league,
        category: data.category,
        region,
        useBitr,
        currentTime: Math.floor(Date.now() / 1000),
        timeUntilEvent: eventStartTime - Math.floor(Date.now() / 1000),
        selectedFixture: data.selectedFixture ? {
          id: data.selectedFixture.id,
          name: data.selectedFixture.name,
          homeTeam: data.selectedFixture.homeTeam?.name,
          awayTeam: data.selectedFixture.awayTeam?.name,
          league: data.selectedFixture.league?.name,
          matchDate: data.selectedFixture.matchDate
        } : 'NO FIXTURE SELECTED'
      });

      const baseConfig = {
        address: CONTRACT_ADDRESS,
        abi: BITREDICT_POOL_ABI,
        functionName: 'createPool' as const,
        args: [
          `0x${Buffer.from(predictedOutcome, 'utf8').toString('hex').padEnd(64, '0')}` as `0x${string}`,
          BigInt(data.odds),
          parseEther(data.creatorStake.toString()),
          BigInt(eventStartTime),
          BigInt(eventEndTime),
          league,
          data.category,
          region,
          false as boolean, // isPrivate
          parseEther('0'), // maxBetPerUser (0 = no limit)
          useBitr as boolean,
          0 as number, // oracleType (0 = GUIDED)
          `0x${Buffer.from(data.selectedFixture?.id?.toString() || '0', 'utf8').toString('hex').padEnd(64, '0')}` as `0x${string}` // marketId
        ] as const
      };

      const contractConfig = useBitr 
        ? { 
            ...baseConfig,
            ...GAS_SETTINGS
          }
        : { 
            ...baseConfig, 
            value: parseEther((data.creatorStake + 1).toString()), // +1 for creation fee
            ...GAS_SETTINGS
          };

      // For BITR pools, check and handle token approval
      if (useBitr) {
        const requiredAmount = (data.creatorStake + 1).toString(); // +1 for creation fee
        const currentAllowance = token.getAllowance(CONTRACTS.BITREDICT_POOL.address);
        const requiredAmountWei = parseUnits(requiredAmount, 18);
        
        console.log('BITR approval check:', {
          requiredAmount,
          currentAllowance: currentAllowance?.toString(),
          requiredAmountWei: requiredAmountWei.toString(),
          hasEnoughAllowance: currentAllowance && currentAllowance >= requiredAmountWei
        });
        
        if (!currentAllowance || currentAllowance < requiredAmountWei) {
          if (!approvalConfirmed) {
            const approvalSuccess = await approveBitrTokens(requiredAmount);
            if (!approvalSuccess) {
              setIsLoading(false);
              return;
            }
            // Wait for approval confirmation before proceeding
            toast.success('Waiting for BITR approval confirmation...');
            setIsLoading(false);
            return;
          }
        }
        toast.success('BITR approval confirmed. Proceeding with market creation...');
      }

      // Final validation before contract call
      if (data.category === 'football' && !data.selectedFixture) {
        toast.error('No fixture selected. Please select a football match.');
        setIsLoading(false);
        return;
      }

      if (data.category === 'football' && !data.outcome) {
        toast.error('No outcome selected. Please select an outcome to predict.');
        setIsLoading(false);
        return;
      }

      console.log('Writing contract with config:', contractConfig);
      console.log('Contract call details:', {
        address: contractConfig.address,
        functionName: contractConfig.functionName,
        args: contractConfig.args,
        value: (contractConfig as { value?: bigint }).value?.toString(),
        gas: contractConfig.gas?.toString(),
        gasPrice: contractConfig.gasPrice?.toString()
      });
      await writeContract(contractConfig);
    } catch (error) {
      console.error('Error creating market:', error);
      toast.error('Failed to create market: ' + (error as Error).message);
      setIsLoading(false);
    }
  };

  // Render functions
  const renderCategorySelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Select Category</h3>
        <div className="grid grid-cols-1 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleInputChange('category', 'football')}
            className={`p-4 sm:p-6 rounded-xl border-2 text-left transition-all ${
              data.category === 'football'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-gray-600 bg-gray-800/50 hover:border-cyan-400'
            }`}
          >
            <div className="text-xl sm:text-2xl mb-2">⚽</div>
            <h4 className="text-base sm:text-lg font-semibold text-white mb-2">Football Matches</h4>
            <p className="text-gray-400 text-xs sm:text-sm">
              Create predictions on real upcoming football matches with live odds from SportMonks
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleInputChange('category', 'cryptocurrency')}
            className={`p-4 sm:p-6 rounded-xl border-2 text-left transition-all ${
              data.category === 'cryptocurrency'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-gray-600 bg-gray-800/50 hover:border-cyan-400'
            }`}
          >
            <div className="text-xl sm:text-2xl mb-2">₿</div>
            <h4 className="text-base sm:text-lg font-semibold text-white mb-2">Cryptocurrency</h4>
            <p className="text-gray-400 text-xs sm:text-sm">
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
          {isLoadingFixtures ? (
            <div className="mt-6 text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
              <p className="text-gray-400">Loading fixtures...</p>
            </div>
          ) : fixtures.length === 0 ? (
            <div className="mt-6 text-center py-8">
              <div className="text-yellow-400 mb-2">⚠️</div>
              <p className="text-gray-400 mb-2">No upcoming matches available</p>
              <p className="text-xs text-gray-500">
                Only matches starting more than 30 minutes from now are shown to ensure fair market creation.
              </p>
            </div>
          ) : (
            <>
              {filteringInfo && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-400">{filteringInfo}</p>
                </div>
              )}
              <FixtureSelector
                fixtures={fixtures as Fixture[]}
                onSelect={handleFixtureSelect}
                selectedFixture={data.selectedFixture as Fixture}
              />
            </>
          )}
          {errors.selectedFixture && (
            <p className="text-red-400 text-sm mt-2">{errors.selectedFixture}</p>
          )}

          {/* Outcome Selection */}
          {data.selectedFixture && (
            <div className="mt-6 sticky top-4 z-10 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-600 p-4">
              <h4 className="text-lg font-semibold text-white mb-4">Select Outcome to Predict</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {[
                  { key: 'home', label: `${data.selectedFixture.homeTeam.name} Wins`, color: 'green' },
                  { key: 'draw', label: 'Draw', color: 'yellow' },
                  { key: 'away', label: `${data.selectedFixture.awayTeam.name} Wins`, color: 'red' },
                  { key: 'over25', label: 'Over 2.5 Goals', color: 'orange' },
                  { key: 'under25', label: 'Under 2.5 Goals', color: 'blue' },
                  { key: 'over35', label: 'Over 3.5 Goals', color: 'purple' },
                  { key: 'under35', label: 'Under 3.5 Goals', color: 'pink' },
                  { key: 'bttsYes', label: 'Both Teams to Score - Yes', color: 'green' },
                  { key: 'bttsNo', label: 'Both Teams to Score - No', color: 'red' },
                  { key: 'htHome', label: 'Home Team Wins', color: 'blue' },
                  { key: 'htDraw', label: 'Draw and Home Team Wins', color: 'yellow' },
                  { key: 'htAway', label: 'Away Team Wins', color: 'orange' }
                ].filter(outcome => {
                  if (!data.selectedFixture?.odds) return false;
                  const oddsKey = `${outcome.key}_odds` as keyof typeof data.selectedFixture.odds;
                  return data.selectedFixture.odds[oddsKey] !== null && data.selectedFixture.odds[oddsKey] !== undefined;
                }).map((outcome) => (
                  <motion.button
                    key={outcome.key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleInputChange('outcome', outcome.key as 'home' | 'away' | 'draw' | 'over25' | 'under25' | 'over35' | 'under35' | 'bttsYes' | 'bttsNo' | 'htHome' | 'htDraw' | 'htAway')}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      data.outcome === outcome.key
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                        : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-cyan-400'
                    }`}
                  >
                    {outcome.label}
                    {data.selectedFixture?.odds && (
                      <div className="text-xs mt-1 opacity-75">
                        {outcome.key === 'home' && data.selectedFixture.odds.home !== null && `${data.selectedFixture.odds.home.toFixed(2)}`}
                        {outcome.key === 'draw' && data.selectedFixture.odds.draw !== null && `${data.selectedFixture.odds.draw.toFixed(2)}`}
                        {outcome.key === 'away' && data.selectedFixture.odds.away !== null && `${data.selectedFixture.odds.away.toFixed(2)}`}
                        {outcome.key === 'over25' && data.selectedFixture.odds.over25 !== null && `${data.selectedFixture.odds.over25.toFixed(2)}`}
                        {outcome.key === 'under25' && data.selectedFixture.odds.under25 !== null && `${data.selectedFixture.odds.under25.toFixed(2)}`}
                        {outcome.key === 'over35' && data.selectedFixture.odds.over35 !== null && `${data.selectedFixture.odds.over35.toFixed(2)}`}
                        {outcome.key === 'under35' && data.selectedFixture.odds.under35 !== null && `${data.selectedFixture.odds.under35.toFixed(2)}`}
                        {outcome.key === 'bttsYes' && data.selectedFixture.odds.bttsYes !== null && `${data.selectedFixture.odds.bttsYes.toFixed(2)}`}
                        {outcome.key === 'bttsNo' && data.selectedFixture.odds.bttsNo !== null && `${data.selectedFixture.odds.bttsNo.toFixed(2)}`}
                        {outcome.key === 'htHome' && data.selectedFixture.odds.htHome !== null && `${data.selectedFixture.odds.htHome.toFixed(2)}`}
                        {outcome.key === 'htDraw' && data.selectedFixture.odds.htDraw !== null && `${data.selectedFixture.odds.htDraw.toFixed(2)}`}
                        {outcome.key === 'htAway' && data.selectedFixture.odds.htAway !== null && `${data.selectedFixture.odds.htAway.toFixed(2)}`}
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
              {errors.outcome && (
                <p className="text-red-400 text-sm mt-2">{errors.outcome}</p>
              )}
              
              {/* Quick Action Buttons */}
              {data.outcome && (
                <div className="mt-4 flex gap-2">
                  <motion.button
                    id="next-step-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNextStep()}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Continue to Configure
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleInputChange('outcome', undefined)}
                    className="px-4 py-2 border border-gray-600 text-gray-300 hover:border-gray-500 rounded-lg transition-colors"
                  >
                    Clear Selection
                  </motion.button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cryptocurrency Selection */}
      {data.category === 'cryptocurrency' && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Select Cryptocurrency</h4>
          
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search cryptocurrencies (500+ available)..."
              value={cryptoSearchQuery}
              onChange={(e) => setCryptoSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredCryptos.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
                <p>Loading cryptocurrencies...</p>
              </div>
            ) : (
              filteredCryptos.map(crypto => (
              <motion.button
                key={crypto.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => handleInputChange('selectedCrypto', crypto)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                  data.selectedCrypto?.id === crypto.id
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-gray-600 bg-gray-800/50 hover:border-cyan-400'
                }`}
              >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 relative">
                        {crypto.logo && crypto.logo.startsWith('http') ? (
                          <Image
                            src={crypto.logo}
                            alt={crypto.symbol}
                            fill
                            className="object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full text-white font-bold text-sm">
                            {crypto.symbol.slice(0, 2)}
                          </div>
                        )}
                      </div>
                  <div>
                    <div className="font-semibold text-white">{crypto.symbol}</div>
                    <div className="text-sm text-gray-400">{crypto.name}</div>
                        {crypto.rank && (
                          <div className="text-xs text-gray-500">Rank: #{crypto.rank}</div>
                        )}
                      </div>
                  </div>
                  <div className="text-right">
                      <div className="font-semibold text-white">${crypto.currentPrice.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">
                        {crypto.currentPrice < 1 ? crypto.currentPrice.toFixed(6) : crypto.currentPrice.toFixed(2)}
                      </div>
                  </div>
                </div>
              </motion.button>
              ))
            )}
          </div>
          
          {filteredCryptos.length > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              Showing {filteredCryptos.length} of {filteredCryptos.length} cryptocurrencies
            </div>
          )}
          
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
                <AmountInput
                  label="Target Price"
                  value={data.targetPrice?.toString() || ''}
                  onChange={(value) => handleInputChange('targetPrice', parseFloat(value || '0'))}
                  onValueChange={(numValue) => handleInputChange('targetPrice', numValue)}
                  placeholder={`Current: $${data.selectedCrypto.currentPrice.toFixed(2)}`}
                  error={errors.targetPrice}
                  currency="USD"
                  min={0.01}
                  max={1000000}
                  decimals={8}
                  size="md"
                  required
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Start Time*</label>
                <input
                  type="datetime-local"
                  value={data.userEventStartTime ? new Date(data.userEventStartTime.getTime() - data.userEventStartTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    handleInputChange('userEventStartTime', date);
                  }}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} // Minimum 1 minute from now
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  required
                />
                {errors.userEventStartTime && (
                  <p className="text-red-400 text-sm mt-2">{errors.userEventStartTime}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  When the prediction event starts. Betting will close 1 minute before this time.
                </p>
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
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Market Details</h3>
        
        {/* Generated Title Preview */}
        {data.title && (
          <div className="mb-6 p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-600">
            <label className="block text-sm font-medium text-gray-300 mb-2">Generated Title</label>
            <p className="text-white font-semibold text-sm sm:text-base">{data.title}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Market Odds Reference */}
          {data.selectedFixture?.odds && data.outcome && (
            (() => {
              const selectedOdds = (() => {
                switch (data.outcome) {
                  case 'home': return data.selectedFixture.odds.home;
                  case 'away': return data.selectedFixture.odds.away;
                  case 'draw': return data.selectedFixture.odds.draw;
                  case 'over25': return data.selectedFixture.odds.over25;
                  case 'under25': return data.selectedFixture.odds.under25;
                  case 'over35': return data.selectedFixture.odds.over35;
                  case 'under35': return data.selectedFixture.odds.under35;
                  case 'bttsYes': return data.selectedFixture.odds.bttsYes;
                  case 'bttsNo': return data.selectedFixture.odds.bttsNo;
                  case 'htHome': return data.selectedFixture.odds.htHome;
                  case 'htDraw': return data.selectedFixture.odds.htDraw;
                  case 'htAway': return data.selectedFixture.odds.htAway;
                  default: return null;
                }
              })();
              
              return selectedOdds && selectedOdds > 0 ? (
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Selected Market Odds</label>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {selectedOdds.toFixed(2)}x
                    </div>
                    <div className="text-sm text-gray-400">
                      {(() => {
                        switch (data.outcome) {
                          case 'home': return `${data.selectedFixture.homeTeam.name} Wins`;
                          case 'away': return `${data.selectedFixture.awayTeam.name} Wins`;
                          case 'draw': return 'Draw';
                          case 'over25': return 'Over 2.5 Goals';
                          case 'under25': return 'Under 2.5 Goals';
                          case 'over35': return 'Over 3.5 Goals';
                          case 'under35': return 'Under 3.5 Goals';
                          case 'bttsYes': return 'Both Teams to Score - Yes';
                          case 'bttsNo': return 'Both Teams to Score - No';
                          case 'htHome': return 'Home Team Wins';
                          case 'htDraw': return 'Draw and Home Team Wins';
                          case 'htAway': return 'Away Team Wins';
                          default: return '';
                        }
                      })()}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    💡 Set higher odds than {selectedOdds.toFixed(2)}x to make your pool more attractive and lucrative for bettors
                  </p>
                </div>
              ) : null;
            })()
          )}

          {/* Odds Multiplier Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Odds Multiplier*
            </label>
            <AmountInput
              value={(data.odds / 100).toFixed(2)}
              onChange={(value) => {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue >= 1.1 && numValue <= 100) {
                  handleInputChange('odds', Math.round(numValue * 100));
                }
              }}
              placeholder="2.00"
              min={1.1}
              max={100}
              step={0.01}
              allowDecimals={true}
              currency="x"
              help="How much bettors win if they're correct (e.g., 2.00 = 2x their stake). Set higher than market odds for better attraction."
            />
            {errors.odds && (
              <p className="text-red-400 text-sm">{errors.odds}</p>
            )}
          </div>

          {/* Creator Stake Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Creator Stake*
            </label>
            <AmountInput
              value={data.creatorStake.toString()}
              onChange={(value) => {
                const numValue = parseFloat(value);
                const minStake = useBitr ? 20 : 20; // Both STT and BITR have same minimum
                if (!isNaN(numValue) && numValue >= minStake && numValue <= 1000000) {
                  handleInputChange('creatorStake', numValue);
                }
              }}
              onValueChange={(numValue) => {
                const minStake = useBitr ? 20 : 20;
                if (numValue >= minStake && numValue <= 1000000) {
                  handleInputChange('creatorStake', numValue);
                }
              }}
              placeholder="20.0"
              min={20}
              max={1000000}
              step={0.1}
              allowDecimals={true}
              decimals={2}
              currency={useBitr ? 'BITR' : 'STT'}
              help={`Your stake that acts as liquidity for the market. Minimum: 20 ${useBitr ? 'BITR' : 'STT'}`}
            />
            {errors.creatorStake && (
              <p className="text-red-400 text-sm">{errors.creatorStake}</p>
            )}
          </div>

          {/* Payment Token Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Payment Token</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setUseBitr(false)}
                className={`p-3 rounded-lg border text-center transition-all ${
                  !useBitr
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-cyan-400'
                }`}
              >
                <div className="font-semibold text-sm sm:text-base">STT</div>
                <div className="text-xs mt-1">Somnia Network Currency</div>
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
                <div className="font-semibold text-sm sm:text-base">BITR</div>
                <div className="text-xs mt-1">Reduced fees & bonuses</div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Event Timing Information */}
        {(data.category === 'football' && data.selectedFixture) || (data.category === 'cryptocurrency' && data.userEventStartTime) ? (
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-400 mb-3">Event Timing</h4>
            <div className="space-y-2 text-xs">
              {(() => {
                const { eventStartTime, eventEndTime, bettingEndTime } = calculateEventTimes();
                
                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Betting Closes:</span>
                      <span className="text-white">
                        {new Date(bettingEndTime * 1000).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Event Starts:</span>
                      <span className="text-white">
                        {new Date(eventStartTime * 1000).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Event Ends:</span>
                      <span className="text-white">
                        {new Date(eventEndTime * 1000).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                      <p className="text-yellow-400 text-xs">
                        ⚠️ Betting will automatically close 1 minute before the event starts
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        ) : null}

        {/* YES-NO Selection */}
        <div className="mt-6">
          <div className="text-center mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Your Prediction</h3>
            <p className="text-sm text-gray-400">
              Choose your position - you&apos;re betting AGAINST your prediction
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* YES - Challenge Creator */}
            <div className={`
              p-4 sm:p-6 rounded-xl border-2 transition-all cursor-pointer
              ${data.predictionOutcome === 'yes' 
                ? 'bg-green-500/20 border-green-500/50 shadow-lg shadow-green-500/20' 
                : 'bg-gray-700/30 border-gray-600/50 hover:border-green-500/30 hover:bg-green-500/10'
              }
            `} onClick={() => handleInputChange('predictionOutcome', 'yes')}>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <HandRaisedIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-green-400 mb-1">YES</div>
                  <div className="text-xs sm:text-sm text-gray-400">Challenge Supporters</div>
                  <div className="text-xs text-green-400/80 mt-1">
                    You think this WON&apos;T happen and challenge supporters of this idea
                  </div>
                </div>
                <div className="text-sm sm:text-base font-bold text-white">
                  Win {(data.odds / 100).toFixed(2)}x your stake
                </div>
              </div>
            </div>
            
            {/* NO - Agree with Creator */}
            <div className={`
              p-4 sm:p-6 rounded-xl border-2 transition-all cursor-pointer
              ${data.predictionOutcome === 'no' 
                ? 'bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/20' 
                : 'bg-gray-700/30 border-gray-600/50 hover:border-red-500/30 hover:bg-red-500/10'
              }
            `} onClick={() => handleInputChange('predictionOutcome', 'no')}>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-red-400 mb-1">NO</div>
                  <div className="text-xs sm:text-sm text-gray-400">Challenge Opposers</div>
                  <div className="text-xs text-red-400/80 mt-1">
                    You think this WILL happen and challenge opposers of this idea
                  </div>
                </div>
                <div className="text-sm sm:text-base font-bold text-white">
                  Win {((data.odds / 100) - 1).toFixed(2)}x your stake
                </div>
              </div>
            </div>
          </div>
          
          {/* Contrarian Logic Explanation */}
          <div className="mt-4 p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-600">
            <p className="text-sm text-gray-400">
              <strong className="text-cyan-400">Contrarian Logic:</strong> You&apos;re betting AGAINST your prediction. 
              If you select &quot;YES&quot; and the outcome happens, you LOSE and bettors WIN. 
              If you select &quot;NO&quot; and the outcome doesn&apos;t happen, you LOSE and bettors WIN. 
              Being a Creator means to monetize others&apos; opinions that you don&apos;t agree with.
            </p>
          </div>
          
          {errors.predictionOutcome && (
            <p className="text-red-400 text-sm mt-3">{errors.predictionOutcome}</p>
          )}
        </div>

        <div className="mt-6">
          <Textarea
            label="Market Description"
            value={data.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your market prediction and any additional context..."
            rows={4}
            error={errors.description}
            help="Explain what you&apos;re predicting and why others should participate"
          />
        </div>

        {/* Boost Market Options */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Boost Market (Optional)</label>
          <p className="text-xs text-gray-400 mb-3">
            Boost your market for better visibility and higher rewards. Boost fees are distributed to winners.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => handleInputChange('boostTier', 'NONE')}
              className={`p-3 rounded-lg border text-center transition-all ${
                (!data.boostTier || data.boostTier === 'NONE')
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-cyan-400'
              }`}
            >
              <div className="font-semibold text-sm">No Boost</div>
              <div className="text-xs mt-1">Free</div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => handleInputChange('boostTier', 'BRONZE')}
              className={`p-3 rounded-lg border text-center transition-all ${
                data.boostTier === 'BRONZE'
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-orange-400'
              }`}
            >
              <div className="font-semibold text-sm">🥉 Bronze</div>
              <div className="text-xs mt-1">2 {useBitr ? 'BITR' : 'STT'}</div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => handleInputChange('boostTier', 'SILVER')}
              className={`p-3 rounded-lg border text-center transition-all ${
                data.boostTier === 'SILVER'
                  ? 'border-gray-500 bg-gray-500/10 text-gray-400'
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold text-sm">🥈 Silver</div>
              <div className="text-xs mt-1">3 {useBitr ? 'BITR' : 'STT'}</div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => handleInputChange('boostTier', 'GOLD')}
              className={`p-3 rounded-lg border text-center transition-all ${
                data.boostTier === 'GOLD'
                  ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-yellow-400'
              }`}
            >
              <div className="font-semibold text-sm">🥇 Gold</div>
              <div className="text-xs mt-1">5 {useBitr ? 'BITR' : 'STT'}</div>
            </motion.button>
          </div>
        </div>

        {/* Privacy and Limits */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Private Market Option */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Market Privacy</label>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => handleInputChange('isPrivate', false)}
                className={`p-3 rounded-lg border text-center transition-all flex-1 ${
                  !data.isPrivate
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-green-400'
                }`}
              >
                <div className="font-semibold text-sm">Public</div>
                <div className="text-xs mt-1">Anyone can bet</div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => handleInputChange('isPrivate', true)}
                className={`p-3 rounded-lg border text-center transition-all flex-1 ${
                  data.isPrivate
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-purple-400'
                }`}
              >
                <div className="font-semibold text-sm">Private</div>
                <div className="text-xs mt-1">Whitelist only</div>
              </motion.button>
            </div>
          </div>

          {/* Max Bet Per User */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Max Bet Per User (Optional)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="0"
                value={data.maxBetPerUser || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0) {
                    handleInputChange('maxBetPerUser', value);
                  } else if (e.target.value === '') {
                    handleInputChange('maxBetPerUser', undefined);
                  }
                }}
                placeholder="No limit"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                {useBitr ? 'BITR' : 'STT'}
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Set to 0 or leave empty for no limit
            </p>
          </div>
        </div>



        {/* Market Summary */}
        {data.selectedFixture && (
          <div className="mt-6 p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-600">
            <h4 className="font-semibold text-white mb-3 text-sm sm:text-base">Market Summary</h4>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Match:</span>
                <span className="text-white">{data.selectedFixture.homeTeam.name} vs {data.selectedFixture.awayTeam.name}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">League:</span>
                <span className="text-white">{data.selectedFixture.league.name}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Match Date:</span>
                <span className="text-white">{new Date(data.selectedFixture.matchDate).toLocaleString()}</span>
              </div>
              {data.outcome && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-gray-300">Prediction:</span>
                  <span className="text-white">
                    {data.outcome === 'home' && `${data.selectedFixture.homeTeam.name} to win`}
                    {data.outcome === 'away' && `${data.selectedFixture.awayTeam.name} to win`}
                    {data.outcome === 'draw' && 'Match to end in draw'}
                    {data.outcome === 'over25' && 'Over 2.5 goals'}
                    {data.outcome === 'under25' && 'Under 2.5 goals'}
                    {data.outcome === 'over35' && 'Over 3.5 goals'}
                    {data.outcome === 'under35' && 'Under 3.5 goals'}
                  </span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Odds:</span>
                <span className="text-white">{(data.odds / 100).toFixed(2)}x</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
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
          <p className="text-xs text-cyan-400 font-mono break-all mb-3">{deploymentHash}</p>
          <a 
            href={`https://explorer.somnia.network/tx/${deploymentHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on Explorer
          </a>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => {
            setStep(1);
            setData({
              category: '',
              odds: 200,
              creatorStake: 20,
              description: ''
            });
            setErrors({});
            setDeploymentHash('');
          }}
          variant="outline"
          className="w-full sm:w-auto"
        >
          Create Another Market
        </Button>
        <Button
          onClick={() => {
            // Redirect to the specific bet page for the newly created pool
            // We need to get the pool ID from the transaction
            if (deploymentHash) {
              // For now, redirect to markets, but in production this would be the actual pool ID
              window.location.href = '/markets';
            } else {
              window.location.href = '/markets';
            }
          }}
          variant="primary"
          className="w-full sm:w-auto"
        >
          View in Markets
        </Button>
      </div>
    </div>
  );

  const renderDeploy = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Deploy Market</h3>
        <p className="text-sm text-gray-400 mb-6">
          Review your market details before deploying to the blockchain
        </p>
        
        {/* Market Summary */}
        <div className="p-4 sm:p-6 bg-gray-800/50 rounded-lg border border-gray-600">
          <h4 className="font-semibold text-white mb-4 text-base sm:text-lg">Market Summary</h4>
          
          {data.selectedFixture && (
            <div className="space-y-3 text-sm sm:text-base">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Match:</span>
                <span className="text-white font-medium">{data.selectedFixture.homeTeam.name} vs {data.selectedFixture.awayTeam.name}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">League:</span>
                <span className="text-white font-medium">{data.selectedFixture.league.name}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Match Date:</span>
                <span className="text-white font-medium">{new Date(data.selectedFixture.matchDate).toLocaleString()}</span>
              </div>
              {data.outcome && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-gray-300">Prediction:</span>
                  <span className="text-white font-medium">
                    {data.outcome === 'home' && `${data.selectedFixture.homeTeam.name} to win`}
                    {data.outcome === 'away' && `${data.selectedFixture.awayTeam.name} to win`}
                    {data.outcome === 'draw' && 'Match to end in draw'}
                    {data.outcome === 'over25' && 'Over 2.5 goals'}
                    {data.outcome === 'under25' && 'Under 2.5 goals'}
                    {data.outcome === 'over35' && 'Over 3.5 goals'}
                    {data.outcome === 'under35' && 'Under 3.5 goals'}
                    {data.outcome === 'bttsYes' && 'Both teams to score - Yes'}
                    {data.outcome === 'bttsNo' && 'Both teams to score - No'}
                    {data.outcome === 'htHome' && 'Home team wins'}
                    {data.outcome === 'htDraw' && 'Draw and home team wins'}
                    {data.outcome === 'htAway' && 'Away team wins'}
                  </span>
                </div>
              )}
              {data.outcome && data.selectedFixture.odds && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-gray-300">Market Odds:</span>
                  <span className="text-white font-medium">
                    {data.outcome === 'home' && data.selectedFixture.odds.home && `${data.selectedFixture.odds.home.toFixed(2)}x`}
                    {data.outcome === 'away' && data.selectedFixture.odds.away && `${data.selectedFixture.odds.away.toFixed(2)}x`}
                    {data.outcome === 'draw' && data.selectedFixture.odds.draw && `${data.selectedFixture.odds.draw.toFixed(2)}x`}
                    {data.outcome === 'over25' && data.selectedFixture.odds.over25 && `${data.selectedFixture.odds.over25.toFixed(2)}x`}
                    {data.outcome === 'under25' && data.selectedFixture.odds.under25 && `${data.selectedFixture.odds.under25.toFixed(2)}x`}
                    {data.outcome === 'over35' && data.selectedFixture.odds.over35 && `${data.selectedFixture.odds.over35.toFixed(2)}x`}
                    {data.outcome === 'under35' && data.selectedFixture.odds.under35 && `${data.selectedFixture.odds.under35.toFixed(2)}x`}
                    {data.outcome === 'bttsYes' && data.selectedFixture.odds.bttsYes && `${data.selectedFixture.odds.bttsYes.toFixed(2)}x`}
                    {data.outcome === 'bttsNo' && data.selectedFixture.odds.bttsNo && `${data.selectedFixture.odds.bttsNo.toFixed(2)}x`}
                    {data.outcome === 'htHome' && data.selectedFixture.odds.htHome && `${data.selectedFixture.odds.htHome.toFixed(2)}x`}
                    {data.outcome === 'htDraw' && data.selectedFixture.odds.htDraw && `${data.selectedFixture.odds.htDraw.toFixed(2)}x`}
                    {data.outcome === 'htAway' && data.selectedFixture.odds.htAway && `${data.selectedFixture.odds.htAway.toFixed(2)}x`}
                  </span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Your Position:</span>
                <span className={`font-medium ${data.predictionOutcome === 'yes' ? 'text-green-400' : 'text-red-400'}`}>
                  {data.predictionOutcome === 'yes' ? 'YES - Challenge Supporters' : 'NO - Challenge Opposers'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Odds:</span>
                <span className="text-white font-medium">{(data.odds / 100).toFixed(2)}x</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Your Stake:</span>
                <span className="text-white font-medium">{data.creatorStake} {useBitr ? 'BITR' : 'STT'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Payment Token:</span>
                <span className="text-white font-medium">{useBitr ? 'BITR' : 'STT'}</span>
              </div>
              {data.description && (
                <div className="flex flex-col gap-1">
                  <span className="text-gray-300">Description:</span>
                  <span className="text-white font-medium">{data.description}</span>
                </div>
              )}
            </div>
          )}

          {data.selectedCrypto && (
            <div className="space-y-3 text-sm sm:text-base">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Cryptocurrency:</span>
                <span className="text-white font-medium">{data.selectedCrypto.name} ({data.selectedCrypto.symbol})</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Current Price:</span>
                <span className="text-white font-medium">${data.selectedCrypto.currentPrice.toLocaleString()}</span>
              </div>
              {data.targetPrice && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-gray-300">Target Price:</span>
                  <span className="text-white font-medium">${data.targetPrice.toLocaleString()}</span>
                </div>
              )}
              {data.direction && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-gray-300">Prediction:</span>
                  <span className="text-white font-medium">
                    {data.selectedCrypto.symbol} will go {data.direction} ${data.targetPrice?.toLocaleString()}
                  </span>
                </div>
              )}
              {data.timeframe && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-gray-300">Timeframe:</span>
                  <span className="text-white font-medium">{data.timeframe}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Your Position:</span>
                <span className={`font-medium ${data.predictionOutcome === 'yes' ? 'text-green-400' : 'text-red-400'}`}>
                  {data.predictionOutcome === 'yes' ? 'YES - Challenge Supporters' : 'NO - Challenge Opposers'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Odds:</span>
                <span className="text-white font-medium">{(data.odds / 100).toFixed(2)}x</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Your Stake:</span>
                <span className="text-white font-medium">{data.creatorStake} {useBitr ? 'BITR' : 'STT'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Payment Token:</span>
                <span className="text-white font-medium">{useBitr ? 'BITR' : 'STT'}</span>
              </div>
              {data.description && (
                <div className="flex flex-col gap-1">
                  <span className="text-gray-300">Description:</span>
                  <span className="text-white font-medium">{data.description}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contrarian Logic Reminder */}
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
          <h4 className="font-semibold text-white mb-2 text-sm sm:text-base">Contrarian Logic Reminder</h4>
          <p className="text-xs sm:text-sm text-gray-400">
            You&apos;re betting AGAINST your prediction. If you select &quot;YES&quot; and the outcome happens, you LOSE and bettors WIN. 
            If you select &quot;NO&quot; and the outcome doesn&apos;t happen, you LOSE and bettors WIN. 
            Being a Creator means to monetize others&apos; opinions that you don&apos;t agree with.
          </p>
        </div>

        {/* Create Market Button */}
        <div className="flex flex-col items-center gap-4 pt-4">
          {Object.keys(errors).length > 0 && (
            <div className="text-red-400 text-sm text-center">
              {Object.values(errors).join(', ')}
            </div>
          )}
          <Button
            onClick={handleCreateMarket}
            variant="primary"
            disabled={isLoading || isPending || isConfirming}
            loading={isLoading || isPending || isConfirming}
            className="min-w-[200px] w-full sm:w-auto"
          >
            {isConfirming ? 'Confirming...' : 'Deploy Market'}
          </Button>
        </div>
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
                reputation={userReputation} 
                size="lg"
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
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto px-4">
              Create guided prediction markets with real-time data sources. 
              Build your reputation and earn from accurate predictions.
            </p>
            
            {userReputation && (
              <div className="mt-6 flex justify-center">
                <ReputationBadge 
                  reputation={userReputation}
                />
              </div>
            )}
          </div>

          {/* Progress Steps */}
          <div className="mb-8 px-4">
            <div className="flex items-center justify-center space-x-2 sm:space-x-4">
              {[1, 2, 3].map((stepNumber) => (
                <React.Fragment key={stepNumber}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                    step >= stepNumber 
                      ? 'bg-cyan-500 text-white' 
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {isSuccess && stepNumber === 3 ? (
                      <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`h-1 w-8 sm:w-16 ${
                      step > stepNumber ? 'bg-cyan-500' : 'bg-gray-700'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-center space-x-8 sm:space-x-16 mt-2">
              <div className="text-center w-16 sm:w-20">
                <span className="text-xs text-gray-400">Select Market</span>
              </div>
              <div className="text-center w-16 sm:w-20">
                <span className="text-xs text-gray-400">Configure</span>
              </div>
              <div className="text-center w-16 sm:w-20">
                <span className="text-xs text-gray-400">Deploy</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-8 border border-gray-700 mx-4"
          >
            {step === 1 && renderCategorySelection()}
            {step === 2 && renderMarketDetails()}
            {step === 3 && !isSuccess && renderDeploy()}
            {step === 3 && isSuccess && renderSuccess()}
          </motion.div>

          {/* Navigation */}
          {step < 3 && !isSuccess && (
            <div className="flex flex-col sm:flex-row justify-between mt-8 gap-4 px-4">
              <Button
                onClick={handlePrevStep}
                variant="outline"
                disabled={step === 1}
                className="w-full sm:w-auto"
              >
                Previous
              </Button>
              
              <Button
                onClick={handleNextStep}
                variant="primary"
                className="w-full sm:w-auto"
              >
                Next
              </Button>
            </div>
          )}
          
          {/* Deploy Page Navigation */}
          {step === 3 && !isSuccess && (
            <div className="flex flex-col sm:flex-row justify-between mt-8 gap-4 px-4">
              <Button
                onClick={handlePrevStep}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Back to Configure
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
