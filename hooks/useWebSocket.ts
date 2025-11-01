import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://bitredict-backend.fly.dev';

interface UseWebSocketOptions {
  channel: string | null;
  onMessage?: (message: Record<string, unknown>) => void;
  enabled?: boolean;
}

export function useWebSocket({ channel, onMessage, enabled = true }: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;

  const connect = useCallback(() => {
    if (!enabled || !channel) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Build WebSocket URL - ensure we don't duplicate /ws
      let wsUrl = WS_URL;
      
      // Convert http/https to ws/wss if needed
      wsUrl = wsUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      
      // Add /ws only if not already present
      if (!wsUrl.endsWith('/ws')) {
        wsUrl = `${wsUrl}/ws`;
      }
      
      console.log('🔌 Connecting to WebSocket (useWebSocket hook):', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        if (isMountedRef.current) {
          setIsConnected(true);
        }
        reconnectAttemptsRef.current = 0;

        // Subscribe to channel immediately after connection
        if (channel) {
          console.log(`📡 Subscribing to channel: ${channel}`);
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel
          }));
        } else {
          console.warn('⚠️ No channel provided for WebSocket subscription');
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected', event.code, event.reason || 'No reason');
        if (isMountedRef.current) {
          setIsConnected(false);
        }
        wsRef.current = null;

        // Attempt reconnection (unless it was a clean close)
        if (enabled && event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && isMountedRef.current) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Reconnecting... (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && channel) {
              connect();
            }
          }, RECONNECT_DELAY);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.error('❌ Max reconnection attempts reached. WebSocket will not reconnect.');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [channel, enabled, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (isMountedRef.current) {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    disconnect,
    reconnect: connect
  };
}

