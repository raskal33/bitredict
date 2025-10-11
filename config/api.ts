export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev',
  // Use relative URLs for frontend API routes that proxy to backend
  frontendBaseURL: typeof window !== 'undefined' ? '' : 'https://bitredict-backend.fly.dev',
  endpoints: {
    airdrop: '/api/airdrop',
    faucet: '/api/faucet', 
    pools: '/api/guided-markets/pools',
    analytics: '/api/analytics',
    social: '/api/social',
    health: '/health',
    crypto: '/api/crypto',
    fixtures: '/api/fixtures',
    oddyssey: '/api/oddyssey',
    staking: '/api/staking',
    users: '/api/users',
    reputation: '/api/reputation',
    guidedMarkets: '/api/guided-markets',
    optimisticOracle: '/api/optimistic-oracle'
  }
} as const;

export function getAPIUrl(endpoint: string): string {
  // Use frontend proxy routes on client-side to avoid CORS issues
  if (typeof window !== 'undefined') {
    return `${API_CONFIG.frontendBaseURL}${endpoint}`;
  }
  // Use direct backend URL on server-side
  return `${API_CONFIG.baseURL}${endpoint}`;
}

// Helper function for making API requests with proper error handling
export async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = getAPIUrl(endpoint);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}
