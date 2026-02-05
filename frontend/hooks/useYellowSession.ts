'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';

interface SessionState {
    isOpen: boolean;
    channelId: string | null;
    balance: number;
    deposits: number;
}

interface TradeMessage {
    asset: string;
    action: 'buy' | 'sell';
    quantity: number;
    price: number;
}

const YELLOW_WS_URL = process.env.NEXT_PUBLIC_YELLOW_WS_URL || 'wss://clearnet-sandbox.yellow.com/ws';
const CUSTODY_ADDRESS = process.env.NEXT_PUBLIC_CUSTODY_ADDRESS || '0x019B65A265EB3363822f2752141b3dF16131b262';

export function useYellowSession() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();

    const [session, setSession] = useState<SessionState>({
        isOpen: false,
        channelId: null,
        balance: 0,
        deposits: 0,
    });
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connect = useCallback(async () => {
        if (!address) {
            setError('Wallet not connected');
            return;
        }

        try {
            const websocket = new WebSocket(YELLOW_WS_URL);

            websocket.onopen = () => {
                console.log('Connected to Yellow Clearnode');
                websocket.send(JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'auth',
                    params: { address },
                    id: 1,
                }));
            };

            websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleMessage(data);
            };

            websocket.onerror = (err) => {
                console.error('WebSocket error:', err);
                setError('Connection error');
            };

            websocket.onclose = () => {
                console.log('Disconnected from Yellow');
                setSession(prev => ({ ...prev, isOpen: false }));
            };

            setWs(websocket);
        } catch (err) {
            setError('Failed to connect to Yellow Network');
        }
    }, [address]);

    const handleMessage = (data: any) => {
        switch (data.method) {
            case 'auth_success':
                console.log('Authenticated with Yellow');
                break;
            case 'channel_opened':
                setSession(prev => ({
                    ...prev,
                    isOpen: true,
                    channelId: data.params.channelId,
                    balance: data.params.balance,
                }));
                setIsLoading(false);
                break;
            case 'trade_confirmed':
                setSession(prev => ({
                    ...prev,
                    balance: data.params.newBalance,
                }));
                break;
            case 'channel_closed':
                setSession({
                    isOpen: false,
                    channelId: null,
                    balance: 0,
                    deposits: 0,
                });
                break;
            case 'error':
                setError(data.params.message);
                setIsLoading(false);
                break;
        }
    };

    const openSession = useCallback(async (depositAmount: number) => {
        if (!ws || !walletClient || !address) {
            setError('Not connected');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const message = `Open Yellow session with ${depositAmount} USDC`;
            const signature = await walletClient.signMessage({ message });

            ws.send(JSON.stringify({
                jsonrpc: '2.0',
                method: 'open_channel',
                params: {
                    address,
                    amount: depositAmount,
                    signature,
                },
                id: 2,
            }));

            setSession(prev => ({ ...prev, deposits: depositAmount }));
        } catch (err) {
            setError('Failed to open session');
            setIsLoading(false);
        }
    }, [ws, walletClient, address]);

    const executeTrade = useCallback(async (trade: TradeMessage) => {
        if (!ws || !session.isOpen) {
            setError('Session not open');
            return;
        }

        ws.send(JSON.stringify({
            jsonrpc: '2.0',
            method: 'trade',
            params: {
                channelId: session.channelId,
                ...trade,
            },
            id: Date.now(),
        }));
    }, [ws, session]);

    const closeSession = useCallback(async () => {
        if (!ws || !session.isOpen) return;

        setIsLoading(true);
        ws.send(JSON.stringify({
            jsonrpc: '2.0',
            method: 'close_channel',
            params: {
                channelId: session.channelId,
            },
            id: 3,
        }));
    }, [ws, session]);

    const disconnect = useCallback(() => {
        ws?.close();
        setWs(null);
        setSession({
            isOpen: false,
            channelId: null,
            balance: 0,
            deposits: 0,
        });
    }, [ws]);

    return {
        session,
        isLoading,
        error,
        connect,
        openSession,
        executeTrade,
        closeSession,
        disconnect,
    };
}