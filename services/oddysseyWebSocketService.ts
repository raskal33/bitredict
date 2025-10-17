"use client";

import websocketClient from './websocket-client';
import { OddysseySlip } from './oddysseyService';

export interface SlipPlacedEvent {
  type: 'slip:placed';
  slipId: number;
  cycleId: number;
  userAddress: string;
  timestamp: number;
  predictions: any[];
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
    console.log('🎉 New slip placed:', {
      slipId: event.slipId,
      cycleId: event.cycleId,
      predictionsCount: event.predictions?.length,
      timestamp: new Date(event.timestamp * 1000).toLocaleString()
    });
    
    // Dispatch custom event for UI components to listen
    window.dispatchEvent(new CustomEvent('oddyssey:slip:placed', { detail: event }));
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
