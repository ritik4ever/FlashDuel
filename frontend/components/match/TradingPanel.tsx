'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { formatUSD } from '@/lib/utils';

type Asset = 'eth' | 'btc' | 'sol';
type Action = 'buy' | 'sell';

interface TradingPanelProps {
  prices: { eth: number; btc: number; sol: number };
  portfolio: { usdc: number; assets: { [key: string]: number } };
  onTrade: (asset: Asset, action: Action, quantity: number, price: number) => Promise<boolean>;
  isTrading: boolean;
  disabled?: boolean;
}

const ASSETS = [
  { id: 'eth' as Asset, name: 'Ethereum', symbol: 'ETH', icon: '⟠' },
  { id: 'btc' as Asset, name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
  { id: 'sol' as Asset, name: 'Solana', symbol: 'SOL', icon: '◎' },
];

export function TradingPanel({
  prices,
  portfolio,
  onTrade,
  isTrading,
  disabled = false,
}: TradingPanelProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset>('eth');
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState<Action>('buy');

  const currentPrice = prices[selectedAsset];
  const quantity = parseFloat(amount) || 0;
  const total = quantity * currentPrice;
  const assetBalance = portfolio.assets[selectedAsset] || 0;

  const canBuy = portfolio.usdc >= total && total > 0;
  const canSell = assetBalance >= quantity && quantity > 0;

  const handleTrade = async () => {
    if (quantity <= 0) return;
    
    const success = await onTrade(selectedAsset, action, quantity, currentPrice);
    if (success) {
      setAmount('');
    }
  };

  const setQuickAmount = (percent: number) => {
    if (action === 'buy') {
      const maxAmount = portfolio.usdc / currentPrice;
      setAmount((maxAmount * percent).toFixed(6));
    } else {
      setAmount((assetBalance * percent).toFixed(6));
    }
  };

  return (
    <div className="bg-card border border-card-border rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-4">📈 Trade</h3>

      {/* Asset Selection */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {ASSETS.map((asset) => (
          <button
            key={asset.id}
            onClick={() => setSelectedAsset(asset.id)}
            disabled={disabled}
            className={`p-3 rounded-xl text-center transition-all ${
              selectedAsset === asset.id
                ? 'bg-primary text-white'
                : 'bg-background border border-card-border hover:border-primary/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-2xl block">{asset.icon}</span>
            <span className="text-sm font-semibold">{asset.symbol}</span>
          </button>
        ))}
      </div>

      {/* Current Price */}
      <div className="bg-background rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Current Price</p>
            <p className="text-2xl font-bold">{formatUSD(currentPrice)}</p>
          </div>
          <span className="text-4xl">
            {ASSETS.find(a => a.id === selectedAsset)?.icon}
          </span>
        </div>
      </div>

      {/* Buy/Sell Toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setAction('buy')}
          disabled={disabled}
          className={`py-2 rounded-xl font-semibold transition-all ${
            action === 'buy'
              ? 'bg-success text-white'
              : 'bg-background border border-card-border'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setAction('sell')}
          disabled={disabled}
          className={`py-2 rounded-xl font-semibold transition-all ${
            action === 'sell'
              ? 'bg-danger text-white'
              : 'bg-background border border-card-border'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm text-muted mb-2">
          Amount ({ASSETS.find(a => a.id === selectedAsset)?.symbol})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          disabled={disabled}
          className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-lg focus:border-primary outline-none disabled:opacity-50"
        />
        
        {/* Quick Amounts */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {[0.25, 0.5, 0.75, 1].map((percent) => (
            <button
              key={percent}
              onClick={() => setQuickAmount(percent)}
              disabled={disabled}
              className="py-1 text-sm bg-background border border-card-border rounded-lg hover:border-primary/50 disabled:opacity-50"
            >
              {percent * 100}%
            </button>
          ))}
        </div>
      </div>

      {/* Balance Info */}
      <div className="bg-background rounded-xl p-3 mb-4 text-sm">
        <div className="flex justify-between mb-1">
          <span className="text-muted">Available USDC:</span>
          <span className="font-semibold">{formatUSD(portfolio.usdc)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">
            {ASSETS.find(a => a.id === selectedAsset)?.symbol} Balance:
          </span>
          <span className="font-semibold">{assetBalance.toFixed(6)}</span>
        </div>
      </div>

      {/* Total */}
      {quantity > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background rounded-xl p-3 mb-4"
        >
          <div className="flex justify-between">
            <span className="text-muted">Total</span>
            <span className="font-bold text-lg">{formatUSD(total)}</span>
          </div>
        </motion.div>
      )}

      {/* Trade Button */}
      <Button
        onClick={handleTrade}
        disabled={disabled || isTrading || (action === 'buy' ? !canBuy : !canSell)}
        loading={isTrading}
        className={`w-full ${
          action === 'buy' 
            ? 'bg-success hover:bg-success/90' 
            : 'bg-danger hover:bg-danger/90'
        }`}
        size="lg"
      >
        {action === 'buy' ? 'Buy' : 'Sell'} {ASSETS.find(a => a.id === selectedAsset)?.symbol}
      </Button>

      {/* Error/Info Messages */}
      {action === 'buy' && quantity > 0 && !canBuy && (
        <p className="text-danger text-sm mt-2 text-center">Insufficient USDC balance</p>
      )}
      {action === 'sell' && quantity > 0 && !canSell && (
        <p className="text-danger text-sm mt-2 text-center">Insufficient {ASSETS.find(a => a.id === selectedAsset)?.symbol} balance</p>
      )}
    </div>
  );
}
