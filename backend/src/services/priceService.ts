import { PriceData } from '../types';

let currentPrices: PriceData = {
  eth: 3150,
  btc: 97500,
  sol: 185,
  timestamp: Date.now()
};

let priceUpdateInterval: NodeJS.Timeout | null = null;
let priceListeners: ((prices: PriceData) => void)[] = [];

export async function fetchPrices(): Promise<PriceData> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd'
    );
    const data = await response.json();

    currentPrices = {
      eth: data.ethereum?.usd || currentPrices.eth,
      btc: data.bitcoin?.usd || currentPrices.btc,
      sol: data.solana?.usd || currentPrices.sol,
      timestamp: Date.now()
    };

    return currentPrices;
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    // Add small random variation for demo purposes
    currentPrices = {
      eth: currentPrices.eth * (1 + (Math.random() - 0.5) * 0.002),
      btc: currentPrices.btc * (1 + (Math.random() - 0.5) * 0.002),
      sol: currentPrices.sol * (1 + (Math.random() - 0.5) * 0.002),
      timestamp: Date.now()
    };
    return currentPrices;
  }
}

export function getCurrentPrices(): PriceData {
  return currentPrices;
}

export function startPriceUpdates(intervalMs: number = 5000): void {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval);
  }

  // Fetch immediately
  fetchPrices().then(prices => {
    priceListeners.forEach(listener => listener(prices));
  });

  // Then fetch periodically
  priceUpdateInterval = setInterval(async () => {
    const prices = await fetchPrices();
    priceListeners.forEach(listener => listener(prices));
  }, intervalMs);
}

export function stopPriceUpdates(): void {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval);
    priceUpdateInterval = null;
  }
}

export function onPriceUpdate(listener: (prices: PriceData) => void): () => void {
  priceListeners.push(listener);
  return () => {
    priceListeners = priceListeners.filter(l => l !== listener);
  };
}