export interface FaucetClaim {
  hasClaimed: boolean;
  amount?: string;
  claimedAt?: string;
  hadPriorSTTActivity: boolean;
  sttActivityCountBeforeFaucet: number;
}

export interface AirdropRequirements {
  faucetClaim: boolean;
  poolsCreated?: {
    current: number;
    required: number;
    met: boolean;
  };
  poolsParticipated?: {
    current: number;
    required: number;
    met: boolean;
  };
  stakingActivity: boolean;
  oddysseySlips: {
    current: number;
    required: number;
    met: boolean;
  };
}

export interface SybilFlags {
  suspiciousTransfers: boolean;
  transferOnlyRecipient: boolean;
  consolidationDetected: boolean;
  hasSybilActivity: boolean;
}

export interface ActivityBreakdown {
  poolsCreated?: number;
  poolsParticipated?: number;
  poolCreations: number;
  betsPlaced: number;
  stakingActions: number;
  oddysseySlips?: number;
  firstBITRActivity?: string;
  lastBITRActivity?: string;
}

export interface AirdropInfo {
  snapshotBalance?: string;
  airdropAmount?: string;
  snapshotTakenAt?: string;
}

export interface UserEligibility {
  address: string;
  isEligible: boolean;
  eligibilityStatus: 'eligible' | 'not_eligible' | 'pending_calculation' | 'no_faucet_claim';
  lastUpdated?: string;
  faucetClaim: FaucetClaim;
  requirements: AirdropRequirements;
  sybilFlags: SybilFlags;
  activityBreakdown: ActivityBreakdown;
  airdropInfo?: AirdropInfo | null;
  nextSteps: string[];
}

export interface AirdropStatistics {
  overview: {
    totalFaucetClaims: number;
    totalEligible: number;
    eligibilityRate: number;
    totalEligibleBITR: string;
    totalAirdropAllocated: string;
    suspiciousWallets: number;
    averageBITRActions: string;
    averageOddysseySlips: string;
  };
  requirementFunnel: {
    claimedFaucet: number;
    sufficientPoolsCreated: number;
    sufficientPoolsParticipated: number;
    hasStaking: number;
    sufficientOddyssey: number;
    fullyEligible: number;
  };
  recentActivity: Array<{
    claim_date: string;
    claims_count: number;
  }>;
  latestSnapshot?: {
    name: string;
    blockNumber: number;
    timestamp: string;
    eligibleWallets: number;
    totalEligibleBITR: string;
    isFinal: boolean;
  } | null;
  constants: {
    totalAirdropPool: string;
    faucetAmountPerUser: string;
    requirements: {
      faucetClaim: boolean;
      minPoolsCreated: number;
      minPoolsParticipated: number;
      stakingRequired: boolean;
      minOddysseySlips: number;
    };
  };
}

export interface FaucetClaimRequest {
  userAddress: string;
  signature?: string; // For verification if needed
}

export interface FaucetClaimResponse {
  success: boolean;
  transactionHash?: string;
  message: string;
  error?: string;
} 