"use client";

import websocketClient from './websocket-client';
import { OddysseySlip } from './oddysseyService';

export interface SlipPlacedEvent {
  type: 'slip:placed';
  slipId: number;
  cycleId: number;
  userAddress: string;
  timestamp: number;
  predictions: Array<[number, number, string, number]>; // [matchId, betType, selectionHash, odds]
  placedAt: string; // ISO timestamp
  processedPredictions?: Array<{
    matchId: number;
    betType: number;
    selection: string;
    selectedOdd: number;
    homeTeam: string;
    awayTeam: string;
    leagueName: string;
    isCorrect?: boolean;
  }>;
  totalOdds?: number;
  displayText?: string;
}

export interface RawPrediction {
  matchId: number;
  betType: number;
  selectionHash: string;
  odds: number; // Scaled odds (e.g., 1570 = 1.57)
}

export interface EnrichedPrediction {
  matchId: string;
  prediction: string; // Decoded selection (home/draw/away/over/under)
  home_team: string;
  away_team: string;
  league_name: string;
  match_time: string;
  odds: number; // Decimal odds (e.g., 1.57)
  isCorrect?: boolean;
  actualResult?: string;
  matchResult?: any;
}

export interface SlipEvaluatedEvent {
  type: 'slip:evaluated';
  slipId: number;
  cycleId: number;
  userAddress: string;
  correctCount: number;
  finalScore: number;
  timestamp: number;
}

export interface SlipPrizeClaimedEvent {
  type: 'slip:prize_claimed';
  slipId: number;
  cycleId: number;
  userAddress: string;
  rank: number;
  prizeAmount: string;
  timestamp: number;
}

export type OddysseyWebSocketEvent = 
  | SlipPlacedEvent 
  | SlipEvaluatedEvent 
  | SlipPrizeClaimedEvent;

class OddysseyWebSocketService {
  private userAddress: string | null = null;
  private activeSubscriptions: Map<string, () => void> = new Map();

  /**
   * Decode selection hash to human-readable selection
   */
  private decodeSelectionHash(selectionHash: string, betType: number): string {
    // Common selection hashes for different bet types
    const hashMap: Record<string, Record<number, string>> = {
      // 1X2 Bets (betType = 0)
      '0x09492a13': { 0: 'home' },   // Home win
      '0xc89efdaa': { 0: 'draw' },   // Draw
      '0xad7c5bef': { 0: 'away' },   // Away win
      
      // Over/Under Bets (betType = 1)
      '0xe5f3458d': { 1: 'under' },  // Under 2.5
      
      // BTTS Bets (betType = 2)
      '0x12345678': { 2: 'yes' },    // Both teams to score
      '0x87654321': { 2: 'no' },     // Not both teams to score
    };

    const decoded = hashMap[selectionHash.toLowerCase()]?.[betType];
    return decoded || 'unknown';
  }

  /**
   * Convert raw WebSocket prediction to readable format
   */
  private convertRawPrediction(rawPred: [number, number, string, number]): RawPrediction {
    const [matchId, betType, selectionHash, odds] = rawPred;
    return {
      matchId,
      betType,
      selectionHash,
      odds
    };
  }

  /**
   * Get bet type display name
   */
  private getBetTypeDisplay(betType: number): string {
    switch (betType) {
      case 0: return '1X2';
      case 1: return 'Over/Under';
      case 2: return 'BTTS';
      case 3: return 'Half Time';
      case 4: return 'Double Chance';
      case 5: return 'Correct Score';
      case 6: return 'First Goal';
      case 7: return 'Half Time/Full Time';
      default: return 'Unknown';
    }
  }

  /**
   * Initialize subscriptions for a user
   */
  public initializeUserSubscriptions(userAddress: string) {
    // Only initialize if address changed
    if (this.userAddress === userAddress && this.activeSubscriptions.size > 0) {
      console.log('📡 User subscriptions already initialized');
      return;
    }

    this.userAddress = userAddress;
    console.log('📡 Initializing WebSocket subscriptions for user:', userAddress);

    // Subscribe to all user slip events
    const unsubscribeAll = websocketClient.subscribeToUserSlips(
      userAddress,
      (event: OddysseyWebSocketEvent) => {
        console.log('📡 Received slip event:', event);
        this.handleSlipEvent(event);
      }
    );

    this.activeSubscriptions.set('slips:all', unsubscribeAll);
  }

  /**
   * Subscribe to slip placed events
   */
  public onSlipPlaced(
    userAddress: string,
    callback: (event: SlipPlacedEvent) => void
  ) {
    const unsubscribe = websocketClient.subscribeToSlipPlaced(
      userAddress,
      (data: SlipPlacedEvent) => {
        console.log('✅ Slip placed event:', data);
        callback(data);
      }
    );

    const key = `slip:placed:${userAddress}`;
    this.activeSubscriptions.set(key, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to slip evaluated events
   */
  public onSlipEvaluated(
    userAddress: string,
    callback: (event: SlipEvaluatedEvent) => void
  ) {
    const unsubscribe = websocketClient.subscribeToSlipEvaluated(
      userAddress,
      (data: SlipEvaluatedEvent) => {
        console.log('📊 Slip evaluated event:', data);
        callback(data);
      }
    );

    const key = `slip:evaluated:${userAddress}`;
    this.activeSubscriptions.set(key, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to prize claimed events
   */
  public onSlipPrizeClaimed(
    userAddress: string,
    callback: (event: SlipPrizeClaimedEvent) => void
  ) {
    const unsubscribe = websocketClient.subscribeToSlipPrizeClaimed(
      userAddress,
      (data: SlipPrizeClaimedEvent) => {
        console.log('🏆 Prize claimed event:', data);
        callback(data);
      }
    );

    const key = `slip:prize_claimed:${userAddress}`;
    this.activeSubscriptions.set(key, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to live slip evaluation
   */
  public onLiveSlipEvaluation(
    slipId: number,
    callback: (data: any) => void
  ) {
    const unsubscribe = websocketClient.subscribeToLiveSlipEvaluation(
      slipId,
      (data) => {
        console.log(`📈 Live evaluation for slip ${slipId}:`, data);
        callback(data);
      }
    );

    const key = `slip:evaluation:${slipId}`;
    this.activeSubscriptions.set(key, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to cycle events
   */
  public onCycleEvents(
    cycleId: number,
    callback: (data: any) => void
  ) {
    const unsubscribe = websocketClient.subscribeToOddysseyCycle(
      cycleId,
      (data) => {
        console.log(`🎯 Cycle ${cycleId} event:`, data);
        callback(data);
      }
    );

    const key = `cycle:${cycleId}`;
    this.activeSubscriptions.set(key, unsubscribe);
    return unsubscribe;
  }

  /**
   * Handle incoming slip event
   */
  private handleSlipEvent(event: OddysseyWebSocketEvent) {
    switch (event.type) {
      case 'slip:placed':
        this.handleSlipPlaced(event);
        break;
      case 'slip:evaluated':
        this.handleSlipEvaluated(event);
        break;
      case 'slip:prize_claimed':
        this.handleSlipPrizeClaimed(event);
        break;
      default:
        console.warn('Unknown event type:', event);
    }
  }

  /**
   * Handle slip placed event
   */
  private handleSlipPlaced(event: SlipPlacedEvent) {
    console.log('🎉 New slip placed (WebSocket):', {
      slipId: event.slipId,
      cycleId: event.cycleId,
      predictionsCount: event.predictions?.length,
      timestamp: event.placedAt,
      rawPredictions: event.predictions
    });

    // Convert raw predictions to readable format
    const processedPredictions = event.predictions.map((rawPred, index) => {
      const prediction = this.convertRawPrediction(rawPred);
      const decodedSelection = this.decodeSelectionHash(prediction.selectionHash, prediction.betType);
      const decimalOdds = prediction.odds / 1000; // Convert scaled odds to decimal
      
      console.log(`🔍 Prediction ${index}:`, {
        matchId: prediction.matchId,
        betType: this.getBetTypeDisplay(prediction.betType),
        selection: decodedSelection,
        odds: `${decimalOdds.toFixed(2)}x`,
        rawHash: prediction.selectionHash
      });

      return {
        matchId: prediction.matchId,
        betType: prediction.betType,
        selection: decodedSelection,
        selectedOdd: decimalOdds,
        homeTeam: '', // Will be enriched later via REST API
        awayTeam: '', // Will be enriched later via REST API
        leagueName: '', // Will be enriched later via REST API
        isCorrect: undefined // Will be set when evaluated
      };
    });

    // Create enriched event with processed data
    const enrichedEvent = {
      ...event,
      processedPredictions,
      totalOdds: processedPredictions.reduce((acc, pred) => acc * pred.selectedOdd, 1),
      displayText: `Slip #${event.slipId} - ${event.predictions.length} predictions - Just placed!`
    };

    console.log('🎉 Processed slip data:', enrichedEvent);
    
    // Dispatch custom event for UI components to listen
    window.dispatchEvent(new CustomEvent('oddyssey:slip:placed', { detail: enrichedEvent }));
  }

  /**
   * Handle slip evaluated event
   */
  private handleSlipEvaluated(event: SlipEvaluatedEvent) {
    console.log('📊 Slip evaluated:', {
      slipId: event.slipId,
      correctCount: event.correctCount,
      finalScore: event.finalScore,
      timestamp: new Date(event.timestamp * 1000).toLocaleString()
    });
    
    // Dispatch custom event for UI components to listen
    window.dispatchEvent(new CustomEvent('oddyssey:slip:evaluated', { detail: event }));
  }

  /**
   * Handle prize claimed event
   */
  private handleSlipPrizeClaimed(event: SlipPrizeClaimedEvent) {
    console.log('🏆 Prize claimed:', {
      slipId: event.slipId,
      rank: event.rank,
      prizeAmount: event.prizeAmount,
      timestamp: new Date(event.timestamp * 1000).toLocaleString()
    });
    
    // Dispatch custom event for UI components to listen
    window.dispatchEvent(new CustomEvent('oddyssey:prize:claimed', { detail: event }));
  }

  /**
   * Cleanup all subscriptions
   */
  public cleanup() {
    console.log('📡 Cleaning up WebSocket subscriptions');
    this.activeSubscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeSubscriptions.clear();
    this.userAddress = null;
  }

  /**
   * Enrich slip data with REST API details
   */
  public async enrichSlipData(slipId: number, userAddress: string, options?: { skipCache?: boolean }): Promise<EnrichedPrediction[] | null> {
    try {
      console.log(`🔍 Enriching slip ${slipId} with REST API data ${options?.skipCache ? '(bypassing cache)' : ''}...`);
      
      // Use Oddyssey-specific endpoint which has predictions enrichment
      const cacheParam = options?.skipCache ? `&t=${Date.now()}` : '';
      const response = await fetch(`/api/oddyssey/user-slips/${userAddress}?limit=50&offset=0${cacheParam}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch enriched slip data: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const slips = data.data || [];
      
      // Find the specific slip
      const targetSlip = slips.find((slip: any) => slip.slip_id === slipId || slip.id === slipId);
      
      if (!targetSlip) {
        console.warn(`Slip ${slipId} not found in REST API response`);
        return null;
      }

      console.log(`✅ Found enriched data for slip ${slipId}:`, targetSlip.predictions);
      
      return targetSlip.predictions || [];
    } catch (error) {
      console.error(`Error enriching slip ${slipId}:`, error);
      return null;
    }
  }

  /**
   * Get subscription stats
   */
  public getStats() {
    return {
      userAddress: this.userAddress,
      activeSubscriptions: this.activeSubscriptions.size,
      subscriptionChannels: Array.from(this.activeSubscriptions.keys()),
      wsStats: websocketClient.getStats()
    };
  }
}

// Create and export singleton instance
export const oddysseyWebSocketService = new OddysseyWebSocketService();

export default oddysseyWebSocketService;
