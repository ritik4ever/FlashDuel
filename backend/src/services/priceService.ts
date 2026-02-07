import { PriceData, CoinGeckoResponse } from '../types';

// Current prices (updated every 10 seconds)
let currentPrices: PriceData = {
  eth: 3000,
  btc: 95000,
  sol: 200,
  timestamp: Date.now(),
};

// Price update listeners
type PriceListener = (prices: PriceData) => void;
const priceListeners: PriceListener[] = [];

// Fetch prices from CoinGecko
export async function fetchPrices(): Promise<PriceData> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd'
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json() as CoinGeckoResponse;

    currentPrices = {
      eth: data.ethereum?.usd || currentPrices.eth,
      btc: data.bitcoin?.usd || currentPrices.btc,
      sol: data.solana?.usd || currentPrices.sol,
      timestamp: Date.now(),
    };

    // Notify all listeners
    priceListeners.forEach(listener => listener(currentPrices));

    console.log(`[Prices] ETH: $${currentPrices.eth}, BTC: $${currentPrices.btc}, SOL: $${currentPrices.sol}`);

    return currentPrices;
  } catch (error) {
    console.error('[Prices] Error fetching from CoinGecko:', error);
    // Return cached prices on error
    return currentPrices;
  }
}

// Get current prices (synchronous)
export function getCurrentPrices(): PriceData {
  return { ...currentPrices };
}

// Subscribe to price updates
export function onPriceUpdate(listener: PriceListener): () => void {
  priceListeners.push(listener);
  // Return unsubscribe function
  return () => {
    const index = priceListeners.indexOf(listener);
    if (index > -1) {
      priceListeners.splice(index, 1);
    }
  };
}

// Start price update interval
export function startPriceUpdates(intervalMs: number = 10000): NodeJS.Timeout {
  console.log(`[Prices] Starting price updates every ${intervalMs / 1000}s`);

  // Fetch immediately
  fetchPrices();

  // Then fetch on interval
  return setInterval(fetchPrices, intervalMs);
}

// Calculate portfolio value
export function calculatePortfolioValue(portfolio: { usdc: number; eth: number; btc: number; sol: number }): number {
  const prices = getCurrentPrices();
  return (
    portfolio.usdc +
    portfolio.eth * prices.eth +
    portfolio.btc * prices.btc +
    portfolio.sol * prices.sol
  );
}
