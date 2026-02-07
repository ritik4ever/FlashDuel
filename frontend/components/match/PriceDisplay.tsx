'use client';

import { motion } from 'framer-motion';
import { formatUSD } from '@/lib/utils';

interface PriceDisplayProps {
  prices: { eth: number; btc: number; sol: number };
  changes?: { eth: number; btc: number; sol: number };
  compact?: boolean;
}

const ASSETS = [
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: '⟠', color: '#627EEA' },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: '₿', color: '#F7931A' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', icon: '◎', color: '#00FFA3' },
];

export function PriceDisplay({ prices, changes, compact = false }: PriceDisplayProps) {
  if (compact) {
    return (
      <div className="flex gap-4">
        {ASSETS.map((asset) => (
          <div key={asset.id} className="flex items-center gap-2">
            <span>{asset.icon}</span>
            <span className="font-semibold">
              {formatUSD(prices[asset.id as keyof typeof prices])}
            </span>
            {changes && (
              <span className={`text-xs ${
                changes[asset.id as keyof typeof changes] >= 0 
                  ? 'text-success' 
                  : 'text-danger'
              }`}>
                {changes[asset.id as keyof typeof changes] >= 0 ? '+' : ''}
                {changes[asset.id as keyof typeof changes].toFixed(2)}%
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-4">💹 Live Prices</h3>
      
      <div className="space-y-4">
        {ASSETS.map((asset) => {
          const price = prices[asset.id as keyof typeof prices];
          const change = changes?.[asset.id as keyof typeof changes] || 0;
          
          return (
            <motion.div
              key={asset.id}
              className="p-4 bg-background rounded-xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{asset.icon}</span>
                  <div>
                    <p className="font-bold">{asset.name}</p>
                    <p className="text-sm text-muted">{asset.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{formatUSD(price)}</p>
                  {changes && (
                    <p className={`text-sm font-semibold ${
                      change >= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
                    </p>
                  )}
                </div>
              </div>
              
              {/* Mini Chart Placeholder */}
              <div className="h-8 bg-card-border/30 rounded flex items-end px-1 gap-0.5 overflow-hidden">
                {generateMiniChart(12).map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t transition-all"
                    style={{ 
                      height: `${h}%`,
                      backgroundColor: change >= 0 ? '#10B981' : '#EF4444',
                      opacity: 0.3 + (i / 12) * 0.7,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-center">
        <p className="text-xs text-muted">
          Prices update every 10 seconds • Powered by CoinGecko
        </p>
      </div>
    </div>
  );
}

// Generate random mini chart data
function generateMiniChart(points: number): number[] {
  const data: number[] = [];
  let value = 50;
  
  for (let i = 0; i < points; i++) {
    value += (Math.random() - 0.5) * 20;
    value = Math.max(20, Math.min(100, value));
    data.push(value);
  }
  
  return data;
}

// Single Asset Price Card
export function AssetPriceCard({
  asset,
  price,
  change,
  onClick,
  selected,
}: {
  asset: { id: string; name: string; symbol: string; icon: string };
  price: number;
  change?: number;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`p-4 rounded-xl text-left w-full transition-all ${
        selected
          ? 'bg-primary/20 border-2 border-primary'
          : 'bg-card border border-card-border hover:border-primary/50'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{asset.icon}</span>
          <div>
            <p className="font-bold">{asset.symbol}</p>
            <p className="text-xs text-muted">{asset.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold">{formatUSD(price)}</p>
          {change !== undefined && (
            <p className={`text-xs ${change >= 0 ? 'text-success' : 'text-danger'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}
