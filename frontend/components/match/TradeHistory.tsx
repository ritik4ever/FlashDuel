'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { formatUSD } from '@/lib/utils';

interface Trade {
  id: string;
  asset: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  timestamp: number;
}

interface TradeHistoryProps {
  trades: Trade[];
  maxItems?: number;
}

const ASSET_ICONS: { [key: string]: string } = {
  eth: '⟠',
  btc: '₿',
  sol: '◎',
};

export function TradeHistory({ trades, maxItems = 10 }: TradeHistoryProps) {
  const recentTrades = trades.slice(-maxItems).reverse();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (trades.length === 0) {
    return (
      <div className="bg-card border border-card-border rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">📋 Trade History</h3>
        <div className="text-center py-8 text-muted">
          <p className="text-4xl mb-2">📊</p>
          <p>No trades yet</p>
          <p className="text-sm">Start trading to see your history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">📋 Trade History</h3>
        <span className="text-sm text-muted">{trades.length} trades</span>
      </div>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        <AnimatePresence>
          {recentTrades.map((trade, index) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-3 rounded-xl ${
                trade.action === 'buy' 
                  ? 'bg-success/10 border border-success/20' 
                  : 'bg-danger/10 border border-danger/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ASSET_ICONS[trade.asset] || '🪙'}</span>
                <div>
                  <p className="font-semibold">
                    <span className={trade.action === 'buy' ? 'text-success' : 'text-danger'}>
                      {trade.action.toUpperCase()}
                    </span>
                    {' '}{trade.quantity.toFixed(6)} {trade.asset.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted">
                    @ {formatUSD(trade.price)} • {formatTime(trade.timestamp)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${trade.action === 'buy' ? 'text-danger' : 'text-success'}`}>
                  {trade.action === 'buy' ? '-' : '+'}{formatUSD(trade.total)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Compact trade list for sidebar
export function TradeList({ trades, limit = 5 }: { trades: Trade[]; limit?: number }) {
  const recentTrades = trades.slice(-limit).reverse();

  return (
    <div className="space-y-2">
      {recentTrades.map((trade) => (
        <div
          key={trade.id}
          className="flex items-center justify-between text-sm"
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              trade.action === 'buy' ? 'bg-success' : 'bg-danger'
            }`} />
            <span>
              {trade.action === 'buy' ? 'Bought' : 'Sold'} {trade.quantity.toFixed(4)} {trade.asset.toUpperCase()}
            </span>
          </div>
          <span className="text-muted">{formatUSD(trade.total)}</span>
        </div>
      ))}
    </div>
  );
}
