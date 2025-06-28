import footballData from '@/data/footballMatches.json';
import cryptoData from '@/data/cryptocurrencies.json';

export interface FootballMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  date: string;
  venue: string;
  status: string;
  round: string;
}

export interface Competition {
  id: string;
  name: string;
  country: string;
  logo: string;
}

export interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  logo: string;
  coingeckoId: string;
}

export interface TimeOption {
  value: string;
  label: string;
  days: number;
}

export class GuidedMarketService {
  // Football Methods
  static getFootballMatches(): FootballMatch[] {
    return footballData.matches.filter(match => {
      const matchDate = new Date(match.date);
      const now = new Date();
      const minStartTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      return matchDate > minStartTime; // Only return future matches
    });
  }

  static getCompetitions(): Competition[] {
    return footballData.competitions;
  }

  static searchFootballMatches(query: string): FootballMatch[] {
    const matches = this.getFootballMatches();
    const lowerQuery = query.toLowerCase();
    
    return matches.filter(match => 
      match.homeTeam.toLowerCase().includes(lowerQuery) ||
      match.awayTeam.toLowerCase().includes(lowerQuery) ||
      match.competition.toLowerCase().includes(lowerQuery) ||
      match.venue.toLowerCase().includes(lowerQuery)
    );
  }

  static getMatchById(id: string): FootballMatch | null {
    return footballData.matches.find(match => match.id === id) || null;
  }

  static formatMatchDisplay(match: FootballMatch): string {
    const date = new Date(match.date);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${match.homeTeam} vs ${match.awayTeam} - ${match.competition} (${dateStr} ${timeStr})`;
  }

  // Cryptocurrency Methods
  static getCryptocurrencies(): Cryptocurrency[] {
    return cryptoData.cryptocurrencies;
  }

  static getTimeOptions(): TimeOption[] {
    return cryptoData.timeOptions;
  }

  static searchCryptocurrencies(query: string): Cryptocurrency[] {
    const cryptos = this.getCryptocurrencies();
    const lowerQuery = query.toLowerCase();
    
    return cryptos.filter(crypto => 
      crypto.name.toLowerCase().includes(lowerQuery) ||
      crypto.symbol.toLowerCase().includes(lowerQuery)
    );
  }

  static getCryptocurrencyById(id: string): Cryptocurrency | null {
    return cryptoData.cryptocurrencies.find(crypto => crypto.id === id) || null;
  }

  static formatCryptoDisplay(crypto: Cryptocurrency): string {
    return `${crypto.logo} ${crypto.name} (${crypto.symbol}) - $${crypto.currentPrice.toLocaleString()}`;
  }

  // Market Creation Helpers
  static generateFootballMarketTitle(match: FootballMatch, outcome: 'home' | 'away' | 'draw'): string {
    switch (outcome) {
      case 'home':
        return `${match.homeTeam} will beat ${match.awayTeam}`;
      case 'away':
        return `${match.awayTeam} will beat ${match.homeTeam}`;
      case 'draw':
        return `${match.homeTeam} vs ${match.awayTeam} will end in a draw`;
      default:
        return `${match.homeTeam} vs ${match.awayTeam}`;
    }
  }

  static generateCryptoMarketTitle(crypto: Cryptocurrency, targetPrice: number, timeframe: string, direction: 'above' | 'below'): string {
    const directionText = direction === 'above' ? 'above' : 'below';
    return `${crypto.name} (${crypto.symbol}) will be ${directionText} $${targetPrice.toLocaleString()} in ${timeframe}`;
  }

  static calculateEventTimes(timeOption: TimeOption): { startTime: Date; endTime: Date } {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now (betting closes)
    const endTime = new Date(startTime.getTime() + timeOption.days * 24 * 60 * 60 * 1000); // End time based on selected duration
    
    return { startTime, endTime };
  }

  static validateMarketCreation(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Common validations
    if (!data.odds || data.odds < 101 || data.odds > 1000) {
      errors.push('Odds must be between 1.01x and 10x for guided markets');
    }

    if (!data.creatorStake || data.creatorStake < 10) {
      errors.push('Minimum creator stake is 10 tokens for guided markets');
    }

    // Category-specific validations
    if (data.category === 'football') {
      if (!data.selectedMatch) {
        errors.push('Please select a football match');
      }
      if (!data.outcome || !['home', 'away', 'draw'].includes(data.outcome)) {
        errors.push('Please select a valid outcome (Home Win, Away Win, or Draw)');
      }
    }

    if (data.category === 'cryptocurrency') {
      if (!data.selectedCrypto) {
        errors.push('Please select a cryptocurrency');
      }
      if (!data.targetPrice || data.targetPrice <= 0) {
        errors.push('Please enter a target price');
      }
      if (!data.timeframe) {
        errors.push('Please select a timeframe');
      }
      if (!data.direction || !['above', 'below'].includes(data.direction)) {
        errors.push('Please select price direction (Above or Below)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 