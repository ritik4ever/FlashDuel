'use client';

import { useState, useEffect, useRef } from 'react';
import { ASSETS } from '@/lib/constants';

interface PriceData {
    [key: string]: number;
}

export function usePrices() {
    const [prices, setPrices] = useState<PriceData>({});
    const [priceChanges, setPriceChanges] = useState<PriceData>({});
    const prevPrices = useRef<PriceData>({});

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const ids = Object.values(ASSETS).map(a => a.coingeckoId).join(',');
                const res = await fetch(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
                );
                const data = await res.json();

                const newPrices: PriceData = {};
                const newChanges: PriceData = {};

                Object.entries(ASSETS).forEach(([key, asset]) => {
                    const priceData = data[asset.coingeckoId];
                    if (priceData) {
                        newPrices[key] = priceData.usd;
                        newChanges[key] = priceData.usd_24h_change || 0;
                    }
                });

                prevPrices.current = prices;
                setPrices(newPrices);
                setPriceChanges(newChanges);
            } catch (error) {
                console.error('Failed to fetch prices:', error);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    return { prices, priceChanges };
}