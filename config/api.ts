export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev',
  endpoints: {
    airdrop: '/api/airdrop',
    faucet: '/api/faucet', 
    pools: '/api/pools',
    analytics: '/api/analytics',
    social: '/api/social',
    health: '/health',
    crypto: '/api/crypto',
    fixtures: '/api/fixtures',
    oddyssey: '/api/oddyssey',
    staking: '/api/staking',
    users: '/api/users',
    reputation: '/api/reputation',
    guidedOracle: '/api/guided-oracle',
    optimisticOracle: '/api/optimistic-oracle'
  }
} as const;

export function getAPIUrl(endpoint: string): string {
  return `${API_CONFIG.baseURL}${endpoint}`;
}

// Helper function for making API requests with proper error handling and retry logic
export async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {},
  retries: number = 2 // Reduced from 3 to 2 to prevent rate limiting
): Promise<T> {
  const url = getAPIUrl(endpoint);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://bitredict.vercel.app',
          ...options.headers,
        },
        mode: 'cors',
        credentials: 'omit', // Changed from 'include' to 'omit' to avoid CORS issues
        ...options,
      });

      if (!response.ok) {
        // Handle rate limiting (429) with exponential backoff
        if (response.status === 429 && attempt < retries) {
          const delay = Math.pow(2, attempt) * 2000; // Increased delay: 4s, 8s
          console.warn(`⚠️ Rate limited (429). Retrying in ${delay}ms... (attempt ${attempt}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Handle server errors (5xx) with retry
        if (response.status >= 500 && attempt < retries) {
          const delay = 2000 * attempt; // Increased delay for server errors
          console.warn(`⚠️ Server error (${response.status}). Retrying in ${delay}ms... (attempt ${attempt}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Handle CORS errors
        if (response.status === 0 || response.status === 403) {
          console.error(`🚫 CORS or access error (${response.status}). Check CORS configuration.`);
          throw new Error(`CORS Error: Unable to access API from ${typeof window !== 'undefined' ? window.location.origin : 'unknown origin'}`);
        }
        
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText || 'Unknown error'}`);
      }

      return response.json();
    } catch (error) {
      // Network errors or other fetch failures
      if (attempt < retries && (error instanceof TypeError || (error instanceof Error && error.message.includes('fetch')))) {
        const delay = 2000 * attempt; // Increased delay
        console.warn(`⚠️ Network error. Retrying in ${delay}ms... (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error(`Failed to complete request after ${retries} attempts`);
}
