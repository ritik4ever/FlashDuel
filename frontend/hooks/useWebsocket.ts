'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useGameStore } from '@/lib/store';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

interface TradeData {
    matchId: string;
    asset: string;
    action: 'buy' | 'sell';
    quantity: number;
    price: number;
}

export function useWebSocket() {
    const ws = useRef<WebSocket | null>(null);
    const { address, isConnected } = useAccount();
    const { setOpenMatches, setCurrentMatch, updatePortfolio, setConnected, setAddress } = useGameStore();

    const connect = useCallback(() => {
        if (!address || ws.current?.readyState === WebSocket.OPEN) return;

        ws.current = new WebSocket(WS_URL);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
            ws.current?.send(JSON.stringify({
                type: 'auth',
                address,
            }));
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'matches':
                    setOpenMatches(data.matches);
                    break;
                case 'match_created':
                case 'match_joined':
                case 'match_started':
                    setCurrentMatch(data.match);
                    break;
                case 'match_update':
                    setCurrentMatch(data.match);
                    break;
                case 'trade_executed':
                    updatePortfolio(data.portfolio);
                    break;
                case 'match_ended':
                    setCurrentMatch(data.match);
                    break;
            }
        };

        ws.current.onclose = () => {
            console.log('WebSocket disconnected');
            setTimeout(() => {
                if (address) connect();
            }, 3000);
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }, [address, setOpenMatches, setCurrentMatch, updatePortfolio]);

    useEffect(() => {
        setConnected(isConnected);
        setAddress(address || null);

        if (isConnected && address) {
            connect();
        } else {
            ws.current?.close();
        }

        return () => {
            ws.current?.close();
        };
    }, [isConnected, address, connect, setConnected, setAddress]);

    const send = useCallback((data: object) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data));
        }
    }, []);

    const createMatch = useCallback((stakeAmount: number, duration: number, assets: string[]) => {
        send({ type: 'create_match', stakeAmount, duration, assets });
    }, [send]);

    const joinMatch = useCallback((matchId: string) => {
        send({ type: 'join_match', matchId });
    }, [send]);

    const executeTrade = useCallback((trade: TradeData) => {
        send({ type: 'trade', ...trade });
    }, [send]);

    return { createMatch, joinMatch, executeTrade };
}