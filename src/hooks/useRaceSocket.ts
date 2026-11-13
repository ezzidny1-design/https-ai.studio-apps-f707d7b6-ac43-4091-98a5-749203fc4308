import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, ServerMessage } from '../shared/types';

export type SocketStatus = 'connecting' | 'open' | 'closed';

export function useRaceSocket(onMessage: (msg: ServerMessage) => void) {
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef<ClientMessage[]>([]);
  const mountedRef = useRef(true);

  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws`;
    setStatus('connecting');

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
      setStatus('open');
      while (queueRef.current.length > 0) {
        const queued = queueRef.current.shift();
        if (queued) {
          ws.send(JSON.stringify(queued));
        }
      }
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data as string) as ServerMessage;
        onMessageRef.current(parsed);
      } catch {
        // Ignore malformed packets
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus('closed');
      wsRef.current = null;
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 1500);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      queueRef.current.push(msg);
    }
  }, []);

  return { status, send };
}
