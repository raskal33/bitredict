import { CONTRACT_ADDRESSES } from '@/config/wagmi';

// Import ABIs - Updated for Modular Architecture
import BitredictTokenArtifact from './abis/BitredictToken.json';
import BitrFaucetArtifact from './abis/BitrFaucet.json';
import GuidedOracleArtifact from './abis/GuidedOracle.json';
import OptimisticOracleArtifact from './abis/OptimisticOracle.json';
import BitredictPoolCoreArtifact from './abis/BitredictPoolCore.json';
import BitredictBoostSystemArtifact from './abis/BitredictBoostSystem.json';
import BitredictComboPoolsArtifact from './abis/BitredictComboPools.json';
import BitredictPoolFactoryArtifact from './abis/BitredictPoolFactory.json';
import BitredictStakingArtifact from './abis/BitredictStaking.json';
import ReputationSystemArtifact from './abis/ReputationSystem.json';
import OddysseyArtifact from './abis/Oddyssey.json';

// Extract ABI arrays from artifacts
const BitredictTokenABI = BitredictTokenArtifact.abi;
const BitrFaucetABI = BitrFaucetArtifact.abi;
const GuidedOracleABI = GuidedOracleArtifact.abi;
const OptimisticOracleABI = OptimisticOracleArtifact.abi;
const BitredictPoolCoreABI = BitredictPoolCoreArtifact.abi;
const BitredictBoostSystemABI = BitredictBoostSystemArtifact.abi;
const BitredictComboPoolsABI = BitredictComboPoolsArtifact.abi;
const BitredictPoolFactoryABI = BitredictPoolFactoryArtifact.abi;
const BitredictStakingABI = BitredictStakingArtifact.abi;
const ReputationSystemABI = ReputationSystemArtifact.abi;
const OddysseyABI = OddysseyArtifact.abi;

// Contract configurations - Updated for Modular Architecture
export const CONTRACTS = {
  // Core Contracts
  BITR_TOKEN: {
    address: CONTRACT_ADDRESSES.BITR_TOKEN,
    abi: BitredictTokenABI,
  },
  POOL_CORE: {
    address: CONTRACT_ADDRESSES.POOL_CORE,
    abi: BitredictPoolCoreABI,
  },
  BOOST_SYSTEM: {
    address: CONTRACT_ADDRESSES.BOOST_SYSTEM,
    abi: BitredictBoostSystemABI,
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
    abi: GuidedOracleABI,
  },
  OPTIMISTIC_ORACLE: {
    address: CONTRACT_ADDRESSES.OPTIMISTIC_ORACLE,
    abi: OptimisticOracleABI,
  },
  
  // System Contracts
  REPUTATION_SYSTEM: {
    address: CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
    abi: ReputationSystemABI,
  },
  STAKING_CONTRACT: {
    address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
    abi: BitredictStakingABI,
  },
  FAUCET: {
    address: CONTRACT_ADDRESSES.FAUCET,
    abi: BitrFaucetABI,
  },
  ODDYSSEY: {
    address: CONTRACT_ADDRESSES.ODDYSSEY,
    abi: OddysseyABI,
  },
  
  // Legacy support (for backward compatibility) - DEPRECATED: Use POOL_CORE instead
  BITREDICT_POOL: {
    address: CONTRACT_ADDRESSES.BITREDICT_POOL, // DEPRECATED: Use POOL_CORE
    abi: BitredictPoolCoreABI, // DEPRECATED: Use POOL_CORE.abi
  },
  BITREDICT_STAKING: {
    address: CONTRACT_ADDRESSES.BITREDICT_STAKING,
    abi: BitredictStakingABI,
  },
} as const;

// Export contract addresses and ABIs for direct use
export { CONTRACT_ADDRESSES } from '@/config/wagmi';
export {
  BitredictTokenABI,
  BitrFaucetABI,
  GuidedOracleABI,
  OptimisticOracleABI,
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
