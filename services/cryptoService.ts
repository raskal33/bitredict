import { apiRequest, API_CONFIG } from '@/config/api';

export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  rank: number;
  volatility?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  timestamp: string;
  logo?: string;
}

export interface PriceTarget {
  direction: 'above' | 'below';
  targetPrice: number;
  percentage: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface CryptoMarket {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  currentPrice: number;
  targetPrice: number;
  direction: 'above' | 'below';
  timeframe: '1h' | '24h' | '7d' | '30d';
  difficulty: 'easy' | 'medium' | 'hard';
  volatility: number;
  poolId?: string;
  createdAt: string;
}

export interface CryptoTargetsResponse {
  success: boolean;
  coinId: string;
  currentPrice: number;
  volatility: number;
  targets: PriceTarget[];
}

class CryptoService {
  private baseEndpoint = API_CONFIG.endpoints.crypto;

  /**
   * Get popular cryptocurrencies with current prices
   */
  async getPopularCryptos(): Promise<CryptoData[]> {
    const response = await apiRequest<{ success: boolean; data: CryptoData[] }>(
      `${this.baseEndpoint}/popular`
    );
    return response.data;
  }

  /**
   * Get specific cryptocurrency price data
   */
  async getCryptoPrice(symbol: string): Promise<CryptoData> {
    const response = await apiRequest<{ success: boolean; data: CryptoData }>(
      `${this.baseEndpoint}/prices/${symbol}`
    );
    return response.data;
  }

  /**
   * Search cryptocurrencies by name or symbol
   */
  async searchCryptos(query: string): Promise<CryptoData[]> {
    const response = await apiRequest<{ success: boolean; data: CryptoData[] }>(
      `${this.baseEndpoint}/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  /**
   * Get price prediction targets for a cryptocurrency
   */
  async getPriceTargets(coinId: string, timeframe: string = '24h'): Promise<CryptoTargetsResponse> {
    const response = await apiRequest<{ success: boolean; data: CryptoTargetsResponse }>(
      `${this.baseEndpoint}/targets/${coinId}?timeframe=${timeframe}`
    );
    return response.data;
  }

  /**
   * Get active cryptocurrency prediction markets
   */
  async getActiveCryptoMarkets(): Promise<CryptoMarket[]> {
    const response = await apiRequest<{ success: boolean; data: CryptoMarket[] }>(
      `${this.baseEndpoint}/markets/active`
    );
    return response.data;
  }

  /**
   * Get crypto markets needing resolution
   */
  async getPendingCryptoResolutions(): Promise<CryptoMarket[]> {
    const response = await apiRequest<{ success: boolean; data: CryptoMarket[] }>(
      `${this.baseEndpoint}/markets/pending`
    );
    return response.data;
  }

  /**
   * Create a new cryptocurrency prediction market
   */
  async createCryptoMarket(marketData: {
    coinId: string;
    targetPrice: number;
    direction: 'above' | 'below';
    timeframe: string;
    poolId: string;
  }): Promise<CryptoMarket> {
    const response = await apiRequest<{ success: boolean; data: CryptoMarket }>(
      `${this.baseEndpoint}/markets`,
      {
        method: 'POST',
        body: JSON.stringify(marketData),
      }
    );
    return response.data;
  }

  /**
   * Get crypto service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    apiConnectivity: string;
    lastUpdate: string;
    popularCoinsCount?: number;
    error?: string;
  }> {
    const response = await apiRequest<{ 
      success: boolean; 
      data: {
        status: 'healthy' | 'unhealthy';
        apiConnectivity: string;
        lastUpdate: string;
        popularCoinsCount?: number;
        error?: string;
      }
    }>(`${this.baseEndpoint}/health`);
    return response.data;
  }
}

export const cryptoService = new CryptoService(); 