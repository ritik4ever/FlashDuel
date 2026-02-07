'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

export interface Portfolio {
    usdc: number;
    assets: { [key: string]: number };
}

export interface Match {
    id: string;
    onChainId: string | null;
    playerA: string;
    playerB: string | null;
    stakeAmount: number;
    prizePool: number;
    duration: number;
    status: 'waiting' | 'active' | 'completed' | 'settling';
    startedAt: number;
    createdAt: number;
    portfolioA: Portfolio;
    portfolioB: Portfolio;
    assets: string[];
    winner: string | null;
    playerAScore: number;
    playerBScore: number;
}

export interface UseMatchReturn {
    match: Match | null;
    isLoading: boolean;
    error: string | null;
    isPlayerA: boolean;
    myPortfolio: Portfolio | null;
    opponentPortfolio: Portfolio | null;
    timeLeft: number;
    refreshMatch: () => void;
}

export function useMatch(matchId: string | null): UseMatchReturn {
    const { address } = useAccount();
    const [match, setMatch] = useState<Match | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [ws, setWs] = useState<WebSocket | null>(null);

    // Connect to WebSocket and get match data
    useEffect(() => {
        if (!matchId || !address) {
            setIsLoading(false);
            return;
        }

        const websocket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');

        websocket.onopen = () => {
            console.log('Match WebSocket connected');
            websocket.send(JSON.stringify({ type: 'auth', address }));
            websocket.send(JSON.stringify({ type: 'get_match', matchId }));
        };

        websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case 'match_data':
                    case 'match_update':
                    case 'match_started':
                    case 'match_joined':
                    case 'match_ended':
                        setMatch(data.match);
                        setIsLoading(false);
                        break;
                    case 'error':
                        setError(data.message);
                        setIsLoading(false);
                        break;
                }
            } catch (err) {
                console.error('Error parsing message:', err);
            }
        };

        websocket.onerror = () => {
            setError('Connection error');
            setIsLoading(false);
        };

        websocket.onclose = () => {
            console.log('Match WebSocket disconnected');
        };

        setWs(websocket);

        return () => {
            websocket.close();
        };
    }, [matchId, address]);

    // Timer countdown
    useEffect(() => {
        if (!match || match.status !== 'active') return;

        const endTime = match.startedAt + match.duration * 1000;

        const interval = setInterval(() => {
            const remaining = Math.max(0, endTime - Date.now());
            setTimeLeft(Math.floor(remaining / 1000));

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [match]);

    const refreshMatch = useCallback(() => {
        if (ws && matchId) {
            ws.send(JSON.stringify({ type: 'get_match', matchId }));
        }
    }, [ws, matchId]);

    const isPlayerA = match?.playerA.toLowerCase() === address?.toLowerCase();

    const myPortfolio = match
        ? (isPlayerA ? match.portfolioA : match.portfolioB)
        : null;

    const opponentPortfolio = match
        ? (isPlayerA ? match.portfolioB : match.portfolioA)
        : null;

    return {
        match,
        isLoading,
        error,
        isPlayerA,
        myPortfolio,
        opponentPortfolio,
        timeLeft,
        refreshMatch,
    };
}

// Calculate portfolio value
export function calculatePortfolioValue(
    portfolio: Portfolio,
    prices: { eth: number; btc: number; sol: number }
): number {
    let value = portfolio.usdc;
    for (const [asset, amount] of Object.entries(portfolio.assets)) {
        const price = prices[asset as keyof typeof prices];
        if (price) {
            value += amount * price;
        }
    }
    return value;
}

// Format time remaining
export function formatTimeLeft(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
