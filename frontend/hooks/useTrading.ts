'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { type Prices } from '@/lib/prices/coingecko';

export type TradeAction = 'buy' | 'sell';
export type Asset = 'eth' | 'btc' | 'sol';

export interface Trade {
    id: string;
    asset: Asset;
    action: TradeAction;
    quantity: number;
    price: number;
    total: number;
    timestamp: number;
}

export interface Portfolio {
    usdc: number;
    assets: { [key: string]: number };
}

export interface UseTradingReturn {
    portfolio: Portfolio;
    trades: Trade[];
    isTrading: boolean;
    error: string | null;
    executeTrade: (asset: Asset, action: TradeAction, quantity: number, price: number) => Promise<boolean>;
    calculatePortfolioValue: (prices: Prices) => number;
    getAssetValue: (asset: Asset, prices: Prices) => number;
    clearError: () => void;
}

export function useTrading(
    matchId: string | null,
    initialBalance: number = 50
): UseTradingReturn {
    const { address } = useAccount();
    const [portfolio, setPortfolio] = useState<Portfolio>({
        usdc: initialBalance,
        assets: {},
    });
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isTrading, setIsTrading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Connect to WebSocket
    useEffect(() => {
        if (!matchId || !address) return;

        const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'auth', address }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case 'trade_executed':
                        setPortfolio(data.portfolio);
                        setIsTrading(false);
                        break;
                    case 'trade_error':
                        setError(data.message);
                        setIsTrading(false);
                        break;
                    case 'match_update':
                        // Update portfolio from match data
                        if (data.match) {
                            const isPlayerA = data.match.playerA.toLowerCase() === address?.toLowerCase();
                            setPortfolio(isPlayerA ? data.match.portfolioA : data.match.portfolioB);
                        }
                        break;
                }
            } catch (err) {
                console.error('Error parsing message:', err);
            }
        };

        wsRef.current = ws;

        return () => {
            ws.close();
        };
    }, [matchId, address]);

    const executeTrade = useCallback(async (
        asset: Asset,
        action: TradeAction,
        quantity: number,
        price: number
    ): Promise<boolean> => {
        if (!wsRef.current || !matchId) {
            setError('Not connected');
            return false;
        }

        const total = quantity * price;

        // Validate trade
        if (action === 'buy') {
            if (portfolio.usdc < total) {
                setError('Insufficient USDC balance');
                return false;
            }
        } else {
            if ((portfolio.assets[asset] || 0) < quantity) {
                setError(`Insufficient ${asset.toUpperCase()} balance`);
                return false;
            }
        }

        setIsTrading(true);
        setError(null);

        // Send trade to backend
        wsRef.current.send(JSON.stringify({
            type: 'trade',
            matchId,
            asset,
            action,
            quantity,
            price,
        }));

        // Record trade locally
        const trade: Trade = {
            id: `trade_${Date.now()}`,
            asset,
            action,
            quantity,
            price,
            total,
            timestamp: Date.now(),
        };

        setTrades(prev => [...prev, trade]);

        // Optimistically update portfolio
        setPortfolio(prev => {
            const newPortfolio = { ...prev, assets: { ...prev.assets } };

            if (action === 'buy') {
                newPortfolio.usdc -= total;
                newPortfolio.assets[asset] = (newPortfolio.assets[asset] || 0) + quantity;
            } else {
                newPortfolio.usdc += total;
                newPortfolio.assets[asset] = (newPortfolio.assets[asset] || 0) - quantity;
            }

            return newPortfolio;
        });

        return true;
    }, [matchId, portfolio]);

    const calculatePortfolioValue = useCallback((prices: Prices): number => {
        let value = portfolio.usdc;
        for (const [asset, amount] of Object.entries(portfolio.assets)) {
            const price = prices[asset as keyof Prices];
            if (price) {
                value += amount * price;
            }
        }
        return value;
    }, [portfolio]);

    const getAssetValue = useCallback((asset: Asset, prices: Prices): number => {
        const amount = portfolio.assets[asset] || 0;
        return amount * prices[asset];
    }, [portfolio]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        portfolio,
        trades,
        isTrading,
        error,
        executeTrade,
        calculatePortfolioValue,
        getAssetValue,
        clearError,
    };
}

// Quick trade amounts based on portfolio
export function calculateQuickAmounts(
    asset: Asset,
    action: TradeAction,
    portfolio: Portfolio,
    price: number
): number[] {
    if (action === 'buy') {
        const maxAmount = portfolio.usdc / price;
        return [
            maxAmount * 0.1,
            maxAmount * 0.25,
            maxAmount * 0.5,
            maxAmount,
        ].map(a => Math.floor(a * 100000) / 100000);
    } else {
        const balance = portfolio.assets[asset] || 0;
        return [
            balance * 0.25,
            balance * 0.5,
            balance * 0.75,
            balance,
        ].map(a => Math.floor(a * 100000) / 100000);
    }
}
