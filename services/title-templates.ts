/**
 * Title Templates Service - Frontend
 * Generates user-friendly titles for all market types
 * Similar to backend service but optimized for frontend use
 */

import { getMarketTypeString, getMarketTypeLabel } from './contractDataMapping';

export interface MarketData {
  marketType: string | number; // Accept both string and numeric market types
  homeTeam?: string;
  awayTeam?: string;
  predictedOutcome: string;
  league?: string;
  marketId?: string;
  category?: string; // Add category to detect crypto markets
}

export interface TitleOptions {
  short?: boolean;
  includeLeague?: boolean;
  maxLength?: number;
}

class TitleTemplatesService {
  /**
   * Enhance an existing title from contract with additional context
   */
  enhanceTitle(contractTitle: string, category: string, homeTeam?: string, awayTeam?: string): string {
    // If we have team names, try to enhance the title
    if (homeTeam && awayTeam && contractTitle) {
      // If the title doesn't already contain team names, add them
      if (!contractTitle.includes(homeTeam) && !contractTitle.includes(awayTeam)) {
        return `${homeTeam} vs ${awayTeam}: ${contractTitle}`;
      }
    }
    
    // If no enhancement possible, return the original title
    return contractTitle || `${category.charAt(0).toUpperCase() + category.slice(1)} Market`;
  }

  /**
   * Generate title for any market type
   */
  generateTitle(marketData: MarketData, options: TitleOptions = {}): string {
    const { homeTeam, awayTeam, predictedOutcome, league, category } = marketData;
    const { short = false, includeLeague = false, maxLength = 50 } = options;

    // Convert numeric market type to string if needed
    const marketTypeString = typeof marketData.marketType === 'number' 
      ? getMarketTypeString(marketData.marketType)
      : marketData.marketType;

    console.log('🏷️ TITLE GENERATION DEBUG:', {
      originalMarketType: marketData.marketType,
      marketTypeString,
      predictedOutcome,
      homeTeam,
      awayTeam,
      category
    });

    // Check if this is a crypto market
    if (this.isCryptoMarket(marketData)) {
      return this.generateCryptoTitle(marketData, options);
    }

    if (!homeTeam || !awayTeam) {
      return this.generateFallbackTitle(predictedOutcome, marketTypeString);
    }

    // For team-specific predictions, determine which team is winning
    // Only use team-specific logic for moneyline markets (1X2)
    const teamSpecificTitle = marketTypeString === 'MONEYLINE' 
      ? this.generateTeamSpecificTitle(predictedOutcome, homeTeam, awayTeam, marketTypeString, short)
      : null;
    if (teamSpecificTitle) {
      let title = teamSpecificTitle;
      if (includeLeague && league) {
        title = `${title} (${league})`;
      }
      return this.truncateTitle(title, maxLength);
    }

    const templates = this.getTemplates(marketTypeString, short);
    
    console.log('🎯 TITLE TEMPLATES SERVICE - Debug:');
    console.log('🎯 TITLE TEMPLATES SERVICE - Market type:', marketTypeString);
    console.log('🎯 TITLE TEMPLATES SERVICE - Predicted outcome:', predictedOutcome);
    console.log('🎯 TITLE TEMPLATES SERVICE - Available templates:', Object.keys(templates));
    console.log('🎯 TITLE TEMPLATES SERVICE - Templates for market type:', templates);
    console.log('🎯 TITLE TEMPLATES SERVICE - Looking for exact match:', predictedOutcome);
    console.log('🎯 TITLE TEMPLATES SERVICE - Template exists?', templates[predictedOutcome]);
    
    // Find exact match for predicted outcome
    if (templates[predictedOutcome]) {
      console.log('🎯 Found exact match for:', predictedOutcome);
      let title = this.processTemplate(templates[predictedOutcome], { homeTeam, awayTeam, league });
      if (includeLeague && league) {
        title = `${title} (${league})`;
      }
      return this.truncateTitle(title, maxLength);
    }

    // Try normalized matches (remove "goals" suffix, handle variations)
    const normalizedOutcome = predictedOutcome.toLowerCase().replace(/\s+goals?/g, '').trim();
    for (const [key, template] of Object.entries(templates)) {
      const normalizedKey = key.toLowerCase().replace(/\s+goals?/g, '').trim();
      if (normalizedOutcome === normalizedKey) {
        console.log('🎯 Found normalized match for:', predictedOutcome, '->', key);
        let title = this.processTemplate(template, { homeTeam, awayTeam, league });
        if (includeLeague && league) {
          title = `${title} (${league})`;
        }
        return this.truncateTitle(title, maxLength);
      }
    }

    // Try specific Over/Under variations
    if (marketTypeString.startsWith('OU')) {
      const ouVariations = this.getOverUnderVariations(predictedOutcome);
      for (const variation of ouVariations) {
        if (templates[variation]) {
          console.log('🎯 Found OU variation match for:', predictedOutcome, '->', variation);
          let title = this.processTemplate(templates[variation], { homeTeam, awayTeam, league });
          if (includeLeague && league) {
            title = `${title} (${league})`;
          }
          return this.truncateTitle(title, maxLength);
        }
      }
    }

    // Try partial matches
    for (const [key, template] of Object.entries(templates)) {
      if (this.isPartialMatch(predictedOutcome, key)) {
        console.log('🎯 Found partial match for:', predictedOutcome, '->', key);
        let title = this.processTemplate(template, { homeTeam, awayTeam, league });
        if (includeLeague && league) {
          title = `${title} (${league})`;
        }
        return this.truncateTitle(title, maxLength);
      }
    }

    // Fallback template
    const fallback = short 
      ? `${homeTeam} vs ${awayTeam} ${predictedOutcome}`
      : `${homeTeam} vs ${awayTeam} will be ${predictedOutcome}!`;
    
    let title = fallback;
    if (includeLeague && league) {
      title = `${title} (${league})`;
    }
    return this.truncateTitle(title, maxLength);
  }

  /**
   * Generate short title (for mobile/compact display)
   */
  generateShortTitle(marketData: MarketData): string {
    return this.generateTitle(marketData, { short: true, maxLength: 30 });
  }

  /**
   * Generate description for market type
   */
  generateDescription(marketType: string, homeTeam?: string, awayTeam?: string, league?: string): string {
    const descriptions: Record<string, string> = {
      '1X2': 'Match winner after 90 minutes',
      'OU25': 'Total goals scored in the match',
      'OU35': 'Total goals scored in the match',
      'OU15': 'Total goals scored in the match',
      'OU05': 'Total goals scored in the match',
      'BTTS': 'Both teams score at least one goal',
      'HT_1X2': 'Leading team at half-time',
      'HT_OU15': 'Goals scored in first half',
      'HT_OU05': 'Goals scored in first half',
      'DC': 'Two possible outcomes combined',
      'CS': 'Exact final score',
      'FG': 'First team to score',
      'HTFT': 'Half-time and full-time result combination',
      'CRYPTO_UP': 'Cryptocurrency price increase',
      'CRYPTO_DOWN': 'Cryptocurrency price decrease',
      'CRYPTO_TARGET': 'Cryptocurrency price target'
    };

    const baseDescription = descriptions[marketType] || 'Prediction market';
    
    if (league) {
      return `${baseDescription} - ${league}`;
    }
    
    return baseDescription;
  }

  /**
   * Generate market type display name
   */
  getMarketTypeDisplayName(marketType: string): string {
    const displayNames: Record<string, string> = {
      '1X2': 'Match Result',
      'OU25': 'Over/Under 2.5 Goals',
      'OU35': 'Over/Under 3.5 Goals',
      'OU15': 'Over/Under 1.5 Goals',
      'OU05': 'Over/Under 0.5 Goals',
      'BTTS': 'Both Teams To Score',
      'HT_1X2': 'Half-Time Result',
      'HT_OU15': 'Half-Time Over/Under 1.5',
      'HT_OU05': 'Half-Time Over/Under 0.5',
      'DC': 'Double Chance',
      'CS': 'Correct Score',
      'FG': 'First Goalscorer',
      'HTFT': 'Half-Time/Full-Time',
      'CRYPTO_UP': 'Crypto Price Up',
      'CRYPTO_DOWN': 'Crypto Price Down',
      'CRYPTO_TARGET': 'Crypto Price Target'
    };

    return displayNames[marketType] || marketType;
  }

  /**
   * Get Over/Under variations for better matching
   */
  private getOverUnderVariations(predictedOutcome: string): string[] {
    const variations: string[] = [];
    const outcome = predictedOutcome.toLowerCase();
    
    // Add original
    variations.push(predictedOutcome);
    
    // Add with/without "goals"
    if (outcome.includes('over') || outcome.includes('under')) {
      variations.push(predictedOutcome + ' goals');
      variations.push(predictedOutcome.replace(/\s+goals?/g, ''));
    }
    
    // Add simple Over/Under variations
    if (outcome.includes('over')) {
      variations.push('Over');
    }
    if (outcome.includes('under')) {
      variations.push('Under');
    }
    
    return variations;
  }

  /**
   * Check if market data is crypto
   */
  isCryptoMarket(marketData: MarketData): boolean {
    return Boolean(
      marketData.category === 'cryptocurrency' || 
      marketData.category === 'crypto' ||
      (marketData.league && marketData.league === 'crypto') ||
      (typeof marketData.marketType === 'string' && marketData.marketType.startsWith('CRYPTO_')) ||
      (typeof marketData.marketType === 'number' && marketData.marketType === 7) || // CUSTOM market type for crypto
      (marketData.homeTeam && marketData.awayTeam && 
       ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'MATIC', 'AVAX', 'DOT', 'LINK', 'UNI'].includes(marketData.homeTeam))
    );
  }

  /**
   * Generate crypto-specific title
   */
  generateCryptoTitle(marketData: MarketData, options: TitleOptions = {}): string {
    const { homeTeam, awayTeam, predictedOutcome, marketType } = marketData;
    const { short = false, maxLength = 60 } = options;

    // Import crypto title generator
    const { cryptoTitleGenerator } = require('./crypto-title-generator');
    
    // Extract crypto data
    const cryptoData = cryptoTitleGenerator.extractCryptoData({
      ...marketData,
      homeTeam: homeTeam || awayTeam, // Use homeTeam as asset
      category: marketData.category || 'crypto'
    });

    if (cryptoData) {
      return cryptoTitleGenerator.generateTitle(cryptoData, options);
    }

    // Fallback crypto title generation
    const asset = homeTeam || awayTeam || 'Crypto';
    const timeText = short ? '' : ' in 1 day';
    
    if (predictedOutcome.toLowerCase().includes('above')) {
      return short ? `${asset} above target` : `${asset} will reach above target${timeText}!`;
    } else if (predictedOutcome.toLowerCase().includes('below')) {
      return short ? `${asset} below target` : `${asset} will stay below target${timeText}!`;
    } else if (predictedOutcome.toLowerCase().includes('up')) {
      return short ? `${asset} goes up` : `${asset} will go up${timeText}!`;
    } else if (predictedOutcome.toLowerCase().includes('down')) {
      return short ? `${asset} goes down` : `${asset} will go down${timeText}!`;
    }

    // Generic crypto title
    return short ? `${asset} prediction` : `${asset} price prediction${timeText}!`;
  }

  /**
   * Generate crypto title from market ID (legacy method)
   */
  generateCryptoTitleFromMarketId(marketId: string, predictedOutcome: string): string {
    try {
      // Parse marketId format: crypto-${coinId}-${targetPrice}-${direction}-${timeframe}
      const parts = marketId.split('-');
      if (parts.length >= 5 && parts[0] === 'crypto') {
        const coinId = parts[1].toUpperCase();
        const targetPrice = parts[2];
        const direction = parts[3];
        const timeframe = parts[4];

        switch (direction) {
          case 'up':
            return `${coinId} will go up in ${timeframe}!`;
          case 'down':
            return `${coinId} will go down in ${timeframe}!`;
          case 'above':
            return `${coinId} will reach above $${targetPrice} in ${timeframe}!`;
          case 'below':
            return `${coinId} will stay below $${targetPrice} in ${timeframe}!`;
          default:
            return `${coinId} ${predictedOutcome} in ${timeframe}!`;
        }
      }
    } catch (error) {
      console.warn('Failed to parse crypto marketId:', error);
    }

    // Fallback
    return `Crypto prediction: ${predictedOutcome}!`;
  }

  /**
   * Generate event name from market data
   */
  generateEventName(marketData: MarketData): string {
    const { marketType, homeTeam, awayTeam, marketId, league } = marketData;
    
    if (marketType && typeof marketType === 'string' && marketType.startsWith('CRYPTO')) {
      return this.generateCryptoEventName(marketId || '');
    } else if (homeTeam && awayTeam) {
      return `${homeTeam} vs ${awayTeam}`;
    } else if (league) {
      return `${league} Match`;
    }
    return 'Prediction Market';
  }

  /**
   * Generate crypto event name from market ID
   */
  generateCryptoEventName(marketId: string): string {
    try {
      const parts = marketId.split('-');
      if (parts.length >= 5 && parts[0] === 'crypto') {
        const coinId = parts[1].toUpperCase();
        const targetPrice = parts[2];
        const direction = parts[3];
        const timeframe = parts[4];

        switch (direction) {
          case 'up':
            return `${coinId} Up`;
          case 'down':
            return `${coinId} Down`;
          case 'above':
            return `${coinId} Above $${targetPrice}`;
          case 'below':
            return `${coinId} Below $${targetPrice}`;
          default:
            return `${coinId} ${direction}`;
        }
      }
    } catch (error) {
      console.warn('Failed to parse crypto marketId for event name:', error);
    }

    return 'Crypto Prediction';
  }

  /**
   * Generate professional betting market title for pool cards
   */
  generateProfessionalTitle(predictedOutcome: string, category: string, homeTeam?: string, awayTeam?: string): string {
    // For football markets, try to extract team names and create proper format
    if (category === 'football' && homeTeam && awayTeam) {
      // Common patterns for football predictions
      const patterns = [
        /(.+?)\s+(?:will\s+)?(?:NOT\s+)?(?:win|beat|defeat)\s+(.+?)(?:\s+in\s+.+)?$/i,
        /(.+?)\s+vs\s+(.+?)\s+(.+)/i,
        /(.+?)\s+and\s+(.+?)\s+(.+)/i
      ];
      
      for (const pattern of patterns) {
        const match = predictedOutcome.match(pattern);
        if (match) {
          const team1 = match[1]?.trim();
          const team2 = match[2]?.trim();
          const outcome = match[3]?.trim();
          
          if (team1 && team2) {
            // Clean up team names
            const cleanTeam1 = team1.replace(/\s+(?:will\s+)?(?:NOT\s+)?(?:win|beat|defeat)/i, '').trim();
            const cleanTeam2 = team2.replace(/\s+(?:will\s+)?(?:NOT\s+)?(?:win|beat|defeat)/i, '').trim();
            
            if (outcome && outcome.includes('2.5')) {
              return `${cleanTeam1} vs ${cleanTeam2} 2.5 Over?`;
            } else if (outcome && outcome.includes('1.5')) {
              return `${cleanTeam1} vs ${cleanTeam2} 1.5 Over?`;
            } else if (outcome && outcome.includes('3.5')) {
              return `${cleanTeam1} vs ${cleanTeam2} 3.5 Over?`;
            } else if (outcome && outcome.includes('win')) {
              return `${cleanTeam1} vs ${cleanTeam2} Winner`;
            } else {
              return `${cleanTeam1} vs ${cleanTeam2}`;
            }
          }
        }
      }
    }
    
    // For cryptocurrency markets
    if (category === 'cryptocurrency') {
      const cryptoMatch = predictedOutcome.match(/(.+?)\s+(?:will\s+)?(?:NOT\s+)?(?:reach|hit|exceed)\s+(\$[\d,]+)/i);
      if (cryptoMatch) {
        const crypto = cryptoMatch[1]?.trim();
        const price = cryptoMatch[2]?.trim();
        return `${crypto} ${price} Target`;
      }
    }
    
    // For basketball markets
    if (category === 'basketball') {
      const bballMatch = predictedOutcome.match(/(.+?)\s+(?:will\s+)?(?:NOT\s+)?(?:beat|defeat)\s+(.+?)/i);
      if (bballMatch) {
        const team1 = bballMatch[1]?.trim();
        const team2 = bballMatch[2]?.trim();
        return `${team1} vs ${team2}`;
      }
    }
    
    // Fallback: clean up the predicted outcome
    return predictedOutcome
      .replace(/\s+(?:will\s+)?(?:NOT\s+)?(?:happen|occur|take place)/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50) + (predictedOutcome.length > 50 ? '...' : '');
  }

  // Private helper methods

  /**
   * Process template string by replacing placeholders with actual values
   */
  private processTemplate(template: string, data: { homeTeam: string; awayTeam: string; league?: string }): string {
    return template
      .replace(/\${homeTeam}/g, data.homeTeam)
      .replace(/\${awayTeam}/g, data.awayTeam)
      .replace(/\${league}/g, data.league || '');
  }

  private getTemplates(marketType: string, short: boolean): Record<string, string> {
    if (short) {
      return this.getShortTemplates(marketType);
    }
    return this.getFullTemplates(marketType);
  }

  private getFullTemplates(marketType: string): Record<string, string> {
    const templates: Record<string, Record<string, string>> = {
      // Moneyline markets (MONEYLINE) - Professional prediction market style
      'MONEYLINE': {
        'Home wins': '${homeTeam} will beat ${awayTeam} at home!',
        'Away wins': '${awayTeam} will beat ${homeTeam} away!',
        'Draw': '${homeTeam} vs ${awayTeam} will end in a draw!',
        '1': '${homeTeam} will beat ${awayTeam} at home!',
        '2': '${awayTeam} will beat ${homeTeam} away!',
        'X': '${homeTeam} vs ${awayTeam} will end in a draw!',
        'Home': '${homeTeam} will beat ${awayTeam} at home!',
        'Away': '${awayTeam} will beat ${homeTeam} away!'
      },

      // Over/Under markets (OVER_UNDER) - Professional prediction market style
      'OVER_UNDER': {
        'Over 0.5 goals': '${homeTeam} vs ${awayTeam} will have over 0.5 goals!',
        'Under 0.5 goals': '${homeTeam} vs ${awayTeam} will have under 0.5 goals!',
        'Over 1.5 goals': '${homeTeam} vs ${awayTeam} will have over 1.5 goals!',
        'Under 1.5 goals': '${homeTeam} vs ${awayTeam} will have under 1.5 goals!',
        'Over 2.5 goals': '${homeTeam} vs ${awayTeam} will have over 2.5 goals!',
        'Under 2.5 goals': '${homeTeam} vs ${awayTeam} will have under 2.5 goals!',
        'Over 3.5 goals': '${homeTeam} vs ${awayTeam} will have over 3.5 goals!',
        'Under 3.5 goals': '${homeTeam} vs ${awayTeam} will have under 3.5 goals!',
        'Over 4.5 goals': '${homeTeam} vs ${awayTeam} will have over 4.5 goals!',
        'Under 4.5 goals': '${homeTeam} vs ${awayTeam} will have under 4.5 goals!',
        'Over': '${homeTeam} vs ${awayTeam} will have over 2.5 goals!',
        'Under': '${homeTeam} vs ${awayTeam} will have under 2.5 goals!',
        'Over 0.5': '${homeTeam} vs ${awayTeam} will have over 0.5 goals!',
        'Under 0.5': '${homeTeam} vs ${awayTeam} will have under 0.5 goals!',
        'Over 1.5': '${homeTeam} vs ${awayTeam} will have over 1.5 goals!',
        'Under 1.5': '${homeTeam} vs ${awayTeam} will have under 1.5 goals!',
        'Over 2.5': '${homeTeam} vs ${awayTeam} will have over 2.5 goals!',
        'Under 2.5': '${homeTeam} vs ${awayTeam} will have under 2.5 goals!',
        'Over 3.5': '${homeTeam} vs ${awayTeam} will have over 3.5 goals!',
        'Under 3.5': '${homeTeam} vs ${awayTeam} will have under 3.5 goals!',
        'Over 4.5': '${homeTeam} vs ${awayTeam} will have over 4.5 goals!',
        'Under 4.5': '${homeTeam} vs ${awayTeam} will have under 4.5 goals!'
      },

      // Both Teams to Score (BOTH_TEAMS_SCORE)
      'BOTH_TEAMS_SCORE': {
        'Both teams to score': '${homeTeam} and ${awayTeam} will both score!',
        'Both teams will not score': '${homeTeam} vs ${awayTeam} will not both score!',
        'Yes': '${homeTeam} and ${awayTeam} will both score!',
        'No': '${homeTeam} vs ${awayTeam} will not both score!',
        'BTTS Yes': '${homeTeam} and ${awayTeam} will both score!',
        'BTTS No': '${homeTeam} vs ${awayTeam} will not both score!'
      },

      // Half Time (HALF_TIME)
      'HALF_TIME': {
        'Home leads at half-time': '${homeTeam} will lead at half-time vs ${awayTeam}!',
        'Away leads at half-time': '${awayTeam} will lead at half-time vs ${homeTeam}!',
        'Draw at half-time': '${homeTeam} vs ${awayTeam} will be tied at half-time!',
        '1': '${homeTeam} will lead at half-time vs ${awayTeam}!',
        '2': '${awayTeam} will lead at half-time vs ${homeTeam}!',
        'X': '${homeTeam} vs ${awayTeam} will be tied at half-time!'
      },

      // Double Chance (DOUBLE_CHANCE)
      'DOUBLE_CHANCE': {
        'Home or Draw': '${homeTeam} will not lose to ${awayTeam}!',
        'Away or Draw': '${awayTeam} will not lose to ${homeTeam}!',
        'Home or Away': '${homeTeam} vs ${awayTeam} will not end in a draw!',
        '1X': '${homeTeam} will not lose to ${awayTeam}!',
        '2X': '${awayTeam} will not lose to ${homeTeam}!',
        '12': '${homeTeam} vs ${awayTeam} will not end in a draw!'
      },

      // Correct Score (CORRECT_SCORE)
      'CORRECT_SCORE': {
        '1-0': '${homeTeam} will beat ${awayTeam} 1-0!',
        '2-0': '${homeTeam} will beat ${awayTeam} 2-0!',
        '2-1': '${homeTeam} will beat ${awayTeam} 2-1!',
        '3-0': '${homeTeam} will beat ${awayTeam} 3-0!',
        '3-1': '${homeTeam} will beat ${awayTeam} 3-1!',
        '3-2': '${homeTeam} will beat ${awayTeam} 3-2!',
        '0-1': '${awayTeam} will beat ${homeTeam} 1-0!',
        '0-2': '${awayTeam} will beat ${homeTeam} 2-0!',
        '1-2': '${awayTeam} will beat ${homeTeam} 2-1!',
        '0-3': '${awayTeam} will beat ${homeTeam} 3-0!',
        '1-3': '${awayTeam} will beat ${homeTeam} 3-1!',
        '2-3': '${awayTeam} will beat ${homeTeam} 3-2!',
        '0-0': '${homeTeam} vs ${awayTeam} will end 0-0!',
        '1-1': '${homeTeam} vs ${awayTeam} will end 1-1!',
        '2-2': '${homeTeam} vs ${awayTeam} will end 2-2!'
      },

      // First Goal (FIRST_GOAL)
      'FIRST_GOAL': {
        'Home team scores first': '${homeTeam} will score first vs ${awayTeam}!',
        'Away team scores first': '${awayTeam} will score first vs ${homeTeam}!',
        'No goals': '${homeTeam} vs ${awayTeam} will have no goals!'
      },

      // Custom markets (CUSTOM)
      'CUSTOM': {
        'Over 0.5 goals': '${homeTeam} vs ${awayTeam} will have over 0.5 goals!',
        'Under 0.5 goals': '${homeTeam} vs ${awayTeam} will have under 0.5 goals!',
        'Over': '${homeTeam} vs ${awayTeam} will have over 0.5 goals!',
        'Under': '${homeTeam} vs ${awayTeam} will have under 0.5 goals!'
      },
      'OU15': {
        'Over 1.5 goals': '${homeTeam} vs ${awayTeam} will have over 1.5 goals!',
        'Under 1.5 goals': '${homeTeam} vs ${awayTeam} will have under 1.5 goals!',
        'Over': '${homeTeam} vs ${awayTeam} will have over 1.5 goals!',
        'Under': '${homeTeam} vs ${awayTeam} will have under 1.5 goals!'
      },
      'OU25': {
        'Over 2.5 goals': '${homeTeam} vs ${awayTeam} will have over 2.5 goals!',
        'Under 2.5 goals': '${homeTeam} vs ${awayTeam} will have under 2.5 goals!',
        'Over': '${homeTeam} vs ${awayTeam} will have over 2.5 goals!',
        'Under': '${homeTeam} vs ${awayTeam} will have under 2.5 goals!'
      },
      'OU35': {
        'Over 3.5 goals': '${homeTeam} vs ${awayTeam} will have over 3.5 goals!',
        'Under 3.5 goals': '${homeTeam} vs ${awayTeam} will have under 3.5 goals!',
        'Over': '${homeTeam} vs ${awayTeam} will have over 3.5 goals!',
        'Under': '${homeTeam} vs ${awayTeam} will have under 3.5 goals!'
      },

      // Both Teams To Score - Professional prediction market style
      'BTTS': {
        'Both teams to score': 'Both ${homeTeam} and ${awayTeam} will score!',
        'Not both teams to score': 'Both ${homeTeam} and ${awayTeam} will NOT score!',
        'Yes': 'Both ${homeTeam} and ${awayTeam} will score!',
        'No': 'Both ${homeTeam} and ${awayTeam} will NOT score!'
      },

      // Half-time markets - Professional prediction market style
      'HT_1X2': {
        'Home wins at half-time': '${homeTeam} will lead at half-time!',
        'Away wins at half-time': '${awayTeam} will lead at half-time!',
        'Draw at half-time': '${homeTeam} vs ${awayTeam} will be tied at half-time!',
        'Home': '${homeTeam} will lead at half-time!',
        'Away': '${awayTeam} will lead at half-time!',
        'Draw': '${homeTeam} vs ${awayTeam} will be tied at half-time!'
      },

      // Double Chance - Professional prediction market style
      'DC': {
        'Home or Draw': '${homeTeam} will win or draw!',
        'Away or Draw': '${awayTeam} will win or draw!',
        'Home or Away': '${homeTeam} or ${awayTeam} will win!',
        '1X': '${homeTeam} will win or draw!',
        'X2': '${awayTeam} will win or draw!',
        '12': '${homeTeam} or ${awayTeam} will win!'
      },

      // Correct Score - Professional prediction market style
      'CS': {
        '1-0': '${homeTeam} vs ${awayTeam} will end 1-0!',
        '2-0': '${homeTeam} vs ${awayTeam} will end 2-0!',
        '2-1': '${homeTeam} vs ${awayTeam} will end 2-1!',
        '3-0': '${homeTeam} vs ${awayTeam} will end 3-0!',
        '3-1': '${homeTeam} vs ${awayTeam} will end 3-1!',
        '3-2': '${homeTeam} vs ${awayTeam} will end 3-2!',
        '0-0': '${homeTeam} vs ${awayTeam} will end 0-0!',
        '1-1': '${homeTeam} vs ${awayTeam} will end 1-1!',
        '2-2': '${homeTeam} vs ${awayTeam} will end 2-2!',
        '0-1': '${homeTeam} vs ${awayTeam} will end 0-1!',
        '0-2': '${homeTeam} vs ${awayTeam} will end 0-2!',
        '1-2': '${homeTeam} vs ${awayTeam} will end 1-2!',
        '0-3': '${homeTeam} vs ${awayTeam} will end 0-3!',
        '1-3': '${homeTeam} vs ${awayTeam} will end 1-3!',
        '2-3': '${homeTeam} vs ${awayTeam} will end 2-3!'
      },

      // First Goalscorer - Professional prediction market style
      'FG': {
        'Home Team': '${homeTeam} will score first!',
        'Away Team': '${awayTeam} will score first!',
        'No Goals': 'There will be no goals in ${homeTeam} vs ${awayTeam}!',
        'Home': '${homeTeam} will score first!',
        'Away': '${awayTeam} will score first!',
        'None': 'There will be no goals in ${homeTeam} vs ${awayTeam}!'
      },

      // Half Time/Full Time - Professional prediction market style
      'HTFT': {
        'Home/Home': '${homeTeam} will lead at half-time and win!',
        'Home/Draw': '${homeTeam} will lead at half-time but draw!',
        'Home/Away': '${homeTeam} will lead at half-time but lose!',
        'Draw/Home': '${homeTeam} vs ${awayTeam} will be tied at half-time but ${homeTeam} will win!',
        'Draw/Draw': '${homeTeam} vs ${awayTeam} will be tied at half-time and full-time!',
        'Draw/Away': '${homeTeam} vs ${awayTeam} will be tied at half-time but ${awayTeam} will win!',
        'Away/Home': '${awayTeam} will lead at half-time but lose!',
        'Away/Draw': '${awayTeam} will lead at half-time but draw!',
        'Away/Away': '${awayTeam} will lead at half-time and win!'
      },

      // Crypto markets - Professional prediction market style
      'CRYPTO_UP': {
        'Up': '${homeTeam} will go up!',
        'Rise': '${homeTeam} will rise!',
        'Increase': '${homeTeam} will increase!'
      },
      'CRYPTO_DOWN': {
        'Down': '${homeTeam} will go down!',
        'Fall': '${homeTeam} will fall!',
        'Decrease': '${homeTeam} will decrease!'
      },
      'CRYPTO_TARGET': {
        'Above': '${homeTeam} will reach above target!',
        'Below': '${homeTeam} will stay below target!'
      }
    };

    return templates[marketType] || {};
  }

  private getShortTemplates(marketType: string): Record<string, string> {
    const shortTemplates: Record<string, Record<string, string>> = {
      'MONEYLINE': {
        'Home wins': '${homeTeam} will win',
        'Away wins': '${awayTeam} will win',
        'Draw': '${homeTeam} vs ${awayTeam} draw',
        '1': '${homeTeam} will win',
        '2': '${awayTeam} will win',
        'X': '${homeTeam} vs ${awayTeam} draw',
        'Home': '${homeTeam} will win',
        'Away': '${awayTeam} will win'
      },
      'OVER_UNDER': {
        'Over 2.5 goals': '${homeTeam} vs ${awayTeam} over 2.5',
        'Under 2.5 goals': '${homeTeam} vs ${awayTeam} under 2.5',
        'Over': '${homeTeam} vs ${awayTeam} over 2.5',
        'Under': '${homeTeam} vs ${awayTeam} under 2.5'
      },
      'BOTH_TEAMS_SCORE': {
        'Both teams to score': '${homeTeam} vs ${awayTeam} both score',
        'Not both teams to score': '${homeTeam} vs ${awayTeam} not both score',
        'Yes': '${homeTeam} vs ${awayTeam} both score',
        'No': '${homeTeam} vs ${awayTeam} not both score'
      }
    };

    return shortTemplates[marketType] || {};
  }

  /**
   * Generate team-specific title by determining which team is winning
   */
  private generateTeamSpecificTitle(predictedOutcome: string, homeTeam: string, awayTeam: string, marketType: string, short: boolean): string | null {
    // Check if the predicted outcome contains a team name
    const homeTeamLower = homeTeam.toLowerCase();
    const awayTeamLower = awayTeam.toLowerCase();
    const outcomeLower = predictedOutcome.toLowerCase();
    
    // Check if home team is winning
    if (outcomeLower.includes(homeTeamLower) && (outcomeLower.includes('wins') || outcomeLower.includes('win'))) {
      return short 
        ? `${homeTeam} will beat ${awayTeam} at home!`
        : `${homeTeam} will beat ${awayTeam} at home!`;
    }
    
    // Check if away team is winning
    if (outcomeLower.includes(awayTeamLower) && (outcomeLower.includes('wins') || outcomeLower.includes('win'))) {
      return short 
        ? `${awayTeam} will beat ${homeTeam} away!`
        : `${awayTeam} will beat ${homeTeam} away!`;
    }
    
    return null;
  }

  private isPartialMatch(predictedOutcome: string, key: string): boolean {
    const outcome = predictedOutcome.toLowerCase();
    const keyLower = key.toLowerCase();
    
    // Direct match
    if (outcome === keyLower) return true;
    
    // Check for exact word matches
    if (outcome.includes(keyLower) || keyLower.includes(outcome)) return true;
    
    return false;
  }

  private generateFallbackTitle(predictedOutcome: string, marketType: string): string {
    return predictedOutcome || `Prediction`;
  }

  private truncateTitle(title: string, maxLength: number): string {
    if (title.length <= maxLength) {
      return title;
    }
    return title.substring(0, maxLength - 3) + '...';
  }
}

// Export singleton instance
export const titleTemplatesService = new TitleTemplatesService();
export default titleTemplatesService;
