'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFlashDuel, calculatePortfolioValue } from '@/hooks/useFlashDuel';

const ASSETS = [
    { id: 'eth' as const, symbol: 'ETH', icon: '⟠' },
    { id: 'btc' as const, symbol: 'BTC', icon: '₿' },
    { id: 'sol' as const, symbol: 'SOL', icon: '◎' },
];

export default function MatchPage() {
    const params = useParams();
    const router = useRouter();
    const matchId = params.matchId as string;

    const {
        address,
        prices,
        currentMatch,
        wsConnected,
        executeTrade,
        joinMatchRoom,
        setCurrentMatch,
        openMatches,
    } = useFlashDuel();

    const [selectedAsset, setSelectedAsset] = useState<'eth' | 'btc' | 'sol'>('eth');
    const [tradeAmount, setTradeAmount] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const [showResult, setShowResult] = useState(false);

    // Load match from contract data
    useEffect(() => {
        if (!currentMatch && openMatches.length > 0) {
            const match = openMatches.find((m) => m.id === matchId);
            if (match) {
                setCurrentMatch({
                    ...match,
                    status: match.playerB ? 'active' : 'waiting',
                    startedAt: match.playerB ? Date.now() : 0,
                });
            }
        }
    }, [currentMatch, openMatches, matchId, setCurrentMatch]);

    // Join match room for real-time updates
    useEffect(() => {
        if (wsConnected && matchId) {
            joinMatchRoom(matchId);
        }
    }, [wsConnected, matchId, joinMatchRoom]);

    // Auto-start for demo (when opponent joins)
    useEffect(() => {
        if (currentMatch?.status === 'waiting') {
            const timeout = setTimeout(() => {
                setCurrentMatch({
                    ...currentMatch,
                    status: 'active',
                    startedAt: Date.now(),
                    playerB: '0x0000000000000000000000000000000000000001',
                    portfolioB: { usdc: currentMatch.stakeAmount, eth: 0, btc: 0, sol: 0 },
                });
            }, 5000);
            return () => clearTimeout(timeout);
        }
    }, [currentMatch, setCurrentMatch]);

    // Timer
    useEffect(() => {
        if (!currentMatch || currentMatch.status !== 'active') return;

        const duration = currentMatch.duration || 60;
        const elapsed = Math.floor((Date.now() - currentMatch.startedAt) / 1000);
        setTimeLeft(Math.max(0, duration - elapsed));

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setShowResult(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentMatch?.status, currentMatch?.startedAt, currentMatch?.duration]);

    const handleTrade = (action: 'buy' | 'sell') => {
        if (!tradeAmount || !currentMatch) return;
        const quantity = parseFloat(tradeAmount);
        if (isNaN(quantity) || quantity <= 0) return;

        executeTrade(selectedAsset, action, quantity);
        setTradeAmount('');
    };

    const setQuickAmount = (percent: number) => {
        if (!currentMatch || !address) return;
        const isPlayerA = currentMatch.playerA.toLowerCase() === address.toLowerCase();
        const portfolio = isPlayerA ? currentMatch.portfolioA : currentMatch.portfolioB;
        const maxBuy = portfolio.usdc / prices[selectedAsset];
        setTradeAmount((maxBuy * percent).toFixed(6));
    };

    const formatTime = (s: number) =>
        `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const formatUSD = (v: number) =>
        `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Calculate values
    const isPlayerA = currentMatch?.playerA.toLowerCase() === address?.toLowerCase();
    const myPortfolio = currentMatch
        ? isPlayerA
            ? currentMatch.portfolioA
            : currentMatch.portfolioB
        : { usdc: 0, eth: 0, btc: 0, sol: 0 };
    const opponentPortfolio = currentMatch
        ? isPlayerA
            ? currentMatch.portfolioB
            : currentMatch.portfolioA
        : { usdc: 0, eth: 0, btc: 0, sol: 0 };

    const myValue = calculatePortfolioValue(myPortfolio, prices);
    const opponentValue = calculatePortfolioValue(opponentPortfolio, prices);
    const stakeAmount = currentMatch?.stakeAmount || 0;
    const myPnL = myValue - stakeAmount;
    const myPnLPercent = stakeAmount > 0 ? (myPnL / stakeAmount) * 100 : 0;

    // Result screen
    if (showResult && currentMatch) {
        const isWinner = myValue > opponentValue;
        const winnings = currentMatch.prizePool * 0.95;

        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-lg w-full text-center">
                    <div className="text-8xl mb-6">{isWinner ? '🏆' : '😢'}</div>
                    <h2
                        className={`text-4xl font-bold mb-2 ${isWinner ? 'text-green-500' : 'text-red-500'}`}
                    >
                        {isWinner ? 'Victory!' : 'Defeat'}
                    </h2>
                    <p className="text-gray-400 mb-6">
                        {isWinner ? `You won ${formatUSD(winnings)}!` : 'Better luck next time!'}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div
                            className={`p-4 rounded-xl ${isWinner ? 'bg-green-500/20 border-2 border-green-500' : 'bg-gray-700'}`}
                        >
                            <p className="font-bold text-white">You</p>
                            <p className="text-2xl font-bold text-white">{formatUSD(myValue)}</p>
                            <p className={myPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {myPnL >= 0 ? '+' : ''}
                                {formatUSD(myPnL)} ({myPnLPercent.toFixed(1)}%)
                            </p>
                        </div>
                        <div
                            className={`p-4 rounded-xl ${!isWinner ? 'bg-green-500/20 border-2 border-green-500' : 'bg-gray-700'}`}
                        >
                            <p className="font-bold text-white">Opponent</p>
                            <p className="text-2xl font-bold text-white">{formatUSD(opponentValue)}</p>
                        </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-6">
                        <p className="text-sm text-yellow-500">⚡ All trades were gasless via Yellow Network!</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push('/lobby')}
                            className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
                        >
                            Play Again
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl"
                        >
                            Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Waiting screen
    if (!currentMatch || currentMatch.status === 'waiting') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-6 animate-bounce">⏳</div>
                    <h2 className="text-2xl font-bold text-white mb-4">Waiting for Opponent</h2>
                    <p className="text-gray-400 mb-2">Share this match ID:</p>
                    <p className="text-xs text-purple-400 bg-gray-900 p-2 rounded mb-6 break-all">
                        {matchId}
                    </p>
                    <div className="bg-gray-900 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-400">Stake Amount</p>
                        <p className="text-2xl font-bold text-purple-500">
                            {formatUSD(currentMatch?.stakeAmount || 10)}
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span
                            className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}
                        />
                        <span className="text-sm text-gray-400">
                            {wsConnected ? 'Connected' : 'Connecting...'}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Demo: Auto-starts in 5 seconds</p>
                    <button
                        onClick={() => router.push('/lobby')}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl"
                    >
                        ← Back to Lobby
                    </button>
                </div>
            </div>
        );
    }

    // Trading arena
    return (
        <div className="min-h-screen bg-gray-900 text-white py-4 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">⚔️ Live Battle</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}
                            />
                            <span className="text-xs text-gray-400">
                                {wsConnected ? 'Real-time' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    <div
                        className={`text-center px-6 py-3 rounded-2xl ${timeLeft <= 30 ? 'bg-red-500/20 border-2 border-red-500 animate-pulse' : 'bg-gray-800 border border-gray-700'}`}
                    >
                        <p className="text-xs text-gray-400">Time Left</p>
                        <p
                            className={`text-3xl font-bold font-mono ${timeLeft <= 30 ? 'text-red-500' : 'text-white'}`}
                        >
                            {formatTime(timeLeft)}
                        </p>
                    </div>
                </div>

                {/* Score */}
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                    YOU
                                </div>
                                <div>
                                    <p className="font-bold">Your Portfolio</p>
                                    <p className="text-2xl font-bold text-purple-500">{formatUSD(myValue)}</p>
                                    <p className={myPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        {myPnL >= 0 ? '+' : ''}
                                        {formatUSD(myPnL)} ({myPnLPercent.toFixed(1)}%)
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="text-center px-6">
                            <p className="text-4xl font-bold text-gray-500">VS</p>
                            <p className="text-sm text-yellow-500">Prize: {formatUSD(currentMatch.prizePool)}</p>
                        </div>
                        <div className="flex-1 text-right">
                            <div className="flex items-center gap-3 justify-end">
                                <div>
                                    <p className="font-bold">Opponent</p>
                                    <p className="text-2xl font-bold text-gray-300">{formatUSD(opponentValue)}</p>
                                </div>
                                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center font-bold">
                                    OPP
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 transition-all"
                            style={{
                                width: `${Math.max(5, (myValue / (myValue + opponentValue)) * 100)}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Portfolio */}
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4">💼 Your Portfolio</h2>
                        <div className="bg-gray-900 rounded-xl p-4 mb-4">
                            <p className="text-sm text-gray-400">Cash Balance</p>
                            <p className="text-2xl font-bold text-green-500">{formatUSD(myPortfolio.usdc)}</p>
                        </div>
                        <div className="space-y-3">
                            {ASSETS.map((asset) => {
                                const amount = myPortfolio[asset.id];
                                const value = amount * prices[asset.id];
                                return (
                                    <div
                                        key={asset.id}
                                        className="flex items-center justify-between p-3 bg-gray-900 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{asset.icon}</span>
                                            <div>
                                                <p className="font-semibold">{asset.symbol}</p>
                                                <p className="text-sm text-gray-400">{amount.toFixed(6)}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold">{formatUSD(value)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Trading */}
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4">📈 Trade</h2>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {ASSETS.map((asset) => (
                                <button
                                    key={asset.id}
                                    onClick={() => setSelectedAsset(asset.id)}
                                    className={`p-3 rounded-xl text-center ${selectedAsset === asset.id ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    <span className="text-2xl block">{asset.icon}</span>
                                    <span className="text-sm font-semibold">{asset.symbol}</span>
                                </button>
                            ))}
                        </div>
                        <div className="bg-gray-900 rounded-xl p-4 mb-4">
                            <p className="text-sm text-gray-400">Current Price</p>
                            <p className="text-2xl font-bold">{formatUSD(prices[selectedAsset])}</p>
                        </div>
                        <div className="mb-4">
                            <input
                                type="number"
                                value={tradeAmount}
                                onChange={(e) => setTradeAmount(e.target.value)}
                                placeholder="Amount"
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-lg focus:border-purple-500 outline-none"
                            />
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {[0.25, 0.5, 0.75, 1].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setQuickAmount(p)}
                                        className="py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg"
                                    >
                                        {p * 100}%
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleTrade('buy')}
                                disabled={!tradeAmount}
                                className="py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 font-bold rounded-xl"
                            >
                                Buy
                            </button>
                            <button
                                onClick={() => handleTrade('sell')}
                                disabled={!tradeAmount}
                                className="py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 font-bold rounded-xl"
                            >
                                Sell
                            </button>
                        </div>
                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
                            <p className="text-xs text-yellow-500">⚡ Zero gas fees via Yellow Network</p>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-6">
                        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                            <h3 className="font-bold mb-4">📊 Live Prices</h3>
                            {ASSETS.map((asset) => (
                                <div
                                    key={asset.id}
                                    className="flex items-center justify-between p-3 bg-gray-900 rounded-xl mb-2"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{asset.icon}</span>
                                        <span className="font-semibold">{asset.symbol}</span>
                                    </div>
                                    <span className="font-bold">{formatUSD(prices[asset.id])}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                            <h3 className="font-bold mb-3">👁️ Status</h3>
                            <div className="text-center py-4">
                                <p className="text-3xl font-bold">{formatUSD(opponentValue)}</p>
                                <p
                                    className={`text-sm ${opponentValue > myValue ? 'text-red-400' : 'text-green-400'}`}
                                >
                                    {opponentValue > myValue ? '⚠️ Opponent ahead!' : '✅ You are winning!'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
