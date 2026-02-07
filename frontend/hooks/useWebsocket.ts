'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Prices {
    eth: number;
    btc: number;
    sol: number;
    timestamp?: number;
}

export interface Portfolio {
    usdc: number;
    eth: number;
    btc: number;
    sol: number;
}

export interface Match {
    id: string;
    onChainId?: string;
    playerA: { address: string };
    playerB: { address: string } | null;
    stakeAmount: number;
    prizePool: number;
    duration: number;
    status: 'waiting' | 'active' | 'completed' | 'cancelled' | 'settling';
    createdAt: number;
    startedAt: number;
    endedAt: number;
    portfolioA: Portfolio;
    portfolioB: Portfolio;
    winner: string | null;
    playerAScore: number;
    playerBScore: number;
}

export interface UseWebSocketReturn {
    isConnected: boolean;
    prices: Prices;
    openMatches: Match[];
    currentMatch: Match | null;
    error: string | null;
    createMatch: (stakeAmount: number, duration: number, onChainId?: string) => void;
    joinMatch: (matchId: string, onChainId?: string) => void;
    executeTrade: (matchId: string, asset: 'eth' | 'btc' | 'sol', action: 'buy' | 'sell', quantity: number) => void;
    cancelMatch: (matchId: string) => void;
    getMatch: (matchId: string) => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export function useWebSocket(address: string | undefined): UseWebSocketReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [prices, setPrices] = useState<Prices>({ eth: 0, btc: 0, sol: 0 });
    const [openMatches, setOpenMatches] = useState<Match[]>([]);
    const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (!address) return;
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        console.log('[WebSocket] Connecting to', WS_URL);
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log('[WebSocket] Connected');
            setIsConnected(true);
            setError(null);

            // Authenticate
            ws.send(JSON.stringify({ type: 'auth', address }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case 'prices':
                        setPrices(data.prices);
                        break;
                    case 'open_matches':
                        setOpenMatches(data.matches || []);
                        break;
                    case 'match_created':
                    case 'match_joined':
                    case 'match_started':
                    case 'match_update':
                    case 'match_data':
                        setCurrentMatch(data.match);
                        break;
                    case 'match_ended':
                        setCurrentMatch(data.match);
                        break;
                    case 'match_cancelled':
                        setCurrentMatch(null);
                        break;
                    case 'trade_executed':
                        // Portfolio updated via match_update
                        break;
                    case 'trade_error':
                    case 'error':
                        setError(data.message || data.error);
                        setTimeout(() => setError(null), 5000);
                        break;
                }
            } catch (err) {
                console.error('[WebSocket] Parse error:', err);
            }
        };

        ws.onclose = () => {
            console.log('[WebSocket] Disconnected');
            setIsConnected(false);
            wsRef.current = null;

            // Reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, 3000);
        };

        ws.onerror = (err) => {
            console.error('[WebSocket] Error:', err);
            setError('Connection error');
        };

        wsRef.current = ws;
    }, [address]);

    // Connect on mount
    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    // Send message helper
    const send = useCallback((message: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            setError('Not connected');
        }
    }, []);

    // Actions
    const createMatch = useCallback((stakeAmount: number, duration: number, onChainId?: string) => {
        send({ type: 'create_match', stakeAmount, duration, onChainId });
    }, [send]);

    const joinMatch = useCallback((matchId: string, onChainId?: string) => {
        send({ type: 'join_match', matchId, onChainId });
    }, [send]);

    const executeTrade = useCallback((
        matchId: string,
        asset: 'eth' | 'btc' | 'sol',
        action: 'buy' | 'sell',
        quantity: number
    ) => {
        send({ type: 'trade', matchId, asset, action, quantity });
    }, [send]);

    const cancelMatch = useCallback((matchId: string) => {
        send({ type: 'cancel_match', matchId });
    }, [send]);

    const getMatch = useCallback((matchId: string) => {
        send({ type: 'get_match', matchId });
    }, [send]);

    return {
        isConnected,
        prices,
        openMatches,
        currentMatch,
        error,
        createMatch,
        joinMatch,
        executeTrade,
        cancelMatch,
        getMatch,
    };
}
