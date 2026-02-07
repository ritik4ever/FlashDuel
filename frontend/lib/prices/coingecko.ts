// CoinGecko Price API
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export interface PriceData {
    ethereum?: { usd: number; usd_24h_change?: number };
    bitcoin?: { usd: number; usd_24h_change?: number };
    solana?: { usd: number; usd_24h_change?: number };
}

export interface Prices {
    eth: number;
    btc: number;
    sol: number;
}

export interface PriceWithChange {
    price: number;
    change24h: number;
}

export interface DetailedPrices {
    eth: PriceWithChange;
    btc: PriceWithChange;
    sol: PriceWithChange;
}

// Fetch current prices
export async function fetchPrices(): Promise<Prices> {
    try {
        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch prices');
        }

        const data = await response.json() as PriceData;

        return {
            eth: data.ethereum?.usd || 3000,
            btc: data.bitcoin?.usd || 95000,
            sol: data.solana?.usd || 200,
        };
    } catch (error) {
        console.error('Error fetching prices:', error);
        // Return fallback prices
        return { eth: 3000, btc: 95000, sol: 200 };
    }
}

// Fetch prices with 24h change
export async function fetchDetailedPrices(): Promise<DetailedPrices> {
    try {
        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd&include_24hr_change=true`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch prices');
        }

        const data = await response.json() as PriceData;

        return {
            eth: {
                price: data.ethereum?.usd || 3000,
                change24h: data.ethereum?.usd_24h_change || 0,
            },
            btc: {
                price: data.bitcoin?.usd || 95000,
                change24h: data.bitcoin?.usd_24h_change || 0,
            },
            sol: {
                price: data.solana?.usd || 200,
                change24h: data.solana?.usd_24h_change || 0,
            },
        };
    } catch (error) {
        console.error('Error fetching detailed prices:', error);
        return {
            eth: { price: 3000, change24h: 0 },
            btc: { price: 95000, change24h: 0 },
            sol: { price: 200, change24h: 0 },
        };
    }
}

// Fetch historical prices for charts
export async function fetchPriceHistory(
    coinId: string,
    days: number = 1
): Promise<{ timestamp: number; price: number }[]> {
    try {
        const response = await fetch(
            `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch price history');
        }

        const data = await response.json();

        return data.prices.map(([timestamp, price]: [number, number]) => ({
            timestamp,
            price,
        }));
    } catch (error) {
        console.error('Error fetching price history:', error);
        return [];
    }
}

// Asset ID mapping
export const ASSET_TO_COINGECKO: { [key: string]: string } = {
    eth: 'ethereum',
    btc: 'bitcoin',
    sol: 'solana',
};

// Format price for display
export function formatPrice(price: number): string {
    if (price >= 1000) {
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(2)}`;
}

// Format percentage change
export function formatChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
}
