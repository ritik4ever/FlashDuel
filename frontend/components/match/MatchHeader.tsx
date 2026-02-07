'use client';

import { motion } from 'framer-motion';
import { formatUSD, shortenAddress } from '@/lib/utils';

interface MatchHeaderProps {
  playerA: string;
  playerB: string | null;
  myAddress: string;
  myValue: number;
  opponentValue: number;
  prizePool: number;
  timeLeft: number;
  status: 'waiting' | 'active' | 'completed' | 'settling';
}

export function MatchHeader({
  playerA,
  playerB,
  myAddress,
  myValue,
  opponentValue,
  prizePool,
  timeLeft,
  status,
}: MatchHeaderProps) {
  const isPlayerA = playerA.toLowerCase() === myAddress.toLowerCase();
  const totalValue = myValue + opponentValue;
  const myPercentage = totalValue > 0 ? (myValue / totalValue) * 100 : 50;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      {/* Timer */}
      <div className="flex justify-center mb-4">
        <div className={`px-6 py-2 rounded-full ${
          status === 'active' && timeLeft <= 30 
            ? 'bg-danger/20 text-danger animate-pulse' 
            : status === 'active'
            ? 'bg-primary/20 text-primary'
            : 'bg-card-border'
        }`}>
          {status === 'waiting' && (
            <span className="font-semibold">Waiting for opponent...</span>
          )}
          {status === 'active' && (
            <div className="text-center">
              <p className="text-xs opacity-70">Time Left</p>
              <p className="text-2xl font-bold font-mono">{formatTime(timeLeft)}</p>
            </div>
          )}
          {status === 'completed' && (
            <span className="font-semibold">Match Completed</span>
          )}
          {status === 'settling' && (
            <span className="font-semibold animate-pulse">Settling...</span>
          )}
        </div>
      </div>

      {/* Players */}
      <div className="flex items-center justify-between">
        {/* Player A (or Me) */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
              isPlayerA ? 'bg-primary text-white' : 'bg-card-border'
            }`}>
              {isPlayerA ? 'YOU' : shortenAddress(playerA).slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold">
                {isPlayerA ? 'You' : shortenAddress(playerA)}
              </p>
              <p className={`text-xl font-bold ${isPlayerA ? 'text-primary' : ''}`}>
                {formatUSD(isPlayerA ? myValue : opponentValue)}
              </p>
            </div>
          </div>
        </div>

        {/* VS and Prize */}
        <div className="text-center px-6">
          <p className="text-3xl font-bold text-muted">VS</p>
          <p className="text-sm text-muted mt-1">
            Prize: <span className="text-primary font-semibold">{formatUSD(prizePool)}</span>
          </p>
        </div>

        {/* Player B (or Opponent) */}
        <div className="flex-1 text-right">
          <div className="flex items-center gap-3 justify-end">
            <div>
              <p className="font-semibold">
                {!isPlayerA ? 'You' : playerB ? shortenAddress(playerB) : 'Waiting...'}
              </p>
              <p className={`text-xl font-bold ${!isPlayerA ? 'text-primary' : ''}`}>
                {formatUSD(!isPlayerA ? myValue : opponentValue)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
              !isPlayerA ? 'bg-primary text-white' : 'bg-card-border'
            }`}>
              {!isPlayerA ? 'YOU' : playerB ? shortenAddress(playerB).slice(0, 2) : '?'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {status === 'active' && (
        <div className="mt-4">
          <div className="h-3 bg-card-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-cyan-500"
              initial={{ width: '50%' }}
              animate={{ width: `${myPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-1 text-sm text-muted">
            <span>{myPercentage.toFixed(1)}%</span>
            <span>{(100 - myPercentage).toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
