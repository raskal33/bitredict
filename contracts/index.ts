import { CONTRACT_ADDRESSES } from '@/config/wagmi';

// Import ABIs - Updated for Modular Architecture
import BitredictTokenABI from './abis/BitredictToken.json';
import BitrFaucetABI from './abis/BitrFaucet.json';
import GuidedOracleABI from './abis/GuidedOracle.json';
import OptimisticOracleABI from './abis/OptimisticOracle.json';
import BitredictPoolABI from './abis/BitredictPool.json';
import BitredictPoolCoreABI from './abis/BitredictPoolCore.json';
import BitredictBoostSystemABI from './abis/BitredictBoostSystem.json';
import BitredictComboPoolsABI from './abis/BitredictComboPools.json';
import BitredictPoolFactoryABI from './abis/BitredictPoolFactory.json';
import BitredictStakingABI from './abis/BitredictStaking.json';
import ReputationSystemABI from './abis/ReputationSystem.json';
import OddysseyABI from './abis/Oddyssey.json';

// Contract configurations - Updated for Modular Architecture
export const CONTRACTS = {
  // Core Contracts
  BITR_TOKEN: {
    address: CONTRACT_ADDRESSES.BITR_TOKEN,
    abi: BitredictTokenABI.abi,
  },
  POOL_CORE: {
    address: CONTRACT_ADDRESSES.POOL_CORE,
    abi: BitredictPoolCoreABI,
  },
  BOOST_SYSTEM: {
    address: CONTRACT_ADDRESSES.BOOST_SYSTEM,
    abi: BitredictBoostSystemABI.abi,
  },
  COMBO_POOLS: {
    address: CONTRACT_ADDRESSES.COMBO_POOLS,
    abi: BitredictComboPoolsABI,
  },
  FACTORY: {
    address: CONTRACT_ADDRESSES.FACTORY,
    abi: BitredictPoolFactoryABI,
  },
  
  // Oracle Contracts
  GUIDED_ORACLE: {
    address: CONTRACT_ADDRESSES.GUIDED_ORACLE,
    abi: GuidedOracleABI.abi,
  },
  OPTIMISTIC_ORACLE: {
    address: CONTRACT_ADDRESSES.OPTIMISTIC_ORACLE,
    abi: OptimisticOracleABI.abi,
  },
  
  // System Contracts
  REPUTATION_SYSTEM: {
    address: CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
    abi: ReputationSystemABI.abi,
  },
  STAKING_CONTRACT: {
    address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
    abi: BitredictStakingABI.abi,
  },
  FAUCET: {
    address: CONTRACT_ADDRESSES.FAUCET,
    abi: BitrFaucetABI.abi,
  },
  ODDYSSEY: {
    address: CONTRACT_ADDRESSES.ODDYSSEY,
    abi: OddysseyABI.abi,
  },
  
  // Legacy support (for backward compatibility)
  BITREDICT_POOL: {
    address: CONTRACT_ADDRESSES.BITREDICT_POOL,
    abi: BitredictPoolABI.abi,
  },
  BITREDICT_STAKING: {
    address: CONTRACT_ADDRESSES.BITREDICT_STAKING,
    abi: BitredictStakingABI.abi,
  },
} as const;

// Export contract addresses and ABIs for direct use
export { CONTRACT_ADDRESSES } from '@/config/wagmi';
export {
  BitredictTokenABI,
  BitrFaucetABI,
  GuidedOracleABI,
  OptimisticOracleABI,
  BitredictPoolABI,
  BitredictPoolCoreABI,
  BitredictBoostSystemABI,
  BitredictComboPoolsABI,
  BitredictPoolFactoryABI,
  BitredictStakingABI,
  ReputationSystemABI,
  OddysseyABI,
};

// Contract events - Updated for Modular Architecture
export const CONTRACT_EVENTS = {
  // Core Contract Events
  BITR_TOKEN: {
    TRANSFER: 'Transfer',
    APPROVAL: 'Approval',
  },
  POOL_CORE: {
    POOL_CREATED: 'PoolCreated',
    BET_PLACED: 'BetPlaced',
    POOL_SETTLED: 'PoolSettled',
    WINNINGS_CLAIMED: 'WinningsClaimed',
    REPUTATION_ACTION_OCCURRED: 'ReputationActionOccurred',
  },
  BOOST_SYSTEM: {
    POOL_BOOSTED: 'PoolBoosted',
    BOOST_EXPIRED: 'BoostExpired',
  },
  COMBO_POOLS: {
    COMBO_POOL_CREATED: 'ComboPoolCreated',
    COMBO_BET_PLACED: 'ComboBetPlaced',
    COMBO_POOL_SETTLED: 'ComboPoolSettled',
  },
  FACTORY: {
    POOL_CREATED_WITH_BOOST: 'PoolCreatedWithBoost',
    BATCH_POOLS_CREATED: 'BatchPoolsCreated',
  },
  
  // Oracle Contract Events
  GUIDED_ORACLE: {
    OUTCOME_SUBMITTED: 'OutcomeSubmitted',
    OUTCOME_UPDATED: 'OutcomeUpdated',
  },
  OPTIMISTIC_ORACLE: {
    MARKET_CREATED: 'MarketCreated',
    OUTCOME_PROPOSED: 'OutcomeProposed',
    OUTCOME_DISPUTED: 'OutcomeDisputed',
    MARKET_RESOLVED: 'MarketResolved',
  },
  
  // System Contract Events
  REPUTATION_SYSTEM: {
    REPUTATION_UPDATED: 'ReputationUpdated',
    TIER_UPGRADED: 'TierUpgraded',
    VERIFICATION_GRANTED: 'VerificationGranted',
    VERIFICATION_REVOKED: 'VerificationRevoked',
  },
  STAKING_CONTRACT: {
    STAKED: 'Staked',
    UNSTAKED: 'Unstaked',
    REWARDS_CLAIMED: 'RewardsClaimed',
    TIER_UPGRADED: 'TierUpgraded',
  },
  FAUCET: {
    FAUCET_CLAIMED: 'FaucetClaimed',
    COOLDOWN_SET: 'CooldownSet',
  },
  ODDYSSEY: {
    SLIP_PURCHASED: 'SlipPurchased',
    GAME_SETTLED: 'GameSettled',
    WINNINGS_CLAIMED: 'WinningsClaimed',
  },
  
  // Legacy events (for backward compatibility)
  BITREDICT_POOL: {
    POOL_CREATED: 'PoolCreated',
    BET_PLACED: 'BetPlaced',
    POOL_SETTLED: 'PoolSettled',
    WINNINGS_CLAIMED: 'WinningsClaimed',
  },
  BITREDICT_STAKING: {
    STAKED: 'Staked',
    UNSTAKED: 'Unstaked',
    REWARDS_CLAIMED: 'RewardsClaimed',
    TIER_UPGRADED: 'TierUpgraded',
  },
} as const;
