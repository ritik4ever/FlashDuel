'use client';

import { formatUSD, shortenAddress } from '@/lib/utils';

interface Portfolio {
  usdc: number;
  assets: { [key: string]: number };
}

interface PlayerCardProps {
  address: string;
  portfolio: Portfolio;
  value: number;
  stakeAmount: number;
  isMe: boolean;
  isWinner?: boolean;
  prices: { eth: number; btc: number; sol: number };
}

const ASSETS = [
  { id: 'eth', name: 'ETH', icon: '⟠', color: '#627EEA' },
  { id: 'btc', name: 'BTC', icon: '₿', color: '#F7931A' },
  { id: 'sol', name: 'SOL', icon: '◎', color: '#00FFA3' },
];

export function PlayerCard({
  address,
  portfolio,
  value,
  stakeAmount,
  isMe,
  isWinner,
  prices,
}: PlayerCardProps) {
  const pnl = value - stakeAmount;
  const pnlPercent = stakeAmount > 0 ? (pnl / stakeAmount) * 100 : 0;

  return (
    <div className={`bg-card rounded-2xl border-2 p-6 ${
      isWinner 
        ? 'border-success bg-success/5' 
        : isMe 
        ? 'border-primary' 
        : 'border-card-border'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            isMe ? 'bg-primary text-white' : 'bg-card-border'
          }`}>
            {isMe ? 'YOU' : shortenAddress(address).slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold">{isMe ? 'Your Portfolio' : shortenAddress(address)}</p>
            {isWinner && (
              <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                🏆 Winner
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Total Value */}
      <div className="bg-background rounded-xl p-4 mb-4">
        <p className="text-sm text-muted mb-1">Total Value</p>
        <p className="text-3xl font-bold">{formatUSD(value)}</p>
        <p className={`text-sm font-semibold ${pnl >= 0 ? 'text-success' : 'text-danger'}`}>
          {pnl >= 0 ? '+' : ''}{formatUSD(pnl)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
        </p>
      </div>

      {/* Cash Balance */}
      <div className="flex items-center justify-between p-3 bg-background rounded-xl mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💵</span>
          <span className="font-medium">USDC</span>
        </div>
        <span className="font-bold text-success">{formatUSD(portfolio.usdc)}</span>
      </div>

      {/* Assets */}
      <div className="space-y-2">
        {ASSETS.map((asset) => {
          const amount = portfolio.assets[asset.id] || 0;
          const assetValue = amount * prices[asset.id as keyof typeof prices];
          
          return (
            <div
              key={asset.id}
              className="flex items-center justify-between p-3 bg-background rounded-xl"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{asset.icon}</span>
                <div>
                  <p className="font-medium">{asset.name}</p>
                  <p className="text-xs text-muted">{amount.toFixed(6)}</p>
                </div>
              </div>
              <span className="font-bold">{formatUSD(assetValue)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
