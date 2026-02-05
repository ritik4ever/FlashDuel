'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '@/lib/store';
import { WS_URL } from '@/lib/constants';
import toast from 'react-hot-toast';

export function useWebSocket() {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    const {
        address,
        setWebSocket,
        setPrices,
        setCurrentMatch,
        setOpenMatches,
        updateMatch,
    } = useGameStore();

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connected');
            setWebSocket(ws);

            // Authenticate if we have an address
            if (address) {
                ws.send(JSON.stringify({
                    type: 'auth',
                    payload: { address }
                }));
            }
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleMessage(message);
            } catch (error) {
                console.error('Failed to parse message:', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setWebSocket(null);

            // Attempt to reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, 3000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }, [address, setWebSocket]);

    const handleMessage = useCallback((message: { type: string; payload: any }) => {
        const { type, payload } = message;

        switch (type) {
            case 'auth_success':
                console.log('Authenticated:', payload.address);
                // Request open matches after auth
                wsRef.current?.send(JSON.stringify({ type: 'get_matches', payload: {} }));
                break;

            case 'prices':
                setPrices(payload);
                break;

            case 'open_matches':
                setOpenMatches(payload.matches);
                break;

            case 'match_created':
                setCurrentMatch(payload.match);
                toast.success('Match created! Waiting for opponent...');
                break;

            case 'match_started':
                setCurrentMatch(payload.match);
                toast.success('Match started! Good luck!');
                break;

            case 'match_updated':
                updateMatch(payload.match);
                break;

            case 'match_restored':
                setCurrentMatch(payload.match);
                toast('Restored your active match');
                break;

            case 'trade_executed':
                toast.success(`Trade executed!`);
                break;

            case 'match_ended':
                setCurrentMatch(payload.match);
                break;

            case 'match_cancelled':
                setCurrentMatch(null);
                toast('Match cancelled');
                break;

            case 'error':
                toast.error(payload.message);
                break;

            default:
                console.log('Unknown message type:', type);
        }
    }, [setPrices, setOpenMatches, setCurrentMatch, updateMatch]);

    const sendMessage = useCallback((type: string, payload: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, payload }));
        } else {
            toast.error('Not connected to server');
        }
    }, []);

    const authenticate = useCallback((walletAddress: string) => {
        sendMessage('auth', { address: walletAddress });
    }, [sendMessage]);

    const createMatch = useCallback((stakeAmount: number, duration: number, assets: string[]) => {
        sendMessage('create_match', { stakeAmount, duration, assets });
    }, [sendMessage]);

    const joinMatch = useCallback((matchId: string) => {
        sendMessage('join_match', { matchId });
    }, [sendMessage]);

    const executeTrade = useCallback((
        matchId: string,
        asset: 'eth' | 'btc' | 'sol',
        side: 'buy' | 'sell',
        amount: number
    ) => {
        sendMessage('trade', { matchId, asset, side, amount });
    }, [sendMessage]);

    const cancelMatch = useCallback((matchId: string) => {
        sendMessage('cancel_match', { matchId });
    }, [sendMessage]);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            wsRef.current?.close();
        };
    }, [connect]);

    // Re-authenticate when address changes
    useEffect(() => {
        if (address && wsRef.current?.readyState === WebSocket.OPEN) {
            authenticate(address);
        }
    }, [address, authenticate]);

    return {
        sendMessage,
        authenticate,
        createMatch,
        joinMatch,
        executeTrade,
        cancelMatch,
    };
}