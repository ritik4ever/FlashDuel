'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Slider } from '@/components/ui/Slider';
import { useGameStore } from '@/lib/store';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatUSD, shortenAddress, getTimeAgo } from '@/lib/utils';
import { STAKE_OPTIONS, DURATION_OPTIONS, ASSETS } from '@/lib/constants';

export default function LobbyPage() {
    const router = useRouter();
    const { isConnected, address, openMatches, currentMatch } = useGameStore();
    const { createMatch, joinMatch } = useWebSocket();

    const [stakeAmount, setStakeAmount] = useState(50);
    const [duration, setDuration] = useState(300);
    const [isCreating, setIsCreating] = useState(false);

    if (currentMatch?.status === 'active') {
        router.push(`/match/${currentMatch.id}`);
        return null;
    }

    const handleCreateMatch = () => {
        if (!isConnected) return;
        setIsCreating(true);
        createMatch(stakeAmount, duration, ['eth', 'btc', 'sol']);
    };

    const handleJoinMatch = (matchId: string) => {
        if (!isConnected) return;
        joinMatch(matchId);
    };

    const handleCancelWaiting = () => {
        setIsCreating(false);
    };

    if (currentMatch?.status === 'waiting') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            className="text-3xl"
                        >
                            ⚔️
                        </motion.div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Waiting for Opponent</h2>
                    <p className="text-dark-300 mb-6">
                        Your match is ready. Waiting for someone to accept the challenge...
                    </p>

                    <div className="bg-dark-700 rounded-xl p-4 mb-6">
                        <div className="flex justify-between mb-2">
                            <span className="text-dark-400">Stake</span>
                            <span className="text-white font-semibold">{formatUSD(currentMatch.stakeAmount)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-dark-400">Duration</span>
                            <span className="text-white font-semibold">{currentMatch.duration / 60} min</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-dark-400">Prize Pool</span>
                            <span className="text-primary-400 font-semibold">{formatUSD(currentMatch.prizePool)}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>

                    <Button variant="secondary" onClick={handleCancelWaiting} className="w-full">
                        Cancel Match
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">Battle Lobby</h1>
                    <p className="text-dark-300">Create a match or join an existing one</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="text-2xl">⚔️</span>
                            Create Match
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <Slider
                                    value={stakeAmount}
                                    onChange={setStakeAmount}
                                    min={10}
                                    max={100}
                                    step={5}
                                    label="Stake Amount"
                                    formatValue={(v) => `$${v} USDC`}
                                    marks={STAKE_OPTIONS.map(v => ({ value: v, label: `$${v}` }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-dark-300 mb-3">Match Duration</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {DURATION_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setDuration(opt.value)}
                                            className={`py-3 px-4 rounded-xl font-semibold transition-all ${duration === opt.value
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-dark-300 mb-3">Tradeable Assets</label>
                                <div className="flex gap-2">
                                    {Object.entries(ASSETS).map(([key, asset]) => (
                                        <div
                                            key={key}
                                            className="flex items-center gap-2 bg-dark-700 px-4 py-2 rounded-xl"
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                                style={{ backgroundColor: asset.color + '30', color: asset.color }}
                                            >
                                                {asset.symbol[0]}
                                            </div>
                                            <span className="text-sm text-white">{asset.symbol}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-dark-700/50 rounded-xl p-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-dark-400">Your Stake</span>
                                    <span className="text-white font-semibold">{formatUSD(stakeAmount)}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-dark-400">Prize Pool</span>
                                    <span className="text-primary-400 font-bold">{formatUSD(stakeAmount * 2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-dark-400">Platform Fee (5%)</span>
                                    <span className="text-dark-300">{formatUSD(stakeAmount * 2 * 0.05)}</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleCreateMatch}
                                disabled={!isConnected || isCreating}
                                loading={isCreating}
                                className="w-full"
                                size="lg"
                            >
                                {!isConnected ? 'Connect Wallet First' : 'Create Match'}
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="text-2xl">🎯</span>
                            Open Matches
                            {openMatches.length > 0 && (
                                <Badge variant="primary" className="ml-2">{openMatches.length}</Badge>
                            )}
                        </h2>

                        {openMatches.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">🏜️</div>
                                <p className="text-dark-400">No open matches right now</p>
                                <p className="text-dark-500 text-sm">Create one and wait for challengers!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {openMatches.map((match) => (
                                    <motion.div
                                        key={match.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-dark-700 rounded-xl p-4 hover:bg-dark-600 transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {match.playerA.slice(2, 4).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-semibold">{shortenAddress(match.playerA)}</p>
                                                    <p className="text-dark-400 text-sm">{getTimeAgo(match.createdAt)}</p>
                                                </div>
                                            </div>
                                            <Badge variant="warning">{match.duration / 60}m</Badge>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-dark-400 text-sm">Stake</p>
                                                <p className="text-white font-bold">{formatUSD(match.stakeAmount)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-dark-400 text-sm">Prize Pool</p>
                                                <p className="text-primary-400 font-bold">{formatUSD(match.prizePool)}</p>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => handleJoinMatch(match.id)}
                                            disabled={!isConnected || match.playerA === address}
                                            className="w-full mt-4"
                                            size="sm"
                                        >
                                            {match.playerA === address ? 'Your Match' : 'Join Battle'}
                                        </Button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}