'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchPrices, fetchDetailedPrices, type Prices, type DetailedPrices } from '@/lib/prices/coingecko';

export interface UsePricesReturn {
    prices: Prices;
    detailedPrices: DetailedPrices | null;
    isLoading: boolean;
    error: string | null;
    lastUpdated: number | null;
    refresh: () => Promise<void>;
}

const DEFAULT_PRICES: Prices = {
    eth: 3000,
    btc: 95000,
    sol: 200,
};

const REFRESH_INTERVAL = 10000; // 10 seconds

export function usePrices(autoRefresh: boolean = true): UsePricesReturn {
    const [prices, setPrices] = useState<Prices>(DEFAULT_PRICES);
    const [detailedPrices, setDetailedPrices] = useState<DetailedPrices | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);

    const refresh = useCallback(async () => {
        try {
            setError(null);
            const [simplePrices, detailed] = await Promise.all([
                fetchPrices(),
                fetchDetailedPrices(),
            ]);

            setPrices(simplePrices);
            setDetailedPrices(detailed);
            setLastUpdated(Date.now());
        } catch (err) {
            console.error('Error fetching prices:', err);
            setError('Failed to fetch prices');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        refresh();
    }, [refresh]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(refresh, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [autoRefresh, refresh]);

    return {
        prices,
        detailedPrices,
        isLoading,
        error,
        lastUpdated,
        refresh,
    };
}

// Hook for WebSocket-based price updates (from backend)
export function useWebSocketPrices(): Prices {
    const [prices, setPrices] = useState<Prices>(DEFAULT_PRICES);

    useEffect(() => {
        const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'get_prices' }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'prices') {
                    setPrices(data.prices);
                }
            } catch (err) {
                console.error('Error parsing price message:', err);
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    return prices;
}
