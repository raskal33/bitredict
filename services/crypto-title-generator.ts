/**
 * Crypto Title Generator Service
 * Generates crypto-specific titles for cryptocurrency prediction markets
 */

export interface CryptoMarketData {
  asset: string; // e.g., "BTC", "ETH", "BNB"
  targetPrice?: number;
  direction: 'above' | 'below' | 'up' | 'down';
  timeframe: string; // e.g., "1h", "4h", "1d", "3d", "7d", "30d"
  predictedOutcome: string; // e.g., "BTC above $1450", "ETH below $3000"
  marketType: string; // e.g., "CRYPTO_TARGET", "CRYPTO_UP", "CRYPTO_DOWN"
}

export interface CryptoTitleOptions {
  short?: boolean;
  includeTimeframe?: boolean;
  maxLength?: number;
}

class CryptoTitleGenerator {
  /**
   * Generate crypto-specific title
   */
  generateTitle(marketData: CryptoMarketData, options: CryptoTitleOptions = {}): string {
    const { asset, targetPrice, direction, timeframe, predictedOutcome, marketType } = marketData;
    const { short = false, includeTimeframe = true, maxLength = 60 } = options;

    console.log('🪙 CRYPTO TITLE GENERATOR - Input:', marketData);

    // Handle different crypto market types
    switch (marketType) {
      case 'CRYPTO_TARGET':
        if (direction === 'above' || direction === 'below') {
          return this.generateTargetPriceTitle(asset, targetPrice!, direction, timeframe, short, includeTimeframe);
        } else {
          return this.generateDirectionTitle(asset, direction, timeframe, short, includeTimeframe);
        }
      
      case 'CRYPTO_UP':
        return this.generateDirectionTitle(asset, 'up', timeframe, short, includeTimeframe);
      
      case 'CRYPTO_DOWN':
        return this.generateDirectionTitle(asset, 'down', timeframe, short, includeTimeframe);
      
      default:
        // Try to parse from predictedOutcome
        return this.parseFromPredictedOutcome(asset, predictedOutcome, timeframe, short, includeTimeframe);
    }
  }

  /**
   * Generate title for target price predictions
   */
  private generateTargetPriceTitle(
    asset: string, 
    targetPrice: number, 
    direction: 'above' | 'below', 
    timeframe: string, 
    short: boolean, 
    includeTimeframe: boolean
  ): string {
    const formattedPrice = this.formatPrice(targetPrice);
    const timeText = includeTimeframe ? ` in ${this.formatTimeframe(timeframe)}` : '';
    
    if (short) {
      return `${asset} ${direction} $${formattedPrice}${timeText}`;
    }
    
    const directionText = direction === 'above' ? 'reach above' : 'stay below';
    return `${asset} will ${directionText} $${formattedPrice}${timeText}!`;
  }

  /**
   * Generate title for direction predictions (up/down)
   */
  private generateDirectionTitle(
    asset: string, 
    direction: 'up' | 'down', 
    timeframe: string, 
    short: boolean, 
    includeTimeframe: boolean
  ): string {
    const timeText = includeTimeframe ? ` in ${this.formatTimeframe(timeframe)}` : '';
    
    if (short) {
      return `${asset} goes ${direction}${timeText}`;
    }
    
    return `${asset} will go ${direction}${timeText}!`;
  }

  /**
   * Parse title from predicted outcome string
   */
  private parseFromPredictedOutcome(
    asset: string, 
    predictedOutcome: string, 
    timeframe: string, 
    short: boolean, 
    includeTimeframe: boolean
  ): string {
    console.log('🪙 Parsing from predicted outcome:', predictedOutcome);
    
    // Check if it's a target price prediction
    const targetPriceMatch = predictedOutcome.match(/(\w+)\s+(above|below)\s+\$?([\d,]+)/i);
    if (targetPriceMatch) {
      const [, , direction, price] = targetPriceMatch;
      const targetPrice = parseFloat(price.replace(/,/g, ''));
      return this.generateTargetPriceTitle(asset, targetPrice, direction as 'above' | 'below', timeframe, short, includeTimeframe);
    }
    
    // Check if it's a direction prediction
    const directionMatch = predictedOutcome.match(/(\w+)\s+(up|down)/i);
    if (directionMatch) {
      const [, , direction] = directionMatch;
      return this.generateDirectionTitle(asset, direction as 'up' | 'down', timeframe, short, includeTimeframe);
    }
    
    // Fallback: use the predicted outcome as-is
    const timeText = includeTimeframe ? ` in ${this.formatTimeframe(timeframe)}` : '';
    return short ? predictedOutcome : `${predictedOutcome}${timeText}`;
  }

  /**
   * Format price for display
   */
  private formatPrice(price: number): string {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K`;
    } else if (price >= 1) {
      return price.toFixed(0);
    } else {
      return price.toFixed(2);
    }
  }

  /**
   * Format timeframe for display
   */
  private formatTimeframe(timeframe: string): string {
    const timeframeMap: Record<string, string> = {
      '1h': '1 hour',
      '4h': '4 hours', 
      '1d': '1 day',
      '3d': '3 days',
      '7d': '1 week',
      '30d': '1 month'
    };
    
    return timeframeMap[timeframe] || timeframe;
  }

  /**
   * Generate short title for mobile/compact display
   */
  generateShortTitle(marketData: CryptoMarketData): string {
    return this.generateTitle(marketData, { short: true, maxLength: 30 });
  }

  /**
   * Generate description for crypto market
   */
  generateDescription(marketData: CryptoMarketData): string {
    const { asset, targetPrice, direction, timeframe, marketType } = marketData;
    
    switch (marketType) {
      case 'CRYPTO_TARGET':
        const directionText = direction === 'above' ? 'reach above' : 'stay below';
        return `${asset} price prediction: ${directionText} $${this.formatPrice(targetPrice!)} in ${this.formatTimeframe(timeframe)}`;
      
      case 'CRYPTO_UP':
        return `${asset} price prediction: will increase in ${this.formatTimeframe(timeframe)}`;
      
      case 'CRYPTO_DOWN':
        return `${asset} price prediction: will decrease in ${this.formatTimeframe(timeframe)}`;
      
      default:
        return `${asset} cryptocurrency price prediction`;
    }
  }

  /**
   * Generate market type display name for crypto
   */
  getMarketTypeDisplayName(marketType: string): string {
    const displayNames: Record<string, string> = {
      'CRYPTO_TARGET': 'Price Target',
      'CRYPTO_UP': 'Price Up',
      'CRYPTO_DOWN': 'Price Down',
      'CRYPTO_MONEYLINE': 'Price Direction'
    };
    
    return displayNames[marketType] || 'Crypto Prediction';
  }

  /**
   * Check if market data is crypto
   */
  isCryptoMarket(marketData: any): boolean {
    return marketData.category === 'cryptocurrency' || 
           marketData.category === 'crypto' ||
           marketData.league === 'crypto' ||
           marketData.marketType?.startsWith('CRYPTO_');
  }

  /**
   * Extract crypto market data from pool data
   */
  extractCryptoData(poolData: any): CryptoMarketData | null {
    if (!this.isCryptoMarket(poolData)) {
      return null;
    }

    // Extract asset from homeTeam (e.g., "BTC" from "BTC")
    const asset = poolData.homeTeam || 'BTC';
    
    // Extract target price and direction from predictedOutcome
    const predictedOutcome = poolData.predictedOutcome || '';
    const targetPriceMatch = predictedOutcome.match(/\$?([\d,]+)/);
    const targetPrice = targetPriceMatch ? parseFloat(targetPriceMatch[1].replace(/,/g, '')) : undefined;
    
    // Determine direction
    let direction: 'above' | 'below' | 'up' | 'down' = 'above';
    if (predictedOutcome.toLowerCase().includes('above')) {
      direction = 'above';
    } else if (predictedOutcome.toLowerCase().includes('below')) {
      direction = 'below';
    } else if (predictedOutcome.toLowerCase().includes('up')) {
      direction = 'up';
    } else if (predictedOutcome.toLowerCase().includes('down')) {
      direction = 'down';
    }

    // Extract timeframe (default to 1d if not specified)
    const timeframe = '1d'; // This should be extracted from pool data if available

    return {
      asset,
      targetPrice,
      direction,
      timeframe,
      predictedOutcome,
      marketType: 'CRYPTO_TARGET'
    };
  }
}

export const cryptoTitleGenerator = new CryptoTitleGenerator();
export default cryptoTitleGenerator;
