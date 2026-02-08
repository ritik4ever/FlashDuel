'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useFlashDuel } from '@/hooks/useFlashDuel';

const STAKE_OPTIONS = [10, 25, 50, 100];
const DURATION_OPTIONS = [
    { label: '1 min', value: 60 },
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
];

export default function LobbyPage() {
    const router = useRouter();
    const [stakeAmount, setStakeAmount] = useState(10);
    const [duration, setDuration] = useState(60);

    const {
        address,
        isConnected,
        balance,
        allowance,
        prices,
        openMatches,
        platformStats,
        wsConnected,
        isPending,
        isConfirming,
        txSuccess,
        requestFaucet,
        createMatch,
        joinMatch,
        refetchMatches,
    } = useFlashDuel();

    // Auto-refresh matches
    useEffect(() => {
        const interval = setInterval(() => refetchMatches(), 5000);
        return () => clearInterval(interval);
    }, [refetchMatches]);

    const handleCreateMatch = () => {
        if (balance < stakeAmount) {
            alert('Insufficient balance. Click "Get Test USDC" first!');
            return;
        }
        createMatch(stakeAmount, duration);
    };

    const handleJoinMatch = (matchId: string, matchStake: number) => {
        if (balance < matchStake) {
            alert('Insufficient balance. Click "Get Test USDC" first!');
            return;
        }
        joinMatch(matchId, matchStake);
    };

    // Navigate to match when transaction succeeds
    useEffect(() => {
        if (txSuccess && openMatches.length > 0) {
            const myMatch = openMatches.find(
                (m) =>
                    m.playerA.toLowerCase() === address?.toLowerCase() ||
                    m.playerB?.toLowerCase() === address?.toLowerCase()
            );
            if (myMatch) {
                router.push(`/match/${myMatch.id}`);
            }
        }
    }, [txSuccess, openMatches, address, router]);

    const formatUSD = (v: number) =>
        `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const shortenAddr = (a: string) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '');
    const needsApproval = allowance < stakeAmount;

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-center max-w-md">
                    <div className="text-6xl mb-4">⚔️</div>
                    <h1 className="text-4xl font-bold mb-2 text-white">
                        Flash<span className="text-purple-500">Duel</span>
                    </h1>
                    <p className="text-yellow-500 font-semibold mb-2">Powered by Yellow Network</p>
                    <p className="text-gray-400 text-sm mb-6">1v1 Crypto Trading Battles • Zero Gas Trading</p>
                    <ConnectButton />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold mb-2">
                        Flash<span className="text-purple-500">Duel</span> ⚔️
                    </h1>
                    <p className="text-gray-400">Create a match or join an existing one</p>
                    <div className="flex items-center justify-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                            <span
                                className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}
                            />
                            <span className="text-xs text-gray-400">
                                {wsConnected ? 'Real-time Connected' : 'Connecting...'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Transaction Status */}
                {(isPending || isConfirming) && (
                    <div className="mb-6 p-4 bg-purple-500/20 border border-purple-500 rounded-xl text-center">
                        <p className="font-semibold">
                            {isPending ? '⏳ Confirm in your wallet...' : '⛓️ Transaction confirming...'}
                        </p>
                    </div>
                )}

                {/* Yellow Network Banner */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="font-bold text-yellow-500">⚡ Powered by Yellow Network</p>
                            <p className="text-sm text-gray-400">
                                Match creation on-chain • Trading off-chain (zero gas)
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Your Balance</p>
                            <p className="text-2xl font-bold text-yellow-500">{formatUSD(balance)}</p>
                            <p className="text-xs text-gray-500">USDC (Sepolia)</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-purple-500">{platformStats.totalMatches}</p>
                        <p className="text-xs text-gray-400">Total Matches</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-green-500">
                            {formatUSD(platformStats.totalPrizePool)}
                        </p>
                        <p className="text-xs text-gray-400">Prize Distributed</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold">{platformStats.totalPlayers}</p>
                        <p className="text-xs text-gray-400">Total Players</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-500">
                            {formatUSD(platformStats.totalFees)}
                        </p>
                        <p className="text-xs text-gray-400">Fees Collected</p>
                    </div>
                </div>

                {/* Live Prices */}
                <div className="flex justify-center gap-6 mb-6 p-4 bg-gray-800 rounded-2xl border border-gray-700">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">⟠</span>
                        <span className="font-bold">{formatUSD(prices.eth)}</span>
                        <span className="text-xs text-gray-400">ETH</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">₿</span>
                        <span className="font-bold">{formatUSD(prices.btc)}</span>
                        <span className="text-xs text-gray-400">BTC</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">◎</span>
                        <span className="font-bold">{formatUSD(prices.sol)}</span>
                        <span className="text-xs text-gray-400">SOL</span>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Create Match */}
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4">⚔️ Create Match</h2>

                        <div className="bg-gray-900 rounded-xl p-4 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Your Balance</span>
                                <span className="font-bold text-lg text-green-500">{formatUSD(balance)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => requestFaucet()}
                            disabled={isPending || isConfirming}
                            className="w-full mb-4 py-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                        >
                            {isPending || isConfirming ? '⏳ Processing...' : '🚰 Get Test USDC (1000)'}
                        </button>

                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">Stake Amount</label>
                            <div className="grid grid-cols-4 gap-2">
                                {STAKE_OPTIONS.map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => setStakeAmount(amount)}
                                        className={`py-2 rounded-xl font-semibold transition-all ${stakeAmount === amount
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                            }`}
                                    >
                                        ${amount}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">Match Duration</label>
                            <div className="grid grid-cols-3 gap-2">
                                {DURATION_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setDuration(opt.value)}
                                        className={`py-2 rounded-xl font-semibold transition-all ${duration === opt.value
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-900 rounded-xl p-4 mb-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Your Stake</span>
                                <span>{formatUSD(stakeAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Prize Pool</span>
                                <span className="text-green-500">{formatUSD(stakeAmount * 2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Platform Fee (5%)</span>
                                <span>{formatUSD(stakeAmount * 2 * 0.05)}</span>
                            </div>
                            <hr className="border-gray-700" />
                            <div className="flex justify-between">
                                <span className="text-gray-400">Trading Gas</span>
                                <span className="text-green-500 font-bold">$0.00 ⚡</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCreateMatch}
                            disabled={isPending || isConfirming || balance < stakeAmount}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${balance < stakeAmount
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : isPending || isConfirming
                                    ? 'bg-purple-600/50'
                                    : 'bg-purple-600 hover:bg-purple-500'
                                }`}
                        >
                            {isPending || isConfirming
                                ? '⏳ Processing...'
                                : needsApproval
                                    ? '🔓 Approve USDC'
                                    : balance < stakeAmount
                                        ? '❌ Need More USDC'
                                        : '⚔️ Create Match'}
                        </button>
                    </div>

                    {/* Open Matches */}
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            🎯 Open Matches
                            <span className="ml-auto bg-purple-600/30 text-purple-400 text-sm px-3 py-1 rounded-full">
                                {openMatches.length}
                            </span>
                        </h2>

                        {openMatches.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <p className="text-5xl mb-3">🏜️</p>
                                <p className="font-semibold">No open matches</p>
                                <p className="text-sm">Create one to start!</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {openMatches.map((match) => (
                                    <div key={match.id} className="bg-gray-900 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                                                    ⚔️
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{shortenAddr(match.playerA)}</p>
                                                    <p className="text-xs text-gray-500">On-chain match</p>
                                                </div>
                                            </div>
                                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                                                {Math.floor(match.duration / 60)}m
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Stake</p>
                                                <p className="font-bold">{formatUSD(match.stakeAmount)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Prize Pool</p>
                                                <p className="font-bold text-green-500">{formatUSD(match.prizePool)}</p>
                                            </div>
                                        </div>

                                        {match.playerA.toLowerCase() === address?.toLowerCase() ? (
                                            <div className="w-full py-2 bg-gray-700 text-gray-400 rounded-xl text-center text-sm">
                                                ⏳ Your Match - Waiting for opponent...
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleJoinMatch(match.id, match.stakeAmount)}
                                                disabled={isPending || isConfirming || balance < match.stakeAmount}
                                                className={`w-full py-2 rounded-xl font-semibold transition-all ${balance < match.stakeAmount
                                                    ? 'bg-gray-700 text-gray-500'
                                                    : 'bg-purple-600 hover:bg-purple-500'
                                                    }`}
                                            >
                                                {allowance < match.stakeAmount ? '🔓 Approve & Join' : '⚔️ Join Battle'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* How It Works */}
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4">💡 How It Works</h2>

                        <div className="space-y-4">
                            {[
                                { num: 1, title: 'Get Test USDC', desc: 'Click faucet (requires gas)' },
                                { num: 2, title: 'Create or Join', desc: 'On-chain match (requires gas)' },
                                { num: 3, title: 'Trade & Compete', desc: 'Off-chain via Yellow (NO gas!)' },
                                { num: 4, title: 'Winner Takes All', desc: '95% of prize pool' },
                            ].map((step) => (
                                <div key={step.num} className="flex gap-3">
                                    <div className="w-8 h-8 bg-yellow-500 text-gray-900 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {step.num}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{step.title}</p>
                                        <p className="text-sm text-gray-400">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
                            <p className="text-yellow-500 font-bold">⚡ Yellow Network</p>
                            <p className="text-sm text-gray-400">State channels for gasless trading</p>
                        </div>

                        <div className="mt-4 p-3 bg-gray-900 rounded-xl text-xs text-gray-500">
                            <p>
                                <strong>Network:</strong> Sepolia Testnet
                            </p>
                            <p>
                                <strong>SDK:</strong> Nitrolite (ERC-7824)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
