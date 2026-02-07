'use client';

import { useState, useEffect } from 'react';

interface Prices {
    eth: number;
    btc: number;
    sol: number;
}

interface LivePricesProps {
    compact?: boolean;
    className?: string;
}

const ASSETS = [
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: '⟠' },
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
    { id: 'sol', name: 'Solana', symbol: 'SOL', icon: '◎' },
];

export function LivePrices({ compact = false, className = '' }: LivePricesProps) {
    const [prices, setPrices] = useState<Prices>({ eth: 0, btc: 0, sol: 0 });
    const [changes, setChanges] = useState<Prices>({ eth: 0, btc: 0, sol: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const response = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd&include_24hr_change=true'
                );
                const data = await response.json();

                setPrices({
                    eth: data.ethereum?.usd || 0,
                    btc: data.bitcoin?.usd || 0,
                    sol: data.solana?.usd || 0,
                });

                setChanges({
                    eth: data.ethereum?.usd_24h_change || 0,
                    btc: data.bitcoin?.usd_24h_change || 0,
                    sol: data.solana?.usd_24h_change || 0,
                });

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching prices:', error);
                setIsLoading(false);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    const formatPrice = (price: number) => {
        return price >= 1000
            ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `$${price.toFixed(2)}`;
    };

    const formatChange = (change: number) => {
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(2)}%`;
    };

    if (isLoading) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className="flex gap-4">
                    {ASSETS.map((asset) => (
                        <div key={asset.id} className="flex items-center gap-2">
                            <span className="text-2xl">{asset.icon}</span>
                            <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className={`flex flex-wrap items-center justify-center gap-4 md:gap-6 ${className}`}>
                {ASSETS.map((asset) => {
                    const price = prices[asset.id as keyof Prices];
                    const change = changes[asset.id as keyof Prices];
                    return (
                        <div key={asset.id} className="flex items-center gap-2">
                            <span className="text-lg">{asset.icon}</span>
                            <div>
                                <span className="font-semibold">{formatPrice(price)}</span>
                                <span className={`ml-2 text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatChange(change)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={`bg-card border border-card-border rounded-2xl p-6 ${className}`}>
            <h3 className="text-xl font-bold mb-4">💹 Live Prices</h3>
            <div className="space-y-4">
                {ASSETS.map((asset) => {
                    const price = prices[asset.id as keyof Prices];
                    const change = changes[asset.id as keyof Prices];
                    return (
                        <div key={asset.id} className="p-4 bg-background rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{asset.icon}</span>
                                <div>
                                    <p className="font-bold">{asset.name}</p>
                                    <p className="text-sm text-muted">{asset.symbol}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold">{formatPrice(price)}</p>
                                <p className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {change >= 0 ? '↑' : '↓'} {formatChange(change)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-muted text-center mt-4">
                Prices from CoinGecko • Updates every 10s
            </p>
        </div>
    );
}

export default LivePrices;