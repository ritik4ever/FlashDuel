'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatUnits } from 'viem';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LivePrices } from '@/components/LivePrices';
import {
    useUSDCBalance,
    useUSDCAllowance,
    useUSDC,
    useFlashDuel,
    usePlatformStats,
    useLeaderboard,
    useOpenMatches,
} from '@/hooks/useContract';

// Constants
const STAKE_OPTIONS = [10, 25, 50, 100];
const DURATION_OPTIONS = [
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
];

export default function LobbyPage() {
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const [stakeAmount, setStakeAmount] = useState(10);
    const [duration, setDuration] = useState(300);
    const [joiningMatchId, setJoiningMatchId] = useState<string | null>(null);
    const [joiningStake, setJoiningStake] = useState<number>(0);

    // Contract hooks
    const { balance: usdcBalance, isLoading: balanceLoading, refetch: refetchBalance } = useUSDCBalance(address as `0x${string}`);
    const { allowance, refetch: refetchAllowance } = useUSDCAllowance(address as `0x${string}`);
    const {
        approve,
        faucet,
        isPending: usdcPending,
        isConfirming: usdcConfirming,
        isSuccess: usdcSuccess,
        reset: resetUSDC
    } = useUSDC();
    const {
        createMatch: createMatchOnChain,
        joinMatch: joinMatchOnChain,
        isPending: matchPending,
        isConfirming: matchConfirming,
        isSuccess: matchSuccess,
        hash: matchHash,
        reset: resetMatch
    } = useFlashDuel();
    const { stats: platformStats } = usePlatformStats();
    const { leaderboard } = useLeaderboard(5);

    // Get open matches from CONTRACT
    const { matches: contractMatches, refetch: refetchContractMatches } = useOpenMatches();

    // Process contract matches
    const allOpenMatches = contractMatches.map(match => ({
        id: match.id as `0x${string}`,
        playerA: match.playerA as string,
        playerB: match.playerB as string,
        stakeAmount: Number(formatUnits(match.stakeAmount, 6)),
        prizePool: Number(formatUnits(match.prizePool, 6)),
        duration: Number(match.duration),
        createdAt: Number(match.createdAt) * 1000,
        status: Number(match.status),
    })).filter(match => match.status === 0); // 0 = Waiting

    // Refetch after successful USDC transaction (approve/faucet)
    useEffect(() => {
        if (usdcSuccess) {
            refetchBalance();
            refetchAllowance();

            // If we were trying to join a match after approval, now join it
            if (joiningMatchId && allowance >= joiningStake) {
                joinMatchOnChain(joiningMatchId as `0x${string}`);
                setJoiningMatchId(null);
                setJoiningStake(0);
            }

            resetUSDC();
        }
    }, [usdcSuccess]);

    // Refetch and redirect after successful match creation/join
    useEffect(() => {
        if (matchSuccess && matchHash) {
            refetchContractMatches();
            refetchBalance();

            // Navigate to the match page
            // For now, we'll go to a trading page
            // The matchHash can be used to find the match ID
            setTimeout(() => {
                router.push(`/match/${matchHash}`);
            }, 2000);

            resetMatch();
        }
    }, [matchSuccess, matchHash]);

    // Auto-refresh contract matches every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refetchContractMatches();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const needsApproval = (amount: number) => allowance < amount;
    const hasEnoughBalance = (amount: number) => usdcBalance >= amount;

    const handleCreateMatch = () => {
        if (needsApproval(stakeAmount)) {
            approve(stakeAmount * 10); // Approve extra for future
        } else {
            createMatchOnChain(stakeAmount, duration);
        }
    };

    const handleJoinMatch = (matchId: string, matchStake: number) => {
        if (!hasEnoughBalance(matchStake)) {
            alert('Insufficient USDC balance. Use the faucet to get test USDC.');
            return;
        }

        if (needsApproval(matchStake)) {
            // Save match info and approve first
            setJoiningMatchId(matchId);
            setJoiningStake(matchStake);
            approve(matchStake * 10);
        } else {
            // Join directly
            joinMatchOnChain(matchId as `0x${string}`);
        }
    };

    const formatUSD = (value: number) => {
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const shortenAddress = (addr: string) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const getTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    const isMyMatch = (playerA: string) => {
        return playerA.toLowerCase() === address?.toLowerCase();
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="p-8 text-center max-w-md">
                    <h1 className="text-3xl font-bold mb-4">⚔️ FlashDuel</h1>
                    <p className="text-muted mb-6">Connect your wallet to start trading battles</p>
                    <ConnectButton />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">Battle Lobby</h1>
                    <p className="text-muted">Create a match or join an existing one</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-muted">Live</span>
                    </div>
                </div>

                {/* Live Prices Banner */}
                <div className="mb-6">
                    <LivePrices compact />
                </div>

                {/* Platform Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="p-4 text-center">
                        <p className="text-2xl font-bold text-primary">{platformStats?.totalMatches || 0}</p>
                        <p className="text-sm text-muted">Total Matches</p>
                    </Card>
                    <Card className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-500">{formatUSD(platformStats?.totalPrizePool || 0)}</p>
                        <p className="text-sm text-muted">Prize Distributed</p>
                    </Card>
                    <Card className="p-4 text-center">
                        <p className="text-2xl font-bold">{platformStats?.totalPlayers || 0}</p>
                        <p className="text-sm text-muted">Total Players</p>
                    </Card>
                    <Card className="p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-500">{formatUSD(platformStats?.totalFees || 0)}</p>
                        <p className="text-sm text-muted">Fees Collected</p>
                    </Card>
                </div>

                {/* Transaction Status */}
                {(matchPending || matchConfirming) && (
                    <div className="mb-6 p-4 bg-primary/20 border border-primary rounded-xl text-center">
                        <p className="font-semibold">
                            {matchPending ? '⏳ Confirm transaction in your wallet...' : '⛓️ Transaction confirming...'}
                        </p>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Create Match */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>⚔️</span> Create Match
                        </h2>

                        {/* Balance Display */}
                        <div className="bg-background rounded-xl p-4 mb-4 flex items-center justify-between">
                            <span className="text-muted">Your Balance</span>
                            <div className="text-right">
                                {balanceLoading ? (
                                    <div className="animate-pulse h-6 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
                                ) : (
                                    <span className="font-bold text-lg">{formatUSD(usdcBalance)} USDC</span>
                                )}
                            </div>
                        </div>

                        {/* Faucet Button */}
                        {usdcBalance < 100 && (
                            <button
                                onClick={() => faucet()}
                                disabled={usdcPending || usdcConfirming}
                                className="w-full mb-4 py-2 bg-blue-500/20 text-blue-500 rounded-xl hover:bg-blue-500/30 transition-colors text-sm disabled:opacity-50"
                            >
                                {usdcPending || usdcConfirming ? '⏳ Getting USDC...' : '🚰 Get Test USDC (1000 USDC)'}
                            </button>
                        )}

                        {/* Stake Amount */}
                        <div className="mb-4">
                            <label className="block text-sm text-muted mb-2">Stake Amount</label>
                            <div className="grid grid-cols-4 gap-2">
                                {STAKE_OPTIONS.map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => setStakeAmount(amount)}
                                        className={`py-2 rounded-xl font-semibold transition-all ${stakeAmount === amount
                                            ? 'bg-primary text-white'
                                            : 'bg-background border border-card-border hover:border-primary/50'
                                            }`}
                                    >
                                        ${amount}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="mb-4">
                            <label className="block text-sm text-muted mb-2">Match Duration</label>
                            <div className="grid grid-cols-3 gap-2">
                                {DURATION_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setDuration(opt.value)}
                                        className={`py-2 rounded-xl font-semibold transition-all ${duration === opt.value
                                            ? 'bg-primary text-white'
                                            : 'bg-background border border-card-border hover:border-primary/50'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-background rounded-xl p-4 mb-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted">Your Stake</span>
                                <span className="font-semibold">{formatUSD(stakeAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Prize Pool</span>
                                <span className="font-semibold text-green-500">{formatUSD(stakeAmount * 2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Platform Fee (5%)</span>
                                <span className="font-semibold">{formatUSD(stakeAmount * 2 * 0.05)}</span>
                            </div>
                        </div>

                        {/* Action Button */}
                        <Button
                            onClick={handleCreateMatch}
                            disabled={!hasEnoughBalance(stakeAmount) || usdcPending || usdcConfirming || matchPending || matchConfirming}
                            loading={usdcPending || usdcConfirming || matchPending || matchConfirming}
                            className="w-full"
                            size="lg"
                        >
                            {!hasEnoughBalance(stakeAmount)
                                ? 'Insufficient Balance'
                                : needsApproval(stakeAmount)
                                    ? 'Approve USDC'
                                    : 'Create Match'}
                        </Button>
                    </Card>

                    {/* Open Matches */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>🎯</span> Open Matches
                            <span className="ml-auto bg-primary/20 text-primary text-sm px-2 py-1 rounded-full">
                                {allOpenMatches.length}
                            </span>
                        </h2>

                        {allOpenMatches.length === 0 ? (
                            <div className="text-center py-8 text-muted">
                                <p className="text-4xl mb-2">🏜️</p>
                                <p>No open matches</p>
                                <p className="text-sm">Create one to start!</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {allOpenMatches.map((match) => (
                                    <div
                                        key={match.id}
                                        className="bg-background rounded-xl p-4"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {shortenAddress(match.playerA).slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{shortenAddress(match.playerA)}</p>
                                                    <p className="text-xs text-muted">{getTimeAgo(match.createdAt)}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                                                {Math.floor(match.duration / 60)}m
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-xs text-muted">Stake</p>
                                                <p className="font-bold">{formatUSD(match.stakeAmount)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted">Prize Pool</p>
                                                <p className="font-bold text-green-500">{formatUSD(match.prizePool)}</p>
                                            </div>
                                        </div>

                                        {isMyMatch(match.playerA) ? (
                                            <div className="w-full py-2 bg-gray-500/20 text-gray-500 rounded-xl text-center text-sm">
                                                Your Match - Waiting for opponent...
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => handleJoinMatch(match.id, match.stakeAmount)}
                                                className="w-full"
                                                size="sm"
                                                disabled={usdcPending || usdcConfirming || matchPending || matchConfirming || !hasEnoughBalance(match.stakeAmount)}
                                                loading={joiningMatchId === match.id && (usdcPending || usdcConfirming || matchPending || matchConfirming)}
                                            >
                                                {!hasEnoughBalance(match.stakeAmount)
                                                    ? 'Need More USDC'
                                                    : needsApproval(match.stakeAmount)
                                                        ? `Approve & Join (${formatUSD(match.stakeAmount)})`
                                                        : `Join Battle ⚔️`}
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Leaderboard & Prices */}
                    <div className="space-y-6">
                        {/* Leaderboard */}
                        <Card className="p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span>🏆</span> Leaderboard
                            </h2>

                            {leaderboard.length === 0 ? (
                                <div className="text-center py-4 text-muted">
                                    <p>No players yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {leaderboard.map((player, index) => (
                                        <div
                                            key={player.player}
                                            className="flex items-center gap-3 p-3 bg-background rounded-xl"
                                        >
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${index === 0 ? 'bg-yellow-500 text-black' :
                                                index === 1 ? 'bg-gray-400 text-black' :
                                                    index === 2 ? 'bg-amber-600 text-white' :
                                                        'bg-card-border'
                                                }`}>
                                                {index + 1}
                                            </span>
                                            <div className="flex-1">
                                                <p className="font-semibold">{shortenAddress(player.player)}</p>
                                                <p className="text-xs text-muted">
                                                    {Number(player.wins)} wins / {Number(player.totalMatches)} matches
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-500">
                                                    {formatUSD(Number(player.earnings) / 1e6)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Live Prices */}
                        <LivePrices />
                    </div>
                </div>
            </div>
        </div>
    );
}
