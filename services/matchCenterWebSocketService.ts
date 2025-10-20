"use client";

import websocketClient from './websocket-client';

export interface MatchUpdateEvent {
  type: 'match:score_updated';
  fixtureId: string;
  score: {
    home: number;
    away: number;
    current: string;
    ht?: string;
    ft?: string;
  };
  status: string;
  timestamp: number;
}

export interface GoalScoredEvent {
  type: 'match:goal_scored';
  fixtureId: string;
  player: string;
  minute: number;
  team: 'home' | 'away';
  timestamp: number;
}

export interface MatchEventEvent {
  type: 'match:event';
  fixtureId: string;
  eventType: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  player: string;
  minute: number;
  team: 'home' | 'away';
  timestamp: number;
}

export interface MatchStatusChangeEvent {
  type: 'match:status_changed';
  fixtureId: string;
  status: string;
  timestamp: number;
}

export type MatchCenterWebSocketEvent = 
  | MatchUpdateEvent 
  | GoalScoredEvent 
  | MatchEventEvent 
  | MatchStatusChangeEvent;

class MatchCenterWebSocketService {
  private fixtureSubscriptions: Map<string, () => void> = new Map();
  private listeners: Map<string, Set<(event: MatchCenterWebSocketEvent) => void>> = new Map();

  /**
   * Subscribe to fixture match updates (score, status, events)
   */
  subscribeToFixture(fixtureId: string, onUpdate: (event: MatchCenterWebSocketEvent) => void) {
    if (!this.listeners.has(fixtureId)) {
      this.listeners.set(fixtureId, new Set());
    }
    
    const listeners = this.listeners.get(fixtureId)!;
    listeners.add(onUpdate);

    // If this is the first subscription for this fixture, subscribe to WebSocket channel
    if (listeners.size === 1) {
      this.setupFixtureChannel(fixtureId);
    }

    // Return unsubscribe function
    return () => {
      listeners.delete(onUpdate);
      if (listeners.size === 0) {
        this.unsubscribeFromFixture(fixtureId);
      }
    };
  }

  /**
   * Setup WebSocket channel for fixture
   */
  private setupFixtureChannel(fixtureId: string) {
    const channel = `fixture:${fixtureId}`;
    
    // Subscribe to WebSocket channel
    const unsubscribe = websocketClient.subscribe(channel, (event: any) => {
      console.log(`📡 Match update received for fixture ${fixtureId}:`, event);
      
      // Broadcast to all listeners for this fixture
      const listeners = this.listeners.get(fixtureId);
      if (listeners) {
        listeners.forEach(listener => {
          try {
            listener(event as MatchCenterWebSocketEvent);
          } catch (err) {
            console.error('Error in Match Center WebSocket listener:', err);
          }
        });
      }
    });

    this.fixtureSubscriptions.set(fixtureId, unsubscribe);
    console.log(`✅ Subscribed to fixture updates: ${fixtureId}`);
  }

  /**
   * Unsubscribe from fixture
   */
  private unsubscribeFromFixture(fixtureId: string) {
    const unsubscribe = this.fixtureSubscriptions.get(fixtureId);
    if (unsubscribe) {
      unsubscribe();
      this.fixtureSubscriptions.delete(fixtureId);
      this.listeners.delete(fixtureId);
      console.log(`✅ Unsubscribed from fixture: ${fixtureId}`);
    }
  }

  /**
   * Handle score update
   */
  onScoreUpdate(fixtureId: string, callback: (event: MatchUpdateEvent) => void) {
    return this.subscribeToFixture(fixtureId, (event) => {
      if (event.type === 'match:score_updated') {
        callback(event as MatchUpdateEvent);
      }
    });
  }

  /**
   * Handle goal scored
   */
  onGoalScored(fixtureId: string, callback: (event: GoalScoredEvent) => void) {
    return this.subscribeToFixture(fixtureId, (event) => {
      if (event.type === 'match:goal_scored') {
        callback(event as GoalScoredEvent);
      }
    });
  }

  /**
   * Handle match events (goal, card, substitution)
   */
  onMatchEvent(fixtureId: string, callback: (event: MatchEventEvent) => void) {
    return this.subscribeToFixture(fixtureId, (event) => {
      if (event.type === 'match:event') {
        callback(event as MatchEventEvent);
      }
    });
  }

  /**
   * Handle status change
   */
  onStatusChange(fixtureId: string, callback: (event: MatchStatusChangeEvent) => void) {
    return this.subscribeToFixture(fixtureId, (event) => {
      if (event.type === 'match:status_changed') {
        callback(event as MatchStatusChangeEvent);
      }
    });
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    this.fixtureSubscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.fixtureSubscriptions.clear();
    this.listeners.clear();
    console.log('✅ Match Center WebSocket cleaned up');
  }
}

// Export singleton instance
const matchCenterWebSocketService = new MatchCenterWebSocketService();
export default matchCenterWebSocketService;
