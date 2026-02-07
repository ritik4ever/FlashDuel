'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useYellowNetwork } from '@/hooks/useYellowNetwork';

// Constants
const STAKE_OPTIONS = [10, 25, 50, 100];
const DURATION_OPTIONS = [
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
];

export default function LobbyPage() {
    const router = useRouter();
    const { address, isConnected: walletConnected } = useAccount();
    const [stakeAmount, setStakeAmount] = useState(10);
    const [duration, setDuration] = useState(180);
    const [isCreating, setIsCreating] = useState(false);

    // Yellow Network hook
    const {
        isConnected: yellowConnected,
        isAuthenticated,
        error: yellowError,
        balance,
        prices,
        openMatches,
        connect,
        authenticate,
        createMatch,
        joinMatch,
        requestFaucet,
    } = useYellowNetwork();

    // Connect and authenticate when wallet connects
    useEffect(() => {
        if (walletConnected && !yellowConnected) {
            connect().catch(console.error);
        }
    }, [walletConnected, yellowConnected, connect]);

    useEffect(() => {
        if (yellowConnected && !isAuthenticated) {
            authenticate().catch(console.error);
        }
    }, [yellowConnected, isAuthenticated, authenticate]);

    // Handlers
    const handleCreateMatch = async () => {
        if (!isAuthenticated) {
            await authenticate();
        }

        setIsCreating(true);
        try {
            const matchId = await createMatch(stakeAmount, duration);
            console.log('Match created:', matchId);
            router.push(`/match/${matchId}`);
        } catch (err) {
            console.error('Create match error:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinMatch = async (matchId: string) => {
        try {
            await joinMatch(matchId);
            router.push(`/match/${matchId}`);
        } catch (err) {
            console.error('Join match error:', err);
        }
    };

    const handleFaucet = async () => {
        try {
            await requestFaucet();
            alert('Test tokens requested! Balance will update shortly.');
        } catch (err) {
            console.error('Faucet error:', err);
            alert('Faucet request failed. Try again.');
        }
    };

    // Helpers
    const formatUSD = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const shortenAddr = (a: string) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '';

    // Not connected
    if (!walletConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="p-8 text-center max-w-md">
                    <div className="text-6xl mb-4">⚔️</div>
                    <h1 className="text-3xl font-bold mb-2">FlashDuel</h1>
                    <p className="text-muted mb-6">
                        Powered by <span className="text-yellow-500 font-bold">Yellow Network</span>
                    </p>
                    <p className="text-sm text-muted mb-6">
                        Instant off-chain trading battles with on-chain settlement
                    </p>
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
                    <p className="text-muted mb-2">Create a match or join an existing one</p>

                    {/* Yellow Network Status */}
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${yellowConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className="text-xs text-muted">
                                {yellowConnected ? 'ClearNode Connected' : 'Connecting...'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className="text-xs text-muted">
                                {isAuthenticated ? 'Authenticated' : 'Authenticating...'}
                            </span>
                        </div>
                    </div>

                    {yellowError && (
                        <div className="mt-2 text-red-500 text-sm">{yellowError}</div>
                    )}
                </div>

                {/* Yellow Network Banner */}
                <Card className="p-4 mb-6 bg-yellow-500/10 border-yellow-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-yellow-500">⚡ Powered by Yellow Network</p>
                            <p className="text-sm text-muted">
                                Off-chain state channels • Zero gas fees • Instant execution
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted">Unified Balance</p>
                            <p className="text-xl font-bold text-yellow-500">{formatUSD(balance)} yUSD</p>
                        </div>
                    </div>
                </Card>

                {/* Live Prices */}
                <div className="flex justify-center gap-6 mb-6 p-4 bg-card rounded-xl">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">⟠</span>
                        <div>
                            <span className="font-bold">{formatUSD(prices.eth)}</span>
                            <span className="text-xs text-muted ml-1">ETH</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">₿</span>
                        <div>
                            <span className="font-bold">{formatUSD(prices.btc)}</span>
                            <span className="text-xs text-muted ml-1">BTC</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">◎</span>
                        <div>
                            <span className="font-bold">{formatUSD(prices.sol)}</span>
                            <span className="text-xs text-muted ml-1">SOL</span>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Create Match */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>⚔️</span> Create Match
                        </h2>

                        {/* Balance */}
                        <div className="bg-background rounded-xl p-4 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted">Yellow Balance</span>
                                <span className="font-bold text-lg text-yellow-500">{formatUSD(balance)} yUSD</span>
                            </div>
                        </div>

                        {/* Faucet */}
                        {balance < 10 && (
                            <button
                                onClick={handleFaucet}
                                className="w-full mb-4 py-2 bg-yellow-500/20 text-yellow-500 rounded-xl hover:bg-yellow-500/30 transition-colors text-sm"
                            >
                                🚰 Get Test Tokens from Yellow Faucet
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
                            <hr className="border-card-border" />
                            <div className="flex justify-between text-xs text-muted">
                                <span>Gas Fees</span>
                                <span className="text-green-500 font-bold">$0.00 (Off-chain!)</span>
                            </div>
                        </div>

                        {/* Create Button */}
                        <Button
                            onClick={handleCreateMatch}
                            disabled={!isAuthenticated || balance < stakeAmount || isCreating}
                            loading={isCreating}
                            className="w-full"
                            size="lg"
                        >
                            {!isAuthenticated
                                ? 'Connecting...'
                                : balance < stakeAmount
                                    ? 'Insufficient Balance'
                                    : 'Create Match ⚡'}
                        </Button>
                    </Card>

                    {/* Open Matches */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>🎯</span> Open Matches
                            <span className="ml-auto bg-primary/20 text-primary text-sm px-2 py-1 rounded-full">
                                {openMatches.length}
                            </span>
                        </h2>

                        {openMatches.length === 0 ? (
                            <div className="text-center py-8 text-muted">
                                <p className="text-4xl mb-2">🏜️</p>
                                <p>No open matches</p>
                                <p className="text-sm">Create one to start!</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {openMatches.map((match) => (
                                    <div key={match.id} className="bg-background rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                                    ⚡
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{shortenAddr(match.playerA)}</p>
                                                    <p className="text-xs text-muted">via Yellow Network</p>
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
                                        <Button
                                            onClick={() => handleJoinMatch(match.id)}
                                            className="w-full"
                                            size="sm"
                                            disabled={match.playerA.toLowerCase() === address?.toLowerCase()}
                                        >
                                            {match.playerA.toLowerCase() === address?.toLowerCase()
                                                ? 'Your Match'
                                                : 'Join Battle ⚡'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* How It Works */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>💡</span> How It Works
                        </h2>

                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center font-bold text-sm">
                                    1
                                </div>
                                <div>
                                    <p className="font-semibold">Deposit to Yellow</p>
                                    <p className="text-sm text-muted">One-time deposit to unified balance</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center font-bold text-sm">
                                    2
                                </div>
                                <div>
                                    <p className="font-semibold">Create or Join Match</p>
                                    <p className="text-sm text-muted">Instant, off-chain session creation</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center font-bold text-sm">
                                    3
                                </div>
                                <div>
                                    <p className="font-semibold">Trade & Compete</p>
                                    <p className="text-sm text-muted">Zero gas, instant execution</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center font-bold text-sm">
                                    4
                                </div>
                                <div>
                                    <p className="font-semibold">Winner Takes All</p>
                                    <p className="text-sm text-muted">On-chain settlement, withdraw anytime</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-yellow-500/10 rounded-xl">
                            <p className="text-sm text-center">
                                <span className="text-yellow-500 font-bold">⚡ Yellow Network</span>
                                <br />
                                State channels for instant, gasless transactions
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
