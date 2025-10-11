import { create } from "zustand";

export type CreateMarketData = {
  // Basic Information
  predictedOutcome?: string;
  title?: string;
  description?: string;
  
  // Market Configuration
  odds?: number; // 100-10000 (1.01x to 100x)
  creatorStake?: number;
  usesBitr?: boolean; // true for BITR, false for STT
  
  // Timing
  eventStartTime?: Date;
  eventEndTime?: Date;
  
  // Metadata
  league?: string;
  category?: string;
  region?: string;
  
  // Advanced Settings
  isPrivate?: boolean;
  maxBetPerUser?: number;
  whitelistAddresses?: string[];
  
  // Calculated Fields
  maxBettorStake?: number;
  creationFee?: number;
  estimatedGas?: number;
};

export type ValidationErrors = {
  predictedOutcome?: string;
  title?: string;
  odds?: string;
  creatorStake?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  category?: string;
  maxBetPerUser?: string;
  whitelistAddresses?: string;
};

type CreateMarketStore = {
  data: CreateMarketData;
  errors: ValidationErrors;
  step: number;
  isLoading: boolean;
  
  // Actions
  setData: (data: Partial<CreateMarketData>) => void;
  setErrors: (errors: Partial<ValidationErrors>) => void;
  setStep: (step: number) => void;
  setLoading: (loading: boolean) => void;
  validateStep: (step: number) => boolean;
  reset: () => void;
  
  // Calculations
  calculateMaxBettorStake: () => number;
  calculateCreationFee: () => number;
  estimateGas: () => number;
};

const initialData: CreateMarketData = {
  predictedOutcome: "",
  title: "",
  description: "",
  odds: 200, // 2.0x default (valid range: 1.01-100.00)
  creatorStake: 1000, // Default to 1000 BITR (meets minimum requirement)
  usesBitr: true, // Default to BITR (since 1000 BITR is more reasonable than 5 STT)
  category: "",
  league: "",
  region: "",
  isPrivate: false,
  maxBetPerUser: 0, // 0 means no limit
  whitelistAddresses: [],
};

export const useCreateMarket = create<CreateMarketStore>((set, get) => ({
  data: initialData,
  errors: {},
  step: 1,
  isLoading: false,
  
  setData: (newData) => {
    set((state) => {
      // Create a copy of the errors and remove the keys that are being updated
      const newErrors = { ...state.errors };
      for (const key of Object.keys(newData)) {
        delete (newErrors as any)[key];
      }

      return {
        data: { ...state.data, ...newData },
        errors: newErrors
      };
    });
  },
  
  setErrors: (newErrors) => set((state) => ({
    errors: { ...state.errors, ...newErrors }
  })),
  
  setStep: (step) => set({ step }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  validateStep: (step) => {
    const { data } = get();
    const errors: ValidationErrors = {};
    
    if (step >= 1) {
      // Basic Information Validation
      if (!data.predictedOutcome?.trim()) {
        errors.predictedOutcome = "Predicted outcome is required";
      }
      if (!data.title?.trim()) {
        errors.title = "Title is required";
      }
      if (!data.category?.trim()) {
        errors.category = "Category is required";
      }
    }
    
    if (step >= 2) {
      // Market Configuration Validation
      if (!data.odds || data.odds < 101 || data.odds > 10000) {
        errors.odds = "Odds must be between 1.01x and 100x";
      }
      if (!data.creatorStake || data.creatorStake < 20 || data.creatorStake > 1000000) {
        errors.creatorStake = "Creator stake must be between 20 and 1,000,000 tokens";
      }
    }
    
    if (step >= 3) {
      // Timing Validation
      const now = new Date();
      const minStartTime = new Date(now.getTime() + 60 * 1000); // 60 seconds from now
      const maxStartTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      
      if (!data.eventStartTime) {
        errors.eventStartTime = "Event start time is required";
      } else if (data.eventStartTime < minStartTime) {
        errors.eventStartTime = "Event must start at least 60 seconds from now";
      } else if (data.eventStartTime > maxStartTime) {
        errors.eventStartTime = "Event cannot be more than 1 year in the future";
      }
      
      if (!data.eventEndTime) {
        errors.eventEndTime = "Event end time is required";
      } else if (data.eventStartTime && data.eventEndTime <= data.eventStartTime) {
        errors.eventEndTime = "Event end time must be after start time";
      }
    }
    
    if (step >= 4 && data.isPrivate) {
      // Private Pool Validation
      if (data.maxBetPerUser && data.maxBetPerUser <= 0) {
        errors.maxBetPerUser = "Max bet per user must be greater than 0";
      }
      if (data.whitelistAddresses && data.whitelistAddresses.length > 0) {
        const invalidAddresses = data.whitelistAddresses.filter(addr => 
          !addr.match(/^0x[a-fA-F0-9]{40}$/)
        );
        if (invalidAddresses.length > 0) {
          errors.whitelistAddresses = "Invalid Ethereum addresses found";
        }
      }
    }
    
    get().setErrors(errors);
    return Object.keys(errors).length === 0;
  },
  
  calculateMaxBettorStake: () => {
    const { data } = get();
    if (!data.creatorStake || !data.odds || data.odds <= 100) return 0;
    return (data.creatorStake * 100) / (data.odds - 100);
  },
  
  calculateCreationFee: () => {
    return 1; // 1 STT or BITR as per contract
  },
  
  estimateGas: () => {
    // Rough estimation - actual gas will vary
    return 0.001; // ETH equivalent
  },
  
  reset: () => set({
    data: initialData,
    errors: {},
    step: 1,
    isLoading: false
  })
}));
