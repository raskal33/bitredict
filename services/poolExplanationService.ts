/**
 * Pool Explanation Service
 * Generates standardized titles, descriptions, and explanations for all market types
 */

export interface PoolData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  category: string;
  region: string;
  predictedOutcome: string;
  odds: number;
  marketType: number; // 0=MONEYLINE, 1=OVER_UNDER, 2=BOTH_TEAMS_SCORE, etc.
  eventStartTime: number;
  eventEndTime: number;
  usesBitr: boolean;
  creatorStake: string;
  marketId?: string; // Optional market ID
}

export interface PoolExplanation {
  title: string;
  description: string;
  creatorPosition: string;
  bettingExplanation: string;
  currencyBadge: {
    type: 'BITR' | 'STT';
    color: string;
    bgColor: string;
  };
  marketTypeBadge: {
    label: string;
    color: string;
    bgColor: string;
    marketType: number;
  };
}

export class PoolExplanationService {
  private static readonly MARKET_TYPES = {
    0: 'MONEYLINE',
    1: 'OVER_UNDER', 
    2: 'BOTH_TEAMS_SCORE',
    3: 'HALF_TIME',
    4: 'DOUBLE_CHANCE',
    5: 'CORRECT_SCORE',
    6: 'FIRST_GOAL',
    7: 'CUSTOM'
  };

  private static readonly MARKET_TYPE_LABELS = {
    0: 'FT 1X2',
    1: 'O/U 2.5',
    2: 'BTS',
    3: 'HT 1X2', 
    4: 'DC',
    5: 'CS',
    6: 'FG',
    7: 'CUSTOM'
  };

  private static readonly MARKET_TYPE_COLORS = {
    0: { color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    1: { color: 'text-green-400', bgColor: 'bg-green-500/20' },
    2: { color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    3: { color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    4: { color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    5: { color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
    6: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    7: { color: 'text-gray-400', bgColor: 'bg-gray-500/20' }
  };

  /**
   * Generate comprehensive pool explanation
   */
  static generateExplanation(poolData: PoolData): PoolExplanation {
    const eventTime = this.formatEventTime(poolData.eventStartTime);
    const marketTypeInfo = this.getMarketTypeInfo(poolData.marketType, poolData.predictedOutcome);
    const currencyInfo = this.getCurrencyInfo(poolData.usesBitr);
    
    return {
      title: this.generateTitle(poolData, eventTime),
      description: this.generateDescription(poolData),
      creatorPosition: this.generateCreatorPosition(poolData),
      bettingExplanation: this.generateBettingExplanation(poolData),
      currencyBadge: currencyInfo,
      marketTypeBadge: marketTypeInfo
    };
  }

  /**
   * Generate standardized title using title templates service
   */
  private static generateTitle(poolData: PoolData, eventTime: string): string {
    // Import title templates service
    const { titleTemplatesService } = require('./title-templates');
    
    try {
      // Map numeric market type to string format expected by title templates
      const getMarketTypeString = (marketType: number, predictedOutcome: string): string => {
        const marketTypeMap: Record<number, string> = {
          0: '1X2',           // MONEYLINE
          1: this.determineOverUnderType(predictedOutcome), // OVER_UNDER (determine from outcome)
          2: 'BTTS',          // BOTH_TEAMS_SCORE
          3: 'HT_1X2',        // HALF_TIME
          4: 'DC',            // DOUBLE_CHANCE
          5: 'CS',            // CORRECT_SCORE
          6: 'FG',            // FIRST_GOAL
          7: 'CUSTOM'         // CUSTOM
        };
        
        return marketTypeMap[marketType] || '1X2';
      };

      // Use the same title generation as enhanced pool cards
      const marketData = {
        marketType: getMarketTypeString(poolData.marketType, poolData.predictedOutcome),
        homeTeam: poolData.homeTeam,
        awayTeam: poolData.awayTeam,
        predictedOutcome: poolData.predictedOutcome,
        league: poolData.league,
        marketId: poolData.marketId || ''
      };
      
      // Generate professional title using templates
      const generatedTitle = titleTemplatesService.generateTitle(marketData, {
        short: false,
        includeLeague: false,
        maxLength: 60
      });
      
      return generatedTitle;
    } catch (error) {
      console.error('Error generating title with templates:', error);
      // Fallback to generic title
      const marketTypeLabel = this.MARKET_TYPE_LABELS[poolData.marketType as keyof typeof this.MARKET_TYPE_LABELS] || 'FT 1X2';
      return `${eventTime} ${poolData.homeTeam} vs ${poolData.awayTeam} "${marketTypeLabel}" "${poolData.odds.toFixed(2)}" ${poolData.league}`;
    }
  }

  /**
   * Determine the correct Over/Under type based on predicted outcome
   */
  private static determineOverUnderType(predictedOutcome: string): string {
    const outcome = predictedOutcome.toLowerCase();
    
    // Check for specific over/under values in the outcome
    if (outcome.includes('0.5')) return 'OU05';
    if (outcome.includes('1.5')) return 'OU15';
    if (outcome.includes('2.5')) return 'OU25';
    if (outcome.includes('3.5')) return 'OU35';
    if (outcome.includes('4.5')) return 'OU45';
    
    // Default to 2.5 if no specific value found
    return 'OU25';
  }

  /**
   * Generate description
   */
  private static generateDescription(poolData: PoolData): string {
    const outcome = this.parsePredictedOutcome(poolData.predictedOutcome, poolData.homeTeam, poolData.awayTeam);
    return `Creator believes "${outcome}" WON'T happen. Challenge them if you think it WILL!`;
  }

  /**
   * Generate creator position text
   */
  private static generateCreatorPosition(poolData: PoolData): string {
    const outcome = this.parsePredictedOutcome(poolData.predictedOutcome, poolData.homeTeam, poolData.awayTeam);
    return `Creator believes "${outcome}" WON'T happen`;
  }

  /**
   * Generate betting explanation
   */
  private static generateBettingExplanation(poolData: PoolData): string {
    const outcome = this.parsePredictedOutcome(poolData.predictedOutcome, poolData.homeTeam, poolData.awayTeam);
    return `Creator believes "${outcome}" WON'T happen. Challenge them if you think it WILL! When you bet YES, and ${this.getWinningCondition(poolData)} you will win "${poolData.odds.toFixed(2)}X" of your stake!`;
  }

  /**
   * Parse predicted outcome to readable text
   */
  private static parsePredictedOutcome(predictedOutcome: string, homeTeam: string, awayTeam: string): string {
    const outcome = predictedOutcome.toLowerCase();
    const homeTeamLower = homeTeam.toLowerCase();
    const awayTeamLower = awayTeam.toLowerCase();

    // Handle team-specific outcomes
    if (outcome.includes(homeTeamLower) && (outcome.includes('wins') || outcome.includes('win'))) {
      return `${homeTeam} wins`;
    }
    if (outcome.includes(awayTeamLower) && (outcome.includes('wins') || outcome.includes('win'))) {
      return `${awayTeam} wins`;
    }
    if (outcome.includes(homeTeamLower) && (outcome.includes('will') || outcome.includes('beat'))) {
      return `${homeTeam} will beat ${awayTeam}`;
    }
    if (outcome.includes(awayTeamLower) && (outcome.includes('will') || outcome.includes('beat'))) {
      return `${awayTeam} will beat ${homeTeam}`;
    }

    // Handle generic outcomes
    if (outcome.includes('over') && outcome.includes('2.5')) {
      return 'Over 2.5 goals';
    }
    if (outcome.includes('under') && outcome.includes('2.5')) {
      return 'Under 2.5 goals';
    }
    if (outcome.includes('both') && outcome.includes('score')) {
      return 'Both teams to score';
    }
    if (outcome.includes('first') && outcome.includes('goal')) {
      return 'First goal scorer';
    }

    // Fallback to original outcome
    return predictedOutcome;
  }

  /**
   * Get winning condition for betting explanation
   */
  private static getWinningCondition(poolData: PoolData): string {
    const outcome = this.parsePredictedOutcome(poolData.predictedOutcome, poolData.homeTeam, poolData.awayTeam);
    
    if (outcome.includes('wins')) {
      return outcome;
    }
    if (outcome.includes('Over 2.5')) {
      return 'over 2.5 goals are scored';
    }
    if (outcome.includes('Under 2.5')) {
      return 'under 2.5 goals are scored';
    }
    if (outcome.includes('Both teams')) {
      return 'both teams score';
    }
    
    return outcome;
  }

  /**
   * Format event time
   */
  private static formatEventTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      timeZone: 'UTC' 
    }) + ' UTC';
  }

  /**
   * Get market type info
   */
  private static getMarketTypeInfo(marketType: number, predictedOutcome?: string): { label: string; color: string; bgColor: string; marketType: number } {
    console.log('🔍 getMarketTypeInfo - marketType:', marketType, 'predictedOutcome:', predictedOutcome);
    
    // Use predicted outcome if available, otherwise use market type label
    const label = predictedOutcome && predictedOutcome.trim() !== '' 
      ? predictedOutcome 
      : this.MARKET_TYPE_LABELS[marketType as keyof typeof this.MARKET_TYPE_LABELS] || 'FT 1X2';
    const colors = this.MARKET_TYPE_COLORS[marketType as keyof typeof this.MARKET_TYPE_COLORS] || this.MARKET_TYPE_COLORS[0];
    
    console.log('🔍 getMarketTypeInfo - final label:', label, 'colors:', colors);
    
    return {
      label,
      color: colors.color,
      bgColor: colors.bgColor,
      marketType
    };
  }

  /**
   * Get currency info
   */
  private static getCurrencyInfo(usesBitr: boolean): { type: 'BITR' | 'STT'; color: string; bgColor: string } {
    if (usesBitr) {
      return {
        type: 'BITR',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20'
      };
    } else {
      return {
        type: 'STT',
        color: 'text-blue-400', 
        bgColor: 'bg-blue-500/20'
      };
    }
  }

  /**
   * Generate currency badge component props
   */
  static getCurrencyBadgeProps(usesBitr: boolean) {
    const info = this.getCurrencyInfo(usesBitr);
    return {
      children: info.type,
      className: `px-2 py-1 rounded-full text-xs font-bold ${info.color} ${info.bgColor} border border-current/20`
    };
  }

  /**
   * Generate market type badge component props
   */
  static getMarketTypeBadgeProps(marketType: number) {
    const info = this.getMarketTypeInfo(marketType);
    return {
      children: info.label,
      className: `px-2 py-1 rounded-full text-xs font-bold ${info.color} ${info.bgColor} border border-current/20`
    };
  }
}
