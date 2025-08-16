import { UserEligibility, AirdropStatistics, FaucetClaimRequest, FaucetClaimResponse } from "@/types/airdrop";
import { getAPIUrl, apiRequest } from "@/config/api";

// Get airdrop eligibility for a specific wallet address
export async function checkAirdropEligibility(address: string): Promise<UserEligibility> {
  try {
    return await apiRequest<UserEligibility>(`/api/airdrop/eligibility/${address}`);
  } catch (error) {
    console.error("Error checking airdrop eligibility:", error);
    throw error;
  }
}

// Get overall airdrop statistics
export async function getAirdropStatistics(): Promise<AirdropStatistics> {
  try {
    return await apiRequest<AirdropStatistics>("/api/airdrop/statistics");
  } catch (error) {
    console.error("Error fetching airdrop statistics:", error);
    throw error;
  }
}

// Check faucet eligibility 
export async function checkFaucetEligibility(address: string) {
  try {
    return await apiRequest(`/api/faucet/eligibility/${address}`);
  } catch (error) {
    console.error("Error checking faucet eligibility:", error);
    throw error;
  }
}

// Get faucet statistics
export async function getFaucetStatistics() {
  try {
    return await apiRequest("/api/faucet/statistics");
  } catch (error) {
    console.error("Error fetching faucet statistics:", error);
    throw error;
  }
}

// Get user activity for faucet eligibility
export async function getFaucetActivity(address: string) {
  try {
    return await apiRequest(`/api/faucet/activity/${address}`);
  } catch (error) {
    console.error("Error fetching faucet activity:", error);
    throw error;
  }
}

// Claim faucet tokens (this would typically call smart contract)
export async function claimFaucet(request: FaucetClaimRequest): Promise<FaucetClaimResponse> {
  try {
    const response = await fetch(getAPIUrl("/api/faucet/claim"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to claim faucet",
        error: result.error,
      };
    }
    
    return result;
  } catch (error) {
    console.error("Error claiming faucet:", error);
    return {
      success: false,
      message: "Network error occurred while claiming faucet",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get leaderboard of eligible users
export async function getAirdropLeaderboard(limit: number = 100) {
  try {
    return await apiRequest(`/api/airdrop/leaderboard?limit=${limit}`);
  } catch (error) {
    console.error("Error fetching airdrop leaderboard:", error);
    throw error;
  }
}

// Format BITR amounts for display
export function formatBITRAmount(amount: string | number, decimals: number = 18): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (value === 0) return "0";
  
  // Convert from wei to BITR (assuming 18 decimals)
  const bitrValue = value / Math.pow(10, decimals);
  
  if (bitrValue >= 1000000) {
    return `${(bitrValue / 1000000).toFixed(1)}M`;
  } else if (bitrValue >= 1000) {
    return `${(bitrValue / 1000).toFixed(1)}K`;
  } else if (bitrValue >= 1) {
    return bitrValue.toFixed(2);
  } else {
    return bitrValue.toFixed(6);
  }
}

// Format addresses for display
export function formatAddress(address: string, length: number = 8): string {
  if (!address) return "";
  
  if (address.length <= length) return address;
  
  const start = address.slice(0, length / 2 + 2); // +2 for "0x"
  const end = address.slice(-length / 2);
  return `${start}...${end}`;
}

// Calculate progress percentage for requirements
export function calculateRequirementProgress(requirements: UserEligibility['requirements']): number {
  let completed = 0;
  let total = 5; // Total number of requirements
  
  if (requirements.faucetClaim) completed++;
  if (requirements.sttActivityBeforeFaucet) completed++;
  if (requirements.bitrActions.met) completed++;
  if (requirements.stakingActivity) completed++;
  if (requirements.oddysseySlips.met) completed++;
  
  return Math.round((completed / total) * 100);
}
