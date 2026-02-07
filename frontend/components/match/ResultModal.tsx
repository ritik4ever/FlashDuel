'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { formatUSD, shortenAddress } from '@/lib/utils';

interface ResultModalProps {
  isOpen: boolean;
  isWinner: boolean;
  myAddress: string;
  opponentAddress: string;
  myValue: number;
  opponentValue: number;
  prizePool: number;
  myScore: number;
  opponentScore: number;
  stakeAmount: number;
  onClose?: () => void;
}

export function ResultModal({
  isOpen,
  isWinner,
  myAddress,
  opponentAddress,
  myValue,
  opponentValue,
  prizePool,
  myScore,
  opponentScore,
  stakeAmount,
  onClose,
}: ResultModalProps) {
  const router = useRouter();
  const winnings = prizePool * 0.95;
  const myPnl = myValue - stakeAmount;
  const opponentPnl = opponentValue - stakeAmount;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-card border border-card-border rounded-3xl p-8 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Winner/Loser Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-center mb-6"
            >
              <span className="text-8xl">
                {isWinner ? '🏆' : '😢'}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`text-4xl font-bold text-center mb-2 ${
                isWinner ? 'text-success' : 'text-danger'
              }`}
            >
              {isWinner ? 'Victory!' : 'Defeat'}
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-muted mb-6"
            >
              {isWinner
                ? `Congratulations! You won ${formatUSD(winnings)}!`
                : 'Better luck next time!'}
            </motion.p>

            {/* Comparison */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              {/* You */}
              <div className={`p-4 rounded-xl ${isWinner ? 'bg-success/20 border-2 border-success' : 'bg-card-border/50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isWinner && <span>🏆</span>}
                  <p className="font-bold">You</p>
                </div>
                <p className="text-2xl font-bold">{formatUSD(myValue)}</p>
                <p className={`text-sm ${myPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                  {myPnl >= 0 ? '+' : ''}{formatUSD(myPnl)}
                  <span className="text-muted ml-1">
                    ({(myScore / 100).toFixed(2)}%)
                  </span>
                </p>
              </div>

              {/* Opponent */}
              <div className={`p-4 rounded-xl ${!isWinner ? 'bg-success/20 border-2 border-success' : 'bg-card-border/50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {!isWinner && <span>🏆</span>}
                  <p className="font-bold">{shortenAddress(opponentAddress)}</p>
                </div>
                <p className="text-2xl font-bold">{formatUSD(opponentValue)}</p>
                <p className={`text-sm ${opponentPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                  {opponentPnl >= 0 ? '+' : ''}{formatUSD(opponentPnl)}
                  <span className="text-muted ml-1">
                    ({(opponentScore / 100).toFixed(2)}%)
                  </span>
                </p>
              </div>
            </motion.div>

            {/* Prize Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-background rounded-xl p-4 mb-6"
            >
              <div className="flex justify-between mb-2">
                <span className="text-muted">Prize Pool</span>
                <span className="font-semibold">{formatUSD(prizePool)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted">Platform Fee (5%)</span>
                <span className="font-semibold">-{formatUSD(prizePool * 0.05)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-card-border">
                <span className="font-bold">Winner Payout</span>
                <span className="font-bold text-success">{formatUSD(winnings)}</span>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex gap-4"
            >
              <Button
                onClick={() => router.push('/lobby')}
                className="flex-1"
                size="lg"
              >
                Play Again
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push('/')}
                className="flex-1"
                size="lg"
              >
                Home
              </Button>
            </motion.div>

            {/* Share */}
            {isWinner && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4 text-center"
              >
                <button className="text-sm text-primary hover:underline">
                  Share your victory on Twitter 🐦
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
