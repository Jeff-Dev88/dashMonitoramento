'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_DATA = {
  cpu: { usage: 0, temperature: 0, cores: [] },
  gpu: { name: 'N/A', usage: 0, temperature: 0, memoryUsed: 0, memoryTotal: 0, fanSpeed: 0 },
  ram: { total: 0, used: 0, usage: 0 },
  fps: 0,
  system: { hostname: '...', platform: '', distro: '' },
  timestamp: 0
};

export function useSystemData() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    // Determinar o host do WebSocket (porta 3001 separada)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    const wsUrl = `${protocol}//${hostname}:3001`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket conectado');
        setIsConnected(true);
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data);
          setData(newData);
        } catch (e) {
          console.error('Erro ao processar dados:', e);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket desconectado');
        setIsConnected(false);

        // Tentar reconectar após 3 segundos
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Tentando reconectar...');
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Erro de conexão');
        setIsConnected(false);
      };

    } catch (err) {
      console.error('Erro ao criar WebSocket:', err);
      setError('Não foi possível conectar');
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { data, isConnected, error };
}
