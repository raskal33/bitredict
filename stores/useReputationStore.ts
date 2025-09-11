import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ReputationAction {
  id: string;
  type: 'correct_outcome' | 'incorrect_outcome' | 'successful_challenge' | 'failed_challenge' | 'market_created' | 'faulty_market' | 'won_bet';
  points: number;
  description: string;
  timestamp: string;
  marketId?: string;
}

export interface UserReputation {
  address: string;
  score: number;
  level: 'Limited' | 'Elementary' | 'Trusted' | 'Verified';
  actions: ReputationAction[];
  totalOutcomeProposals: number;
  correctOutcomeProposals: number;
  totalChallenges: number;
  successfulChallenges: number;
  marketsCreated: number;
  wonBets: number;
}

interface ReputationState {
  userReputations: Record<string, UserReputation>;
  
  // Actions
  initializeUser: (address: string) => void;
  addReputationAction: (address: string, action: Omit<ReputationAction, 'id' | 'timestamp'>) => void;
  getUserReputation: (address: string) => UserReputation;
  getReputationLevel: (score: number) => 'Limited' | 'Elementary' | 'Trusted' | 'Verified';
  canCreateMarket: (address: string) => boolean;
  canCreateOpenMarket: (address: string) => boolean;
  canProposeOutcome: (address: string) => boolean;
  getAccessCapabilities: (address: string) => string[];
}

const getReputationLevel = (score: number): 'Limited' | 'Elementary' | 'Trusted' | 'Verified' => {
  if (score < 40) return 'Limited';
  if (score < 100) return 'Elementary';
  if (score < 150) return 'Trusted';
  return 'Verified';
};

const defaultUserReputation = (address: string): UserReputation => ({
  address,
  score: 40, // Default score as specified
  level: 'Elementary',
  actions: [],
  totalOutcomeProposals: 0,
  correctOutcomeProposals: 0,
  totalChallenges: 0,
  successfulChallenges: 0,
  marketsCreated: 0,
  wonBets: 0,
});

export const useReputationStore = create<ReputationState>()(
  persist(
    (set, get) => ({
      userReputations: {},

      initializeUser: (address: string) => {
        const normalizedAddress = address.toLowerCase();
        const state = get();
        
        if (!state.userReputations[normalizedAddress]) {
          set((state) => ({
            userReputations: {
              ...state.userReputations,
              [normalizedAddress]: defaultUserReputation(normalizedAddress),
            },
          }));
        }
      },

      addReputationAction: (address: string, actionData: Omit<ReputationAction, 'id' | 'timestamp'>) => {
        const normalizedAddress = address.toLowerCase();
        const state = get();
        
        // Initialize user if not exists
        if (!state.userReputations[normalizedAddress]) {
          get().initializeUser(normalizedAddress);
        }

        const action: ReputationAction = {
          ...actionData,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        };

        set((state) => {
          const userRep = state.userReputations[normalizedAddress];
          const newScore = Math.max(0, Math.min(200, userRep.score + action.points)); // Cap between 0-200
          const newLevel = getReputationLevel(newScore);

          // Update specific counters based on action type
          let updates: Partial<UserReputation> = {};
          switch (action.type) {
            case 'correct_outcome':
              updates = { 
                totalOutcomeProposals: userRep.totalOutcomeProposals + 1,
                correctOutcomeProposals: userRep.correctOutcomeProposals + 1
              };
              break;
            case 'incorrect_outcome':
              updates = { 
                totalOutcomeProposals: userRep.totalOutcomeProposals + 1
              };
              break;
            case 'successful_challenge':
              updates = { 
                totalChallenges: userRep.totalChallenges + 1,
                successfulChallenges: userRep.successfulChallenges + 1
              };
              break;
            case 'failed_challenge':
              updates = { 
                totalChallenges: userRep.totalChallenges + 1
              };
              break;
            case 'market_created':
              updates = { 
                marketsCreated: userRep.marketsCreated + 1
              };
              break;
            case 'won_bet':
              updates = { 
                wonBets: userRep.wonBets + 1
              };
              break;
          }

          return {
            userReputations: {
              ...state.userReputations,
              [normalizedAddress]: {
                ...userRep,
                ...updates,
                score: newScore,
                level: newLevel,
                actions: [...userRep.actions, action],
              },
            },
          };
        });
      },

      getUserReputation: (address: string) => {
        const normalizedAddress = address.toLowerCase();
        const state = get();
        
        if (!state.userReputations[normalizedAddress]) {
          get().initializeUser(normalizedAddress);
          return get().userReputations[normalizedAddress];
        }
        
        return state.userReputations[normalizedAddress];
      },

      getReputationLevel,

      canCreateMarket: (address: string) => {
        const userRep = get().getUserReputation(address);
        return userRep.score >= 40;
      },

      canCreateOpenMarket: (address: string) => {
        const userRep = get().getUserReputation(address);
        return userRep.score >= 150;
      },

      canProposeOutcome: (address: string) => {
        const userRep = get().getUserReputation(address);
        return userRep.score >= 100;
      },

      getAccessCapabilities: (address: string) => {
        const userRep = get().getUserReputation(address);
        const capabilities: string[] = [];

        if (userRep.score >= 0) {
          capabilities.push('Place bets');
        }
        if (userRep.score >= 40) {
          capabilities.push('Create guided markets');
        }
        if (userRep.score >= 100) {
          capabilities.push('Propose outcomes in open markets');
        }
        if (userRep.score >= 150) {
          capabilities.push('Create & resolve open markets');
        }

        return capabilities;
      },
    }),
    {
      name: 'bitr-reputation',
      partialize: (state) => ({ 
        userReputations: state.userReputations 
      }),
    }
  )
); 