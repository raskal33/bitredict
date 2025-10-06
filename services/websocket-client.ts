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

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
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
        sub.callback(message.data);
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
