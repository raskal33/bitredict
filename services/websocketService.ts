/**
 * WebSocket Service for Real-time Updates
 * Handles WebSocket connections and real-time data updates
 */

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface PoolProgressUpdate {
  poolId: number;
  fillPercentage: number;
  totalBettorStake: string;
  maxPoolSize: string;
  participants: number;
  lastUpdated: number;
}

export interface NewBetUpdate {
  poolId: number;
  bettor: string;
  amount: string;
  isForOutcome: boolean;
  timestamp: number;
  poolTitle: string;
  category: string;
}

export interface PoolUpdate {
  poolId: number;
  status: 'active' | 'closed' | 'settled';
  canBet: boolean;
  isEventStarted: boolean;
  isPoolFilled: boolean;
}

export type WebSocketEventHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private subscriptions: Set<string> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(url: string = process.env.NEXT_PUBLIC_WS_URL || 'wss://bitredict-backend.fly.dev') {
    // Append /ws if not already included
    this.url = url.includes('/ws') ? url : `${url}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Resubscribe to all channels
        this.resubscribe();
        
        this.emit('connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.isConnecting = false;
        this.stopHeartbeat();
        
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        // Attempt to reconnect if not a manual close
        if (event.code !== 1000) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.subscriptions.clear();
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string): void {
    this.subscriptions.add(channel);
    
    if (this.isConnected && this.ws) {
      this.send({
        type: 'subscribe',
        channel: channel
      });
    }
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string): void {
    this.subscriptions.delete(channel);
    
    if (this.isConnected && this.ws) {
      this.send({
        type: 'unsubscribe',
        channel: channel
      });
    }
  }

  /**
   * Subscribe to pool progress updates
   */
  subscribeToPoolProgress(poolId: number): void {
    this.subscribe(`pool:${poolId}:progress`);
  }

  /**
   * Unsubscribe from pool progress updates
   */
  unsubscribeFromPoolProgress(poolId: number): void {
    this.unsubscribe(`pool:${poolId}:progress`);
  }

  /**
   * Subscribe to recent bets updates
   */
  subscribeToRecentBets(): void {
    this.subscribe('recent_bets');
  }

  /**
   * Unsubscribe from recent bets updates
   */
  unsubscribeFromRecentBets(): void {
    this.unsubscribe('recent_bets');
  }

  /**
   * Subscribe to pool updates
   */
  subscribeToPoolUpdates(poolId: number): void {
    this.subscribe(`pool:${poolId}:updates`);
  }

  /**
   * Unsubscribe from pool updates
   */
  unsubscribeFromPoolUpdates(poolId: number): void {
    this.unsubscribe(`pool:${poolId}:updates`);
  }

  /**
   * Add event handler
   */
  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove event handler
   */
  off(event: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to handlers
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in WebSocket event handler:', error);
        }
      });
    }
  }

  /**
   * Send message to WebSocket server
   */
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'pool_progress':
        this.emit('pool_progress', message.data);
        break;
      case 'new_bet':
        this.emit('new_bet', message.data);
        break;
      case 'pool_update':
        this.emit('pool_update', message.data);
        break;
      case 'pong':
        // Heartbeat response
        break;
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed', {});
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Resubscribe to all channels after reconnection
   */
  private resubscribe(): void {
    this.subscriptions.forEach(channel => {
      this.send({
        type: 'subscribe',
        channel: channel
      });
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; connecting: boolean } {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting
    };
  }

  /**
   * Get subscribed channels
   */
  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }
}

export const websocketService = new WebSocketService();
