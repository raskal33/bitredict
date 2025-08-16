import { CONTRACT_ADDRESSES } from '@/config/wagmi';

// Import ABIs
import BitredictTokenABI from './abis/BitredictToken.json';
import BitrFaucetABI from './abis/BitrFaucet.json';
import GuidedOracleABI from './abis/GuidedOracle.json';
import BitredictPoolABI from './abis/BitredictPool.json';
import BitredictStakingABI from './abis/BitredictStaking.json';
import OddysseyABI from './abis/Oddyssey.json';

// Contract configurations
export const CONTRACTS = {
  BITR_TOKEN: {
    address: CONTRACT_ADDRESSES.BITR_TOKEN,
    abi: BitredictTokenABI.abi,
  },
  FAUCET: {
    address: CONTRACT_ADDRESSES.FAUCET,
    abi: BitrFaucetABI.abi,
  },
  GUIDED_ORACLE: {
    address: CONTRACT_ADDRESSES.GUIDED_ORACLE,
    abi: GuidedOracleABI.abi,
  },
  BITREDICT_POOL: {
    address: CONTRACT_ADDRESSES.BITREDICT_POOL,
    abi: BitredictPoolABI.abi,
  },
  BITREDICT_STAKING: {
    address: CONTRACT_ADDRESSES.BITREDICT_STAKING,
    abi: BitredictStakingABI.abi,
  },
  ODDYSSEY: {
    address: CONTRACT_ADDRESSES.ODDYSSEY,
    abi: OddysseyABI,
  },
} as const;

// Export ABIs for direct use
export {
  BitredictTokenABI,
  BitrFaucetABI,
  GuidedOracleABI,
  BitredictPoolABI,
  BitredictStakingABI,
  OddysseyABI,
};

// Contract events
export const CONTRACT_EVENTS = {
  BITR_TOKEN: {
    TRANSFER: 'Transfer',
    APPROVAL: 'Approval',
  },
  FAUCET: {
    FAUCET_CLAIMED: 'FaucetClaimed',
    COOLDOWN_SET: 'CooldownSet',
  },
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
  ODDYSSEY: {
    SLIP_PURCHASED: 'SlipPurchased',
    GAME_SETTLED: 'GameSettled',
    WINNINGS_CLAIMED: 'WinningsClaimed',
  },
} as const;
