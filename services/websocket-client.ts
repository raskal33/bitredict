"use client";

interface WebSocketMessage {
  type: string;
  channel: string;
  data: any;
}

interface Subscription {
  channel: string;
  callback: (data: any) => void;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, Subscription[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isInitialized = false;

  // Lazy connection - don't auto-connect on construction
  constructor() {
    // Connection will be established when first subscription is made
  }

  private ensureConnection() {
    if (!this.isInitialized) {
      this.isInitialized = true;
      this.connect();
    }
  }

  private connect() {
    try {
      // Get WebSocket URL from environment or fallback to backend URL
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';
      
      // Convert http/https to ws/wss
      let wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      
      // Append /ws if not already present - PREVENT DOUBLE /ws
      if (!wsUrl.endsWith('/ws')) {
        wsUrl = `${wsUrl}/ws`;
      }
      
      console.log('🔌 Connecting to WebSocket (websocket-client singleton):', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.stopHeartbeat();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const subscriptions = this.subscriptions.get(message.channel) || [];
    subscriptions.forEach(sub => {
      try {
        // Add null check for message.data
        if (message.data !== undefined && message.data !== null) {
          sub.callback(message.data);
        } else {
          console.warn('Received undefined/null WebSocket data for channel:', message.channel);
        }
      } catch (error) {
        console.error('Error in subscription callback:', error);
      }
    });
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  public subscribe(channel: string, callback: (data: any) => void) {
    // Ensure connection is established
    this.ensureConnection();
    
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
    }
    
    this.subscriptions.get(channel)!.push({ channel, callback });
    
    // Send subscription message to server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel
      }));
    }
    
    return () => this.unsubscribe(channel, callback);
  }

  public unsubscribe(channel: string, callback: (data: any) => void) {
    const subscriptions = this.subscriptions.get(channel);
    if (subscriptions) {
      const index = subscriptions.findIndex(sub => sub.callback === callback);
      if (index > -1) {
        subscriptions.splice(index, 1);
        if (subscriptions.length === 0) {
          this.subscriptions.delete(channel);
        }
      }
    }
  }

  public subscribeToPoolProgress(poolId: string, callback: (data: any) => void) {
    return this.subscribe(`pool:${poolId}:progress`, callback);
  }

  public subscribeToRecentBets(callback: (data: any) => void) {
    return this.subscribe('recent_bets', callback);
  }

  public subscribeToPoolUpdates(poolId: string, callback: (data: any) => void) {
    return this.subscribe(`pool:${poolId}:updates`, callback);
  }

  // ===== ODDYSSEY SUBSCRIPTION METHODS =====
  
  /**
   * Subscribe to user's slip events (placed, evaluated, prize claimed)
   * @param userAddress The user's wallet address
   * @param callback Callback function for slip events
   */
  public subscribeToUserSlips(userAddress: string, callback: (data: any) => void) {
    console.log(`🎯 Subscribing to slips for user: ${userAddress}`);
    return this.subscribe(`slips:user:${userAddress}`, callback);
  }

  /**
   * Subscribe to slip placed events for a specific user
   * @param userAddress The user's wallet address
   * @param callback Callback function for slip placed events
   */
  public subscribeToSlipPlaced(userAddress: string, callback: (data: any) => void) {
    console.log(`🎯 Subscribing to slip:placed events for user: ${userAddress}`);
    return this.subscribe(`slip:placed:user:${userAddress}`, callback);
  }

  /**
   * Subscribe to slip evaluated events for a specific user
   * @param userAddress The user's wallet address
   * @param callback Callback function for slip evaluated events
   */
  public subscribeToSlipEvaluated(userAddress: string, callback: (data: any) => void) {
    console.log(`🎯 Subscribing to slip:evaluated events for user: ${userAddress}`);
    return this.subscribe(`slip:evaluated:user:${userAddress}`, callback);
  }

  /**
   * Subscribe to prize claimed events for a specific user
   * @param userAddress The user's wallet address
   * @param callback Callback function for prize claimed events
   */
  public subscribeToSlipPrizeClaimed(userAddress: string, callback: (data: any) => void) {
    console.log(`🎯 Subscribing to slip:prize_claimed events for user: ${userAddress}`);
    return this.subscribe(`slip:prize_claimed:user:${userAddress}`, callback);
  }

  /**
   * Subscribe to all Oddyssey events for a cycle
   * @param cycleId The cycle ID
   * @param callback Callback function for cycle events
   */
  public subscribeToOddysseyCycle(cycleId: number, callback: (data: any) => void) {
    console.log(`🎯 Subscribing to events for cycle: ${cycleId}`);
    return this.subscribe(`oddyssey:cycle:${cycleId}`, callback);
  }

  /**
   * Subscribe to live slip evaluation for a specific slip
   * @param slipId The slip ID
   * @param callback Callback function for evaluation updates
   */
  public subscribeToLiveSlipEvaluation(slipId: number, callback: (data: any) => void) {
    console.log(`🎯 Subscribing to live evaluation for slip: ${slipId}`);
    return this.subscribe(`oddyssey:slip:${slipId}:evaluation`, callback);
  }

  public getStats() {
    return {
      connected: this.isConnected,
      totalSubscriptions: Array.from(this.subscriptions.values()).reduce((total, subs) => total + subs.length, 0),
      channels: Array.from(this.subscriptions.keys())
    };
  }

  public disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
  }
}

// Create singleton instance
const websocketClient = new WebSocketClient();

export default websocketClient;
