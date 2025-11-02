"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useRouter, useSearchParams } from "next/navigation";
import { parseUnits, keccak256, toHex } from "viem";
import { usePoolCore } from "@/hooks/useContractInteractions";
import { 
  ArrowLeftIcon, 
  XMarkIcon,
  ChartBarIcon,
  CubeIcon,
  SparklesIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  HandRaisedIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { useTransactionFeedback, TransactionFeedback } from "@/components/TransactionFeedback";
import Button from "@/components/button";
import AmountInput from "@/components/AmountInput";
import Textarea from "@/components/textarea";
import AnimatedTitle from "@/components/AnimatedTitle";
import FixtureSelector from "@/components/FixtureSelector";
import MarketTypeSelector from "@/components/MarketTypeSelector";
import EnhancedComboPoolCreationForm from "@/components/EnhancedComboPoolCreationForm";
import { useReputationStore } from "@/stores/useReputationStore";
import ReputationBadge from "@/components/ReputationBadge";
import { GuidedMarketService, Cryptocurrency, FootballMatch } from "@/services/guidedMarketService";
// import { useGuidedMarketCreation } from "@/services/guidedMarketWalletService"; // Not used - using direct contract calls
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useBITRToken } from "@/hooks/useBITRToken";
import { useReputationCheck } from "@/hooks/useReputationCheck";



// Import the full contract ABI (commented out as not currently used)
// import BitredictPoolABI from '@/contracts/abis/BitredictPool.json';

// Contract address (commented out as not currently used)
// const CONTRACT_ADDRESS = CONTRACTS.POOL_CORE.address; // Updated to use POOL_CORE

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
    over15: number | null;
    under15: number | null;
    over25: number | null;
    under25: number | null;
    over35: number | null;
    under35: number | null;
    bttsYes: number | null;
    bttsNo: number | null;
    htHome: number | null;
    htDraw: number | null;
    htAway: number | null;
    ht_over_05: number | null;
    ht_under_05: number | null;
    ht_over_15: number | null;
    ht_under_15: number | null;
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
  outcome?: 'home' | 'away' | 'draw' | 'over15' | 'under15' | 'over25' | 'under25' | 'over35' | 'under35' | 'bttsYes' | 'bttsNo' | 'htHome' | 'htDraw' | 'htAway' | 'ht_over_05' | 'ht_under_05' | 'ht_over_15' | 'ht_under_15';
  marketType?: number; // Contract market type enum
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

type MarketType = 'guided' | 'combo' | null;

function CreateMarketPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();

  const { connectWallet, isConnecting } = useWalletConnection();
  // const { createFootballMarket } = useGuidedMarketCreation(); // Not used - using direct contract calls
  const { createPool } = usePoolCore();
  const { getUserReputation, canCreateMarket, addReputationAction } = useReputationStore();
  const reputationCheck = useReputationCheck(address as `0x${string}` | undefined);
  const { data: hash, error: writeError, isPending } = useWriteContract(); // writeContract removed as not currently used
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  // Transaction feedback system
  const { transactionStatus, showSuccess, showError, showInfo, clearStatus } = useTransactionFeedback();
  
  // BITR Token approval state
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  
  // Market type selection
  const [selectedType, setSelectedType] = useState<MarketType>(null);

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
  // const [isCreating, setIsCreating] = useState(false);
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

  // Helper functions for crypto market creation
  const getTimeframeHours = (timeframe: string): number => {
    const hoursMap: Record<string, number> = {
      '1h': 1,
      '4h': 4,
      '1d': 24,
      '3d': 72,
      '7d': 168,
      '30d': 720
    };
    return hoursMap[timeframe] || 24;
  };

  const getDateString = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0].replace(/-/g, '_');
  };

  const getMarketTypeEnum = (marketType: string): number => {
    const marketTypeMap: Record<string, number> = {
      '1X2': 0,           // MONEYLINE
      'OU25': 1,          // OVER_UNDER (2.5)
      'OU35': 1,          // OVER_UNDER (3.5)
      'OU15': 1,          // OVER_UNDER (1.5)
      'HT_OU15': 1,       // HALF_TIME_OVER_UNDER (1.5)
      'BTTS': 3,          // PROPOSITION (Both Teams To Score)
      'HT_1X2': 3,        // PROPOSITION (Half Time Result)
      'DC': 3,            // PROPOSITION (Double Chance)
      'CS': 4,            // CORRECT_SCORE
      'FG': 3,            // PROPOSITION (First Goal)
      'CUSTOM': 5         // CUSTOM
    };
    
    return marketTypeMap[marketType] || 0; // Default to MONEYLINE
  };

  // Check URL params for pre-selected type
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'guided' || type === 'combo') {
      setSelectedType(type);
    }
  }, [searchParams]);

  const handleTypeSelect = (type: 'guided' | 'combo') => {
    setSelectedType(type);
    // Update URL without page reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('type', type);
    window.history.replaceState({}, '', newUrl.toString());
  };

  const handleBack = () => {
    if (selectedType) {
      setSelectedType(null);
      // Remove type from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('type');
      window.history.replaceState({}, '', newUrl.toString());
    } else {
      router.push('/markets');
    }
  };

  const handleSuccess = (poolId: string) => {
    // setIsCreating(false); // This variable is not defined, removing this line
    // Navigate to the created pool
    if (selectedType === 'combo') {
      router.push(`/markets/combo/${poolId}`);
    } else {
      router.push(`/bet/${poolId}`);
    }
  };

  const handleClose = () => {
    router.push('/markets');
  };

  // Notify backend about pool creation for immediate indexing
  const notifyPoolCreation = useCallback(async (transactionHash: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev'}/api/pools/notify-creation`, {
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
      } else {
        console.warn('Pool creation notification failed:', response.status, response.statusText);
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
            // Get team logo URLs from the correct fields
            const homeTeamLogo = (fixture as FootballMatch & { home_team_logo?: string; away_team_logo?: string; league?: { country?: string } }).home_team_logo || fixture.homeTeam?.logoUrl;
            const awayTeamLogo = (fixture as FootballMatch & { home_team_logo?: string; away_team_logo?: string; league?: { country?: string } }).away_team_logo || fixture.awayTeam?.logoUrl;
            
            // Get league info with country
            const leagueName = fixture.league?.name || 'Unknown League';
            const leagueCountry = (fixture as FootballMatch & { home_team_logo?: string; away_team_logo?: string; league?: { country?: string } }).league?.country || '';
            const fullLeagueName = leagueCountry ? `${leagueCountry} ${leagueName}` : leagueName;
            
            return {
              id: typeof fixture.id === 'string' ? parseInt(fixture.id, 10) || Math.floor(Math.random() * 1000000) : (fixture.id || Math.floor(Math.random() * 1000000)),
              name: `${fixture.homeTeam?.name || 'Unknown'} vs ${fixture.awayTeam?.name || 'Unknown'}`,
              homeTeam: {
                id: fixture.homeTeam?.id ? Number(fixture.homeTeam.id) : 0,
                name: fixture.homeTeam?.name || 'Unknown',
                logoUrl: homeTeamLogo
              },
              awayTeam: {
                id: fixture.awayTeam?.id ? Number(fixture.awayTeam.id) : 0,
                name: fixture.awayTeam?.name || 'Unknown',
                logoUrl: awayTeamLogo
              },
              league: {
                id: fixture.league?.id ? Number(fixture.league.id) : 0,
                name: fullLeagueName,
                logoUrl: fixture.league?.logoUrl
              },
              matchDate: fixture.matchDate || new Date().toISOString(),
              status: fixture.status || 'scheduled',
              odds: fixture.odds ? {
                home: fixture.odds.home,
                draw: fixture.odds.draw,
                away: fixture.odds.away,
                over15: fixture.odds.over15,
                under15: fixture.odds.under15,
                over25: fixture.odds.over25,
                under25: fixture.odds.under25,
                over35: fixture.odds.over35,
                under35: fixture.odds.under35,
                bttsYes: fixture.odds.bttsYes,
                bttsNo: fixture.odds.bttsNo,
                htHome: fixture.odds.htHome,
                htDraw: fixture.odds.htDraw,
                htAway: fixture.odds.htAway,
                ht_over_05: fixture.odds.ht_over_05,
                ht_under_05: fixture.odds.ht_under_05,
                ht_over_15: fixture.odds.ht_over_15,
                ht_under_15: fixture.odds.ht_under_15,
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
      console.log('❌ Transaction failed - showing error feedback');
      console.error('Transaction error:', writeError);
      
      // Parse specific error messages for better user feedback
      let errorMessage = 'Failed to create market';
      let errorTitle = 'Transaction Failed';
      
      if (writeError.message) {
        const errorStr = writeError.message.toLowerCase();
        
        if (errorStr.includes('insufficient funds')) {
          errorTitle = 'Insufficient Funds';
          errorMessage = 'You don\'t have enough funds to complete this transaction';
        } else if (errorStr.includes('user rejected')) {
          errorTitle = 'Transaction Cancelled';
          errorMessage = 'You cancelled the transaction in your wallet';
        } else if (errorStr.includes('execution reverted')) {
          errorTitle = 'Contract Error';
          errorMessage = 'The transaction failed on the blockchain - check your parameters';
        } else if (errorStr.includes('invalid odds')) {
          errorTitle = 'Invalid Odds';
          errorMessage = 'Odds must be between 1.01x and 100x';
        } else if (errorStr.includes('stake below minimum')) {
          errorTitle = 'Invalid Stake';
          errorMessage = 'Creator stake must be at least 20 BITR';
        } else if (errorStr.includes('event must be in future')) {
          errorTitle = 'Invalid Timing';
          errorMessage = 'Event must start in the future';
        } else if (errorStr.includes('event too soon')) {
          errorTitle = 'Invalid Timing';
          errorMessage = 'Event must start at least 1 minute from now';
        } else if (errorStr.includes('event too far')) {
          errorTitle = 'Invalid Timing';
          errorMessage = 'Event cannot be more than 365 days in the future';
        } else if (errorStr.includes('bitr transfer failed')) {
          errorTitle = 'Token Transfer Failed';
          errorMessage = 'BITR token transfer failed - check your balance and allowance';
        } else if (errorStr.includes('gas')) {
          errorTitle = 'Gas Error';
          errorMessage = 'Transaction failed due to gas issues - try again';
        } else {
          errorMessage = writeError.message;
        }
      }
      
      showError(errorTitle, errorMessage);
      setIsLoading(false);
    }
  }, [writeError, showError]);

  // Monitor transaction states for feedback
  useEffect(() => {
    if (isPending) {
      console.log('🔄 Transaction pending - showing feedback');
      showInfo('Transaction Pending', 'Please confirm the transaction in your wallet...');
    }
  }, [isPending, showInfo]);

  useEffect(() => {
    if (isConfirming) {
      console.log('⏳ Transaction confirming - showing feedback');
      showInfo('Transaction Confirming', 'Your market creation is being processed on the blockchain...');
    }
  }, [isConfirming, showInfo]);

  // Clear loading state when transaction is no longer pending (user cancelled or error occurred)
  useEffect(() => {
    if (!isPending && !isConfirming && !isSuccess && !writeError && isLoading) {
      // Transaction was cancelled or failed without triggering writeError
      setIsLoading(false);
    }
  }, [isPending, isConfirming, isSuccess, writeError, isLoading]);

  useEffect(() => {
    if (isSuccess && hash) {
      console.log('✅ Transaction successful - showing feedback with hash:', hash);
      showSuccess('Market Created Successfully!', 'Your market has been created and is now live on the blockchain', hash);
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
      const notifyBackend = async () => {
        try {
          await notifyPoolCreation(hash);
        } catch (error) {
          console.warn('Failed to notify backend about pool creation:', error);
          // Don't fail the entire flow if backend notification fails
        }
      };
      notifyBackend();
      
      // Reset approval state for future transactions
      setApprovalConfirmed(false);
      
      // Reset form data for next market creation
      try {
      setData({
        category: '',
        odds: 200,
        creatorStake: 20,
        description: ''
      });
      setStep(1);
      } catch (error) {
        console.error('Error resetting form data:', error);
        // Fallback: just reset to step 1 without changing data
        setStep(1);
      }
    }
  }, [isSuccess, hash, address, addReputationAction, notifyPoolCreation, showSuccess]);

  // Track approval transaction confirmation
  const { isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({ 
    hash: token.hash 
  });

  // Track token approval states for transaction feedback
  useEffect(() => {
    if (token.isPending) {
      console.log('🔄 Token approval pending - showing feedback');
      showInfo('Approval Pending', 'Please confirm the BITR token approval in your wallet...');
    }
  }, [token.isPending, showInfo]);

  useEffect(() => {
    if (token.isConfirming) {
      console.log('⏳ Token approval confirming - showing feedback');
      showInfo('Approval Confirming', 'Your BITR token approval is being processed on the blockchain...');
    }
  }, [token.isConfirming, showInfo]);

  // Track approval confirmation
  useEffect(() => {
    if (isApprovalSuccess && !approvalConfirmed) {
      console.log('✅ Token approval successful - showing feedback with hash:', token.hash);
      setApprovalConfirmed(true);
      showSuccess('Approval Confirmed!', 'BITR token approval confirmed! You can now create the pool.', token.hash);
    }
  }, [isApprovalSuccess, approvalConfirmed, showSuccess, token.hash]);

  // Track token approval errors
  useEffect(() => {
    if (token.error) {
      console.log('❌ Token approval failed - showing error feedback');
      showError('Approval Failed', token.error.message || 'Failed to approve BITR tokens');
    }
  }, [token.error, showError]);

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




  const handleMarketSelect = (fixture: Fixture, marketType: string, outcome: string) => {
    // Set the selected fixture
    handleInputChange('selectedFixture', fixture);
    
    // Set the market type enum
    const marketTypeEnum = getMarketTypeEnum(marketType);
    console.log('🔍 Market Selection Debug:', {
      selectedMarketType: marketType,
      mappedEnum: marketTypeEnum,
      outcome: outcome
    });
    handleInputChange('marketType', marketTypeEnum);
    
    // Set the outcome based on market type and outcome
    handleInputChange('outcome', outcome as 'home' | 'away' | 'draw' | 'over15' | 'under15' | 'over25' | 'under25' | 'over35' | 'under35' | 'bttsYes' | 'bttsNo' | 'htHome' | 'htDraw' | 'htAway' | 'ht_over_05' | 'ht_under_05' | 'ht_over_15' | 'ht_under_15');
    
    // Auto-populate odds based on the selected market
    if (fixture.odds) {
      let selectedOdds = 200; // default
      
      switch (marketType) {
        case 'moneyline':
          if (outcome === 'home' && fixture.odds.home) selectedOdds = Math.floor(fixture.odds.home * 100);
          else if (outcome === 'draw' && fixture.odds.draw) selectedOdds = Math.floor(fixture.odds.draw * 100);
          else if (outcome === 'away' && fixture.odds.away) selectedOdds = Math.floor(fixture.odds.away * 100);
          break;
        case 'over_under':
          if (outcome === 'over15' && fixture.odds.over15) selectedOdds = Math.floor(fixture.odds.over15 * 100);
          else if (outcome === 'under15' && fixture.odds.under15) selectedOdds = Math.floor(fixture.odds.under15 * 100);
          else if (outcome === 'over25' && fixture.odds.over25) selectedOdds = Math.floor(fixture.odds.over25 * 100);
          else if (outcome === 'under25' && fixture.odds.under25) selectedOdds = Math.floor(fixture.odds.under25 * 100);
          else if (outcome === 'over35' && fixture.odds.over35) selectedOdds = Math.floor(fixture.odds.over35 * 100);
          else if (outcome === 'under35' && fixture.odds.under35) selectedOdds = Math.floor(fixture.odds.under35 * 100);
          break;
        case 'btts':
          if (outcome === 'yes' && fixture.odds.bttsYes) selectedOdds = Math.floor(fixture.odds.bttsYes * 100);
          else if (outcome === 'no' && fixture.odds.bttsNo) selectedOdds = Math.floor(fixture.odds.bttsNo * 100);
          break;
        case 'ht_moneyline':
          if (outcome === 'htHome' && fixture.odds.htHome) selectedOdds = Math.floor(fixture.odds.htHome * 100);
          else if (outcome === 'htDraw' && fixture.odds.htDraw) selectedOdds = Math.floor(fixture.odds.htDraw * 100);
          else if (outcome === 'htAway' && fixture.odds.htAway) selectedOdds = Math.floor(fixture.odds.htAway * 100);
          break;
        case 'ht_over_under':
          if (outcome === 'ht_over_05' && fixture.odds.ht_over_05) selectedOdds = Math.floor(fixture.odds.ht_over_05 * 100);
          else if (outcome === 'ht_under_05' && fixture.odds.ht_under_05) selectedOdds = Math.floor(fixture.odds.ht_under_05 * 100);
          else if (outcome === 'ht_over_15' && fixture.odds.ht_over_15) selectedOdds = Math.floor(fixture.odds.ht_over_15 * 100);
          else if (outcome === 'ht_under_15' && fixture.odds.ht_under_15) selectedOdds = Math.floor(fixture.odds.ht_under_15 * 100);
          break;
        case 'ft_1x2':
          if (outcome === 'home' && fixture.odds.home) selectedOdds = Math.floor(fixture.odds.home * 100);
          else if (outcome === 'draw' && fixture.odds.draw) selectedOdds = Math.floor(fixture.odds.draw * 100);
          else if (outcome === 'away' && fixture.odds.away) selectedOdds = Math.floor(fixture.odds.away * 100);
          break;
        case 'ht_1x2':
          if (outcome === 'htHome' && fixture.odds.htHome) selectedOdds = Math.floor(fixture.odds.htHome * 100);
          else if (outcome === 'htDraw' && fixture.odds.htDraw) selectedOdds = Math.floor(fixture.odds.htDraw * 100);
          else if (outcome === 'htAway' && fixture.odds.htAway) selectedOdds = Math.floor(fixture.odds.htAway * 100);
          break;
        case 'ou_25':
        case 'ou_35':
        case 'ht_ou_15':
          if (outcome === 'over25' && fixture.odds.over25) selectedOdds = Math.floor(fixture.odds.over25 * 100);
          else if (outcome === 'under25' && fixture.odds.under25) selectedOdds = Math.floor(fixture.odds.under25 * 100);
          else if (outcome === 'over35' && fixture.odds.over35) selectedOdds = Math.floor(fixture.odds.over35 * 100);
          else if (outcome === 'under35' && fixture.odds.under35) selectedOdds = Math.floor(fixture.odds.under35 * 100);
          else if (outcome === 'ht_over_15' && fixture.odds.ht_over_15) selectedOdds = Math.floor(fixture.odds.ht_over_15 * 100);
          else if (outcome === 'ht_under_15' && fixture.odds.ht_under_15) selectedOdds = Math.floor(fixture.odds.ht_under_15 * 100);
          break;
        case 'double_chance':
          // For double chance, we'll use calculated odds from the market
          selectedOdds = 200; // Default odds for double chance
          break;
        case 'correct_score':
          // For correct score, we'll use calculated odds from the market
          selectedOdds = 300; // Higher odds for correct score
          break;
        case 'first_goal':
          // For first goal, we'll use calculated odds from the market
          selectedOdds = 250; // Medium-high odds for first goal
          break;
      }
      
      handleInputChange('odds', selectedOdds);
    }

    // Navigate to configure page
    setStep(2);
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
        // Note: outcome is now selected directly in FixtureSelector, so no need to validate here
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
      if (!data.odds || data.odds < 101 || data.odds > 10000) {
        newErrors.odds = 'Odds must be between 1.01x and 100.0x';
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
      // Use standardized oracle-compatible outcomes
      switch (data.outcome) {
        case 'home':
          return 'Home wins';
        case 'away':
          return 'Away wins';
        case 'draw':
          return 'Draw';
        case 'over25':
          return 'Over 2.5';
        case 'under25':
          return 'Under 2.5';
        case 'over35':
          return 'Over 3.5';
        case 'under35':
          return 'Under 3.5';
        case 'bttsYes':
          return 'Yes';
        case 'bttsNo':
          return 'No';
        case 'htHome':
          return 'Home HT';
        case 'htDraw':
          return 'Draw HT';
        case 'htAway':
          return 'Away HT';
        case 'ht_over_05':
          return 'Over 0.5 HT';
        case 'ht_under_05':
          return 'Under 0.5 HT';
        case 'ht_over_15':
          return 'Over 1.5 HT';
        case 'ht_under_15':
          return 'Under 1.5 HT';
        default:
          return 'Home wins'; // Default to home wins for unknown outcomes
      }
    }

    if (data.category === 'cryptocurrency' && data.selectedCrypto) {
      const crypto = data.selectedCrypto;
      if (data.direction === 'above') {
        return `${crypto.symbol} above $${data.targetPrice}`;
      } else {
        return `${crypto.symbol} below $${data.targetPrice}`;
      }
    }

    return 'unknown_outcome';
  };

  // Removed generateSelection - not used

  // Removed generateOutcomeType - not used

  // BITR Token approval function (commented out as not currently used)
  // const approveBitrTokens = async (amount: string) => {
  //   if (!address) return false;
  //   
  //   try {
  //     // Use the BITR token hook for approval
  //     await token.approve(CONTRACTS.POOL_CORE.address, amount); // Updated to use POOL_CORE
  //     return true;
  //   } catch (error) {
  //     console.error('BITR approval error:', error);
  //     // Error will be handled by the useEffect hook monitoring token.error
  //     return false;
  //   }
  // };

  const handleCreateMarket = async () => {
    console.log('Create Market button clicked');
    console.log('Address:', address);
    console.log('Is connected:', isConnected);
    console.log('Step validation:', validateStep(2));
    console.log('Data:', data);
    
    // Check wallet connection using AppKit
    if (!isConnected || !address) {
      showError('Wallet Not Connected', 'Please connect your wallet to create markets');
      try {
        await connectWallet();
      return;
      } catch {
        showError('Connection Failed', 'Failed to connect wallet. Please try again.');
      return;
      }
    }
    
    if (!validateStep(2)) {
      showError('Validation Error', 'Please fix the validation errors before proceeding');
      return;
    }

    // Check if prediction outcome is selected
    if (!data.predictionOutcome) {
      showError('Prediction Required', 'Please select your prediction (YES or NO)');
      return;
    }

    // Log reputation for debugging (reputation check is OK for new users with default 40 points)
    console.log('🔍 User reputation status:', {
      score: reputationCheck.score,
      canCreateGuided: reputationCheck.canCreateGuided,
      canCreateOpen: reputationCheck.canCreateOpen,
      canPropose: reputationCheck.canPropose,
    });

    setIsLoading(true);

    try {
      const predictedOutcome = generatePredictedOutcome();
      
      // Use direct contract call for football markets
      if (data.category === 'football' && data.selectedFixture) {
        console.log('Creating football market via direct contract call');
        
        // Prepare contract call data with proper validation
        const now = new Date();
        const matchDate = new Date(data.selectedFixture.matchDate);
        
        // Ensure event starts at least 120 seconds from now (bettingGracePeriod + buffer for block time)
        const minStartTime = new Date(now.getTime() + 120 * 1000); // 120 seconds from now (60s grace + 60s buffer)
        const eventStartTime = matchDate > minStartTime ? matchDate : minStartTime;
        const eventEndTime = new Date(eventStartTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours after start
        
        // Validate minimum stake requirements
        const minStakeBITR = parseUnits("1000", 18); // 1000 BITR minimum
        const minStakeSTT = parseUnits("5", 18); // 5 STT minimum
        const creatorStake = parseUnits(data.creatorStake.toString(), 18);
        
        if (useBitr && creatorStake < minStakeBITR) {
          throw new Error(`Minimum stake for BITR pools is 1000 BITR. You provided ${data.creatorStake} BITR.`);
        }
        if (!useBitr && creatorStake < minStakeSTT) {
          throw new Error(`Minimum stake for STT pools is 5 STT. You provided ${data.creatorStake} STT.`);
        }
        
        // Validate odds (stored as basis points: 101-10000)
        const oddsBasisPoints = typeof data.odds === 'number' ? data.odds : parseFloat(String(data.odds));
        if (oddsBasisPoints < 101 || oddsBasisPoints > 10000) {
          throw new Error(`Odds must be between 1.01x and 100x (101-10000 basis points). You provided ${oddsBasisPoints}.`);
        }
        
        const poolData = {
          predictedOutcome: predictedOutcome,
          odds: BigInt(oddsBasisPoints), // Already in basis points
          creatorStake: creatorStake,
          eventStartTime: BigInt(Math.floor(eventStartTime.getTime() / 1000)),
          eventEndTime: BigInt(Math.floor(eventEndTime.getTime() / 1000)),
          league: data.selectedFixture.league.name,
          category: 'football',
          isPrivate: data.isPrivate || false,
          maxBetPerUser: data.maxBetPerUser ? parseUnits(data.maxBetPerUser.toString(), 18) : BigInt(0),
          useBitr: useBitr,
          oracleType: 0, // GUIDED
          marketId: data.selectedFixture.id.toString(), // 🎯 SportMonks fixture ID
          marketType: data.marketType || 0, // Use selected market type or default to MONEYLINE
          homeTeam: data.selectedFixture.homeTeam.name,
          awayTeam: data.selectedFixture.awayTeam.name,
          title: `${data.selectedFixture.homeTeam.name} vs ${data.selectedFixture.awayTeam.name}`,
          boostTier: data.boostTier || 'NONE' // ✅ FIX: Pass boost tier to createPool
        };

        console.log('🔍 Pool Creation Debug:', {
          selectedMarketType: data.marketType,
          finalMarketType: poolData.marketType,
          outcome: data.outcome,
          predictionOutcome: data.predictionOutcome
        });
        console.log('Pool data for direct contract call:', poolData);
        console.log('🔍 Timing validation:', {
          eventStartTime: new Date(Number(poolData.eventStartTime) * 1000).toISOString(),
          eventEndTime: new Date(Number(poolData.eventEndTime) * 1000).toISOString(),
          now: new Date().toISOString(),
          timeDiff: Number(poolData.eventStartTime) - Math.floor(Date.now() / 1000),
          gracePeriod: 60,
          meetsGracePeriod: Number(poolData.eventStartTime) > Math.floor(Date.now() / 1000) + 60
        });
        console.log('🔍 Stake validation:', {
          creatorStake: poolData.creatorStake.toString(),
          minRequired: useBitr ? '1000000000000000000000' : '5000000000000000000',
          meetsMinimum: useBitr ? poolData.creatorStake >= BigInt('1000000000000000000000') : poolData.creatorStake >= BigInt('5000000000000000000')
        });
        
        showInfo('Creating Market', 'Preparing market creation transaction...');
        
        // Use direct contract call
        const txHash = await createPool(poolData);
        
        if (txHash) {
          // Calculate total cost for display
          const creationFee = useBitr ? '70 BITR' : '1 STT'; // ✅ FIX: Contract uses 70 BITR, not 50
        // ✅ FIX: Boost cost is always in STT (not BITR), regardless of pool currency
        const boostCost = data.boostTier && data.boostTier !== 'NONE' 
          ? `${data.boostTier === 'BRONZE' ? '2' : data.boostTier === 'SILVER' ? '3' : '5'} STT`
          : '0';
          const totalCost = data.boostTier && data.boostTier !== 'NONE' 
            ? `${boostCost} + ${creationFee}`
            : creationFee;

          showSuccess(
            'Market Created Successfully!', 
            'Your football prediction market has been created and is now live on the blockchain!', 
            txHash,
            data.boostTier,
            totalCost
          );
          
          // Add reputation for market creation
          if (address) {
            addReputationAction(address, {
              type: 'market_created',
              points: 10,
              description: 'Created a football prediction market'
            });
          }
          
          // Reset form and go to success step
          setStep(3);
        } else {
          showError('Market Creation Failed', 'Failed to create football market');
        }

      } else if (data.category === 'cryptocurrency' && data.selectedCrypto) {
        // Use direct contract call for crypto markets (same as football)
        console.log('Creating crypto market via direct contract call');
        
        // Calculate event times based on timeframe with proper validation
        const now = new Date();
        const hours = getTimeframeHours(data.timeframe || '1d');
        
        // Ensure event starts at least 120 seconds from now (bettingGracePeriod + buffer for block time)
        const minStartTime = new Date(now.getTime() + 120 * 1000); // 120 seconds from now (60s grace + 60s buffer)
        const defaultStartTime = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour from now (default)
        const eventStartTime = defaultStartTime > minStartTime ? defaultStartTime : minStartTime;
        const eventEndTime = new Date(eventStartTime.getTime() + (hours * 60 * 60 * 1000)); // Event Start + Timeframe
        
        // Validate minimum stake requirements
        const minStakeBITR = parseUnits("1000", 18); // 1000 BITR minimum
        const minStakeSTT = parseUnits("5", 18); // 5 STT minimum
        const creatorStake = parseUnits(data.creatorStake.toString(), 18);
        
        if (useBitr && creatorStake < minStakeBITR) {
          throw new Error(`Minimum stake for BITR pools is 1000 BITR. You provided ${data.creatorStake} BITR.`);
        }
        if (!useBitr && creatorStake < minStakeSTT) {
          throw new Error(`Minimum stake for STT pools is 5 STT. You provided ${data.creatorStake} STT.`);
        }
        
        // Validate odds (stored as basis points: 101-10000)
        const oddsBasisPoints = typeof data.odds === 'number' ? data.odds : parseFloat(String(data.odds));
        if (oddsBasisPoints < 101 || oddsBasisPoints > 10000) {
          throw new Error(`Odds must be between 1.01x and 100x (101-10000 basis points). You provided ${oddsBasisPoints}.`);
        }
        
        // Generate marketId hash for crypto market
        const marketIdString = `${data.selectedCrypto.symbol.toLowerCase()}_${data.targetPrice}_${getDateString()}`;
        const marketIdHash = keccak256(toHex(marketIdString));
        
        const poolData = {
          predictedOutcome: predictedOutcome,
          odds: BigInt(oddsBasisPoints), // Already in basis points
          creatorStake: creatorStake,
          eventStartTime: BigInt(Math.floor(eventStartTime.getTime() / 1000)),
          eventEndTime: BigInt(Math.floor(eventEndTime.getTime() / 1000)),
          league: 'crypto',
          category: 'cryptocurrency',
          isPrivate: data.isPrivate || false,
          maxBetPerUser: data.maxBetPerUser ? parseUnits(data.maxBetPerUser.toString(), 18) : BigInt(0),
          useBitr: useBitr,
          oracleType: 0, // GUIDED
          marketId: marketIdHash, // Use keccak256 hash for crypto markets
          marketType: 0, // MONEYLINE for crypto price direction
          homeTeam: data.selectedCrypto.symbol,
          awayTeam: 'USD',
          title: `${data.selectedCrypto.symbol} Price Prediction`,
          boostTier: data.boostTier || 'NONE' // ✅ FIX: Pass boost tier to createPool
        };

        console.log('🔍 Crypto Pool Creation Debug:', {
          cryptoAsset: data.selectedCrypto.symbol,
          targetPrice: data.targetPrice,
          direction: data.direction,
          timeframe: data.timeframe,
          predictedOutcome: predictedOutcome
        });
        console.log('Crypto pool data for direct contract call:', poolData);
        
        showInfo('Creating Market', 'Preparing crypto market creation transaction...');
        
        // Use direct contract call
        const txHash = await createPool(poolData);
        
        if (txHash) {
        // Calculate total cost for display
        const creationFee = useBitr ? '50 BITR' : '1 STT';
        // ✅ FIX: Boost cost is always in STT (not BITR), regardless of pool currency
        const boostCost = data.boostTier && data.boostTier !== 'NONE' 
          ? `${data.boostTier === 'BRONZE' ? '2' : data.boostTier === 'SILVER' ? '3' : '5'} STT`
          : '0';
        const totalCost = data.boostTier && data.boostTier !== 'NONE' 
          ? `${boostCost} + ${creationFee}`
          : creationFee;

        showSuccess(
          'Market Created Successfully!', 
          'Your cryptocurrency prediction market has been created and is now live on the blockchain!', 
            txHash,
          data.boostTier,
          totalCost
        );
        
        // Add reputation for market creation
        if (address) {
          addReputationAction(address, {
            type: 'market_created',
            points: 10,
            description: 'Created a cryptocurrency prediction market'
          });
          }
          
          // Reset form and go to success step
          setStep(3);
        } else {
          showError('Market Creation Failed', 'Failed to create crypto market');
        }

      } else {
        showError('Invalid Category', 'Please select a valid market category');
        setIsLoading(false);
        return;
      }
      
      // Reset form data for next market creation
      try {
        setData({
          category: '',
          odds: 200,
          creatorStake: 20,
          description: ''
        });
        setStep(1);
      } catch (error) {
        console.error('Error resetting form data:', error);
        setStep(1);
      }

    } catch (error) {
      console.error('Error in market creation:', error);
      showError('Creation Error', 'Failed to create market. Please try again.');
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
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => handleInputChange('category', 'football')}
            className={`
              p-6 rounded-2xl border-2 text-left transition-all duration-300
              bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm
              hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10
              ${data.category === 'football'
                ? 'border-cyan-500 bg-cyan-500/5 ring-2 ring-cyan-500/20'
                : 'border-gray-700/50 hover:bg-gray-800/50'
              }
            `}
          >
            <div className="text-3xl mb-3">⚽</div>
            <h4 className="text-lg font-semibold text-white mb-2">Football Matches</h4>
            <p className="text-gray-400 text-sm">
              Create predictions on real upcoming football matches with live odds from SportMonks
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => handleInputChange('category', 'cryptocurrency')}
            className={`
              p-6 rounded-2xl border-2 text-left transition-all duration-300
              bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm
              hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10
              ${data.category === 'cryptocurrency'
                ? 'border-cyan-500 bg-cyan-500/5 ring-2 ring-cyan-500/20'
                : 'border-gray-700/50 hover:bg-gray-800/50'
              }
            `}
          >
            <div className="text-3xl mb-3">₿</div>
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
                onMarketSelect={handleMarketSelect}
                selectedFixture={data.selectedFixture as Fixture}
              />
            </>
          )}
          {errors.selectedFixture && (
            <p className="text-red-400 text-sm mt-2">{errors.selectedFixture}</p>
          )}


        </div>
      )}

      {/* Cryptocurrency Selection */}
      {data.category === 'cryptocurrency' && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Select Cryptocurrency</h4>
          
          <div className="relative mb-6">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search cryptocurrencies (500+ available)..."
              value={cryptoSearchQuery}
              onChange={(e) => setCryptoSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3">
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
                whileTap={{ scale: 0.99 }}
                onClick={() => handleInputChange('selectedCrypto', crypto)}
                className={`
                  w-full p-6 rounded-2xl border text-left transition-all duration-300
                  bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm
                  hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10
                  ${data.selectedCrypto?.id === crypto.id
                    ? 'ring-2 ring-cyan-500 bg-cyan-500/5 border-cyan-500/50'
                    : 'border-gray-700/50 hover:bg-gray-800/50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 relative rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                      {crypto.logo && crypto.logo.startsWith('http') ? (
                        <Image
                          src={crypto.logo}
                          alt={crypto.symbol}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-sm">
                          {crypto.symbol.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white text-base">{crypto.symbol}</div>
                      <div className="text-sm text-gray-400 truncate">{crypto.name}</div>
                      {crypto.rank && (
                        <div className="text-xs text-gray-500 mt-1">Rank: #{crypto.rank}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white text-lg">${crypto.currentPrice.toLocaleString()}</div>
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
          
          {/* Boost Tier Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
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
              <div className="text-xs mt-1">5 {useBitr ? 'BITR' : 'STT'}</div>
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
              <div className="text-xs mt-1">10 {useBitr ? 'BITR' : 'STT'}</div>
            </motion.button>
          </div>

          {/* Boost Cost Preview */}
          {data.boostTier && data.boostTier !== 'NONE' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Boost Cost Preview
                  </h4>
                  <p className="text-xs text-gray-400">
                    {data.boostTier === 'BRONZE' && '🥉 Bronze Boost - Enhanced visibility'}
                    {data.boostTier === 'SILVER' && '🥈 Silver Boost - Premium placement'}
                    {data.boostTier === 'GOLD' && '🥇 Gold Boost - Maximum exposure'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {data.boostTier === 'BRONZE' && '2'}
                    {data.boostTier === 'SILVER' && '3'}
                    {data.boostTier === 'GOLD' && '5'}
                    <span className="text-sm text-gray-400 ml-1">
                      STT {/* ✅ FIX: Boost is always paid in STT, not BITR */}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    + Creation Fee
                  </div>
                </div>
              </div>
            </motion.div>
          )}
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
                  <span className="text-white font-semibold">
                    {data.outcome === 'home' && `Full Time 1X2 - ${data.selectedFixture.homeTeam.name} WIN`}
                    {data.outcome === 'away' && `Full Time 1X2 - ${data.selectedFixture.awayTeam.name} WIN`}
                    {data.outcome === 'draw' && 'Full Time 1X2 - DRAW'}
                    {data.outcome === 'over15' && 'Over/Under - OVER 1.5 GOALS'}
                    {data.outcome === 'under15' && 'Over/Under - UNDER 1.5 GOALS'}
                    {data.outcome === 'over25' && 'Over/Under - OVER 2.5 GOALS'}
                    {data.outcome === 'under25' && 'Over/Under - UNDER 2.5 GOALS'}
                    {data.outcome === 'over35' && 'Over/Under - OVER 3.5 GOALS'}
                    {data.outcome === 'under35' && 'Over/Under - UNDER 3.5 GOALS'}
                    {data.outcome === 'bttsYes' && 'Both Teams Score - YES'}
                    {data.outcome === 'bttsNo' && 'Both Teams Score - NO'}
                    {data.outcome === 'htHome' && `Half Time - ${data.selectedFixture.homeTeam.name} LEADING`}
                    {data.outcome === 'htDraw' && 'Half Time - DRAW'}
                    {data.outcome === 'htAway' && `Half Time - ${data.selectedFixture.awayTeam.name} LEADING`}
                    {data.outcome === 'ht_over_05' && 'Half Time - OVER 0.5 GOALS'}
                    {data.outcome === 'ht_under_05' && 'Half Time - UNDER 0.5 GOALS'}
                    {data.outcome === 'ht_over_15' && 'Half Time - OVER 1.5 GOALS'}
                    {data.outcome === 'ht_under_15' && 'Half Time - UNDER 1.5 GOALS'}
                  </span>
                </div>
              )}
              {data.outcome && data.selectedFixture?.odds && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-gray-300">Market Odds:</span>
                  <span className="text-cyan-400 font-semibold">
                    {(() => {
                      const odds = data.selectedFixture.odds;
                      switch (data.outcome) {
                        case 'home': return odds.home ? `${odds.home.toFixed(2)}x` : 'N/A';
                        case 'away': return odds.away ? `${odds.away.toFixed(2)}x` : 'N/A';
                        case 'draw': return odds.draw ? `${odds.draw.toFixed(2)}x` : 'N/A';
                        case 'over15': return odds.over15 ? `${odds.over15.toFixed(2)}x` : 'N/A';
                        case 'under15': return odds.under15 ? `${odds.under15.toFixed(2)}x` : 'N/A';
                        case 'over25': return odds.over25 ? `${odds.over25.toFixed(2)}x` : 'N/A';
                        case 'under25': return odds.under25 ? `${odds.under25.toFixed(2)}x` : 'N/A';
                        case 'over35': return odds.over35 ? `${odds.over35.toFixed(2)}x` : 'N/A';
                        case 'under35': return odds.under35 ? `${odds.under35.toFixed(2)}x` : 'N/A';
                        case 'bttsYes': return odds.bttsYes ? `${odds.bttsYes.toFixed(2)}x` : 'N/A';
                        case 'bttsNo': return odds.bttsNo ? `${odds.bttsNo.toFixed(2)}x` : 'N/A';
                        case 'htHome': return odds.htHome ? `${odds.htHome.toFixed(2)}x` : 'N/A';
                        case 'htDraw': return odds.htDraw ? `${odds.htDraw.toFixed(2)}x` : 'N/A';
                        case 'htAway': return odds.htAway ? `${odds.htAway.toFixed(2)}x` : 'N/A';
                        default: return 'N/A';
                      }
                    })()}
                  </span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Your Position:</span>
                <span className="text-green-400 font-semibold">
                  {data.predictionOutcome === 'yes' ? 'YES - Challenge Supporters' : 'NO - Challenge Doubters'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-300">Odds:</span>
                <span className="text-white font-semibold">{(data.odds / 100).toFixed(2)}x</span>
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
            href={`https://shannon-explorer.somnia.network/tx/${deploymentHash}`}
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
          
          {/* Cost Summary */}
          <div className="mb-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
            <h5 className="text-sm font-semibold text-white mb-2">Cost Breakdown</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Creation Fee:</span>
                <span className="text-white">{useBitr ? '50 BITR' : '1 STT'}</span>
              </div>
              {data.boostTier && data.boostTier !== 'NONE' && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Boost Fee ({data.boostTier}):</span>
                  <span className="text-white">
                    {data.boostTier === 'BRONZE' ? '2' : data.boostTier === 'SILVER' ? '3' : '5'} STT
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-600 pt-1">
                <span className="text-gray-300 font-semibold">Total Cost:</span>
                <span className="text-white font-bold">
                  {data.boostTier && data.boostTier !== 'NONE' 
                    ? `${(() => {
                        const boostAmount = data.boostTier === 'BRONZE' ? 2 : data.boostTier === 'SILVER' ? 3 : 5;
                        const creationAmount = useBitr ? 70 : 1;
                        const total = boostAmount + creationAmount;
                        return `${boostAmount} STT + ${creationAmount} ${useBitr ? 'BITR' : 'STT'} = ${useBitr ? `${creationAmount} BITR + ${boostAmount} STT` : `${total} STT`}`;
                      })()}`
                    : `${useBitr ? '70 BITR' : '1 STT'}`}
                </span>
              </div>
            </div>
          </div>
          
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
            disabled={isLoading || isPending || isConfirming || isConnecting}
            loading={isLoading || isPending || isConfirming || isConnecting}
            className="min-w-[200px] w-full sm:w-auto"
          >
            {isConnecting ? 'Connecting Wallet...' : isConfirming ? 'Confirming...' : 'Deploy Market'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="text-center py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <SparklesIcon className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-text-secondary mb-8">
              Connect your wallet to start creating prediction markets and earning rewards.
            </p>
            <Button onClick={connectWallet} variant="primary" size="lg">
              Connect Wallet
            </Button>
          </motion.div>
        </div>
      );
    }

    if (!canCreate) {
      return (
        <div className="text-center py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <ShieldCheckIcon className="h-12 w-12 text-error mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">Insufficient Reputation</h2>
            <p className="text-text-secondary mb-6">
              You need higher reputation to create prediction markets. Participate in existing markets to build your reputation.
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
              onClick={() => router.push('/markets')}
              variant="primary"
            >
              Browse Markets
            </Button>
          </motion.div>
        </div>
      );
    }

    if (!selectedType) {
      return (
        <MarketTypeSelector
          selectedType={selectedType}
          onSelectType={handleTypeSelect}
        />
      );
    }

    if (selectedType === 'guided') {
      return (
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNumber 
                    ? 'bg-primary text-white' 
                    : 'bg-bg-card text-text-muted'
                }`}>
                  {isSuccess && stepNumber === 3 ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 3 && (
                  <div className={`h-1 w-16 ${
                    step > stepNumber ? 'bg-primary' : 'bg-bg-card'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Guided Market Creation Form */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-8 border border-border-card"
          >
            {step === 1 && renderCategorySelection()}
            {step === 2 && renderMarketDetails()}
            {step === 3 && !isSuccess && renderDeploy()}
            {step === 3 && isSuccess && renderSuccess()}
          </motion.div>

          {/* Navigation */}
          {step < 3 && !isSuccess && (
            <div className="flex justify-between">
              <Button
                onClick={handlePrevStep}
                variant="outline"
                disabled={step === 1}
              >
                Previous
              </Button>
              
              <Button
                onClick={handleNextStep}
                variant="primary"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (selectedType === 'combo') {
      return (
        <EnhancedComboPoolCreationForm
          onSuccess={handleSuccess}
          onClose={handleClose}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-main">
      {/* Transaction Feedback */}
      <TransactionFeedback
        status={transactionStatus}
        onClose={clearStatus}
        autoClose={true}
        autoCloseDelay={5000}
      />
      
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-md bg-bg-main/80 border-b border-border-card"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleBack}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back
              </Button>
              
              {selectedType && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    {selectedType === 'guided' ? (
                      <ChartBarIcon className="h-4 w-4 text-white" />
                    ) : (
                      <CubeIcon className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-text-primary">
                      {selectedType === 'guided' ? 'Guided Single Pool' : 'Combo Pool'}
                    </h1>
                    <p className="text-sm text-text-muted">
                      {selectedType === 'guided' 
                        ? 'Create with real-time data integration' 
                        : 'Combine multiple predictions for higher rewards'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <XMarkIcon className="h-4 w-4" />
              Close
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {!selectedType && (
            <motion.div
              key="type-selector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-12"
            >
              <AnimatedTitle>Create Prediction Market</AnimatedTitle>
              <p className="text-xl text-text-secondary mt-4 max-w-3xl mx-auto">
                Choose your market type and start creating prediction pools. 
                Each type offers different risk levels and reward potential.
              </p>
              
              {userReputation && (
                <div className="mt-6 flex justify-center">
                  <ReputationBadge 
                    reputation={userReputation}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedType || 'type-selector'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>
    </div>
  );
}

export default function CreateMarketPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>}>
      <CreateMarketPageContent />
    </Suspense>
  );
}
