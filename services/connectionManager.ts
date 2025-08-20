/**
 * Connection Manager Service
 * Handles persistent connections and reduces retry frequency to prevent rate limiting
 */

interface ConnectionState {
  isConnected: boolean;
  lastPing: number;
  retryCount: number;
  backoffTime: number;
}

class ConnectionManager {
  private connectionState: ConnectionState = {
    isConnected: false,
    lastPing: 0,
    retryCount: 0,
    backoffTime: 1000
  };

  private maxRetries = 3;
  private baseBackoffTime = 2000;
  private maxBackoffTime = 30000; // 30 seconds max

  /**
   * Check if we should attempt a request based on connection state
   */
  shouldAttemptRequest(): boolean {
    const now = Date.now();
    const timeSinceLastPing = now - this.connectionState.lastPing;
    
    // If we're in backoff, check if enough time has passed
    if (this.connectionState.retryCount > 0 && timeSinceLastPing < this.connectionState.backoffTime) {
      return false;
    }
    
    return true;
  }

  /**
   * Record a successful request
   */
  recordSuccess(): void {
    this.connectionState.isConnected = true;
    this.connectionState.lastPing = Date.now();
    this.connectionState.retryCount = 0;
    this.connectionState.backoffTime = this.baseBackoffTime;
  }

  /**
   * Record a failed request and calculate backoff
   */
  recordFailure(): void {
    this.connectionState.isConnected = false;
    this.connectionState.retryCount++;
    
    // Exponential backoff with jitter
    const jitter = Math.random() * 0.1; // 10% jitter
    this.connectionState.backoffTime = Math.min(
      this.baseBackoffTime * Math.pow(2, this.connectionState.retryCount - 1) * (1 + jitter),
      this.maxBackoffTime
    );
    
    this.connectionState.lastPing = Date.now();
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Reset connection state
   */
  reset(): void {
    this.connectionState = {
      isConnected: false,
      lastPing: 0,
      retryCount: 0,
      backoffTime: this.baseBackoffTime
    };
  }

  /**
   * Wait for backoff period if needed
   */
  async waitForBackoff(): Promise<void> {
    if (this.connectionState.retryCount > 0) {
      const now = Date.now();
      const timeSinceLastPing = now - this.connectionState.lastPing;
      const remainingTime = this.connectionState.backoffTime - timeSinceLastPing;
      
      if (remainingTime > 0) {
        console.log(`⏳ Waiting ${remainingTime}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    }
  }
}

// Export singleton instance
export const connectionManager = new ConnectionManager();

/**
 * Enhanced API request function with connection management
 */
export async function managedApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  maxRetries: number = 2
): Promise<T> {
  const { apiRequest } = await import('@/config/api');
  
  // Check if we should attempt the request
  if (!connectionManager.shouldAttemptRequest()) {
    await connectionManager.waitForBackoff();
  }
  
  try {
    const result = await apiRequest<T>(endpoint, options, maxRetries);
    connectionManager.recordSuccess();
    return result;
  } catch (error) {
    connectionManager.recordFailure();
    throw error;
  }
}
