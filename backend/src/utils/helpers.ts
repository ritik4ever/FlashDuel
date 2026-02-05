import { Portfolio, PriceData } from '../types';

export function calculatePortfolioValue(portfolio: Portfolio, prices: PriceData): number {
  return (
    portfolio.usdc +
    portfolio.eth * prices.eth +
    portfolio.btc * prices.btc +
    portfolio.sol * prices.sol
  );
}

export function generateMatchId(): string {
  return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}