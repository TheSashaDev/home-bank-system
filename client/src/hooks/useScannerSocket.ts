import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

interface ScanEvent {
  type: 'card_scanned';
  user: {
    id: string;
    name: string;
    cardNumber: string;
    balance: number;
  };
  timestamp: number;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

export function useScannerSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number>();
  const { setScannedCard, clearScannedCard } = useAppStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Scanner socket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ScanEvent;
        if (data.type === 'card_scanned') {
          playNotificationSound();
          setScannedCard(data.user);
          
          // Auto-clear after 10 seconds
          setTimeout(() => clearScannedCard(), 10000);
        }
      } catch (e) {
        console.error('Failed to parse scan event', e);
      }
    };

    ws.onclose = () => {
      console.log('Scanner socket closed, reconnecting...');
      reconnectTimeout.current = window.setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error('Scanner socket error', err);
      ws.close();
    };
  }, [setScannedCard, clearScannedCard]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);
}

function playNotificationSound() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}
