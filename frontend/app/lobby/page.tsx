'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Slider } from '@/components/ui/Slider';
import {
    useUSDC,
    useUSDCBalance,
    useUSDCAllowance,
    useFlashDuel,
    useOpenMatches,
    useLeaderboard,
    usePlatformStats
} from '@/hooks/useContract';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatUSD, shortenAddress, getTimeAgo } from '@/lib/utils';
import { STAKE_OPTIONS, DURATION_OPTIONS, ASSETS } from '@/lib/constants';

export default function LobbyPage() {
    const router = useRouter();
    const { address, isConnected } = useAccount();

    const { balance, refetch: refetchBalance } = useUSDCBalance(address);
    const { allowance, refetch: refetchAllowance } = useUSDCAllowance(address);
    const { approve, faucet, isPending: isApproving } = useUSDC();
    const {
        createMatch: createMatchOnChain,
        joinMatch: joinMatchOnChain,
        isPending: isContractPending,
        isConfirming,
        isSuccess
    } = useFlashDuel();
    const { matches: openMatches, refetch: refetchMatches, isLoading: isLoadingMatches } = useOpenMatches();
    const { leaderboard } = useLeaderboard(5);
    const { stats: platformStats } = usePlatformStats();

    const [stakeAmount, setStakeAmount] = useState(50);
    const [duration, setDuration] = useState(300);
    const [step, setStep] = useState<'approve' | 'create'>('approve');

    useEffect(() => {
        if (allowance >= stakeAmount) {
            setStep('create');
        } else {
            setStep('approve');
        }
    }, [allowance, stakeAmount]);

    useEffect(() => {
        if (isSuccess) {
            refetchBalance();
            refetchAllowance();
            refetchMatches();
        }
    }, [isSuccess, refetchBalance, refetchAllowance, refetchMatches]);

    const handleApprove = () => {
        approve(stakeAmount);
    };

    const handleCreateMatch = () => {
        createMatchOnChain(stakeAmount, duration);
    };

    const handleJoinMatch = (matchId: `0x${string}`) => {
        joinMatchOnChain(matchId);
    };

    const handleFaucet = () => {
        faucet();
    };

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-4">Battle Lobby</h1>
                    <p className="text-muted">Create a match or join an existing one</p>
                </div>

                {platformStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <Card className="p-4 text-center">
                            <div className="text-2xl font-bold text-primary">{platformStats.totalMatches}</div>
                            <div className="text-sm text-muted">Total Matches</div>
                        </Card>
                        <Card className="p-4 text-center">
                            <div className="text-2xl font-bold text-success">{formatUSD(platformStats.totalPrizePool)}</div>
                            <div className="text-sm text-muted">Prize Distributed</div>
                        </Card>
                        <Card className="p-4 text-center">
                            <div className="text-2xl font-bold">{platformStats.totalPlayers}</div>
                            <div className="text-sm text-muted">Total Players</div>
                        </Card>
                        <Card className="p-4 text-center">
                            <div className="text-2xl font-bold text-primary">{formatUSD(platformStats.totalFees)}</div>
                            <div className="text-sm text-muted">Fees Collected</div>
                        </Card>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    <Card className="p-6 lg:col-span-1">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="text-2xl">⚔️</span>
                            Create Match
                        </h2>

                        <div className="bg-card border border-card-border rounded-xl p-4 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-muted">Your Balance</span>
                                <span className="font-bold">{formatUSD(balance)} USDC</span>
                            </div>
                            {balance < 10 && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={handleFaucet}
                                    loading={isApproving}
                                >
                                    Get Test USDC (Faucet)
                                </Button>
                            )}
                        </div>

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
                                <label className="block text-sm text-muted mb-3">Match Duration</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {DURATION_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setDuration(opt.value)}
                                            className={`py-2 px-3 rounded-xl font-semibold text-sm transition-all ${duration === opt.value
                                                ? 'bg-primary text-white'
                                                : 'bg-card border border-card-border hover:border-primary/50'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-card border border-card-border rounded-xl p-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-muted">Your Stake</span>
                                    <span className="font-semibold">{formatUSD(stakeAmount)}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-muted">Prize Pool</span>
                                    <span className="text-primary font-bold">{formatUSD(stakeAmount * 2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Platform Fee (5%)</span>
                                    <span className="text-muted">{formatUSD(stakeAmount * 2 * 0.05)}</span>
                                </div>
                            </div>

                            {!isConnected ? (
                                <Button disabled className="w-full" size="lg">
                                    Connect Wallet First
                                </Button>
                            ) : step === 'approve' ? (
                                <Button
                                    onClick={handleApprove}
                                    loading={isApproving || isConfirming}
                                    className="w-full"
                                    size="lg"
                                >
                                    Approve USDC
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleCreateMatch}
                                    loading={isContractPending || isConfirming}
                                    disabled={balance < stakeAmount}
                                    className="w-full"
                                    size="lg"
                                >
                                    Create Match
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6 lg:col-span-1">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="text-2xl">🎯</span>
                            Open Matches
                            {openMatches.length > 0 && (
                                <Badge variant="primary" className="ml-2">{openMatches.length}</Badge>
                            )}
                        </h2>

                        {isLoadingMatches ? (
                            <div className="text-center py-12">
                                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                            </div>
                        ) : openMatches.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">🏜️</div>
                                <p className="text-muted">No open matches right now</p>
                                <p className="text-muted/60 text-sm">Create one and wait for challengers!</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                {openMatches.map((match: any) => (
                                    <motion.div
                                        key={match.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-card border border-card-border rounded-xl p-4 hover:border-primary/50 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {match.playerA.slice(2, 4).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{shortenAddress(match.playerA)}</p>
                                                    <p className="text-muted text-sm">{getTimeAgo(Number(match.createdAt) * 1000)}</p>
                                                </div>
                                            </div>
                                            <Badge variant="warning">{Number(match.duration) / 60}m</Badge>
                                        </div>

                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-muted text-sm">Stake</p>
                                                <p className="font-bold">{formatUSD(Number(formatUnits(match.stakeAmount, 6)))}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-muted text-sm">Prize Pool</p>
                                                <p className="text-primary font-bold">{formatUSD(Number(formatUnits(match.stakeAmount, 6)) * 2)}</p>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => handleJoinMatch(match.id)}
                                            disabled={!isConnected || match.playerA.toLowerCase() === address?.toLowerCase()}
                                            loading={isContractPending || isConfirming}
                                            className="w-full"
                                            size="sm"
                                        >
                                            {match.playerA.toLowerCase() === address?.toLowerCase() ? 'Your Match' : 'Join Battle'}
                                        </Button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card className="p-6 lg:col-span-1">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="text-2xl">🏆</span>
                            Leaderboard
                        </h2>

                        {leaderboard.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">📊</div>
                                <p className="text-muted">No players yet</p>
                                <p className="text-muted/60 text-sm">Be the first to compete!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {leaderboard.map((entry: any, index: number) => (
                                    <div
                                        key={entry.player}
                                        className="flex items-center gap-3 p-3 bg-card border border-card-border rounded-xl"
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-black' :
                                            index === 1 ? 'bg-gray-400 text-black' :
                                                index === 2 ? 'bg-orange-600 text-white' :
                                                    'bg-card-border'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">{shortenAddress(entry.player)}</p>
                                            <p className="text-muted text-sm">{Number(entry.wins)} wins / {Number(entry.totalMatches)} matches</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-success font-bold">{formatUSD(Number(formatUnits(entry.earnings, 6)))}</p>
                                            <p className="text-muted text-sm">{(Number(entry.winRate) / 100).toFixed(0)}% WR</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}