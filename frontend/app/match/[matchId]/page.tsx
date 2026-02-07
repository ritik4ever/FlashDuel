'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LivePrices } from '@/components/LivePrices';

interface Prices {
    eth: number;
    btc: number;
    sol: number;
}

interface Portfolio {
    usdc: number;
    eth: number;
    btc: number;
    sol: number;
}

interface Match {
    id: string;
    playerA: string;
    playerB: string | null;
    stakeAmount: number;
    prizePool: number;
    duration: number;
    status: 'waiting' | 'active' | 'completed';
    startedAt: number;
    portfolioA: Portfolio;
    portfolioB: Portfolio;
    winner: string | null;
}

const ASSETS = [
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: '⟠' },
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
    { id: 'sol', name: 'Solana', symbol: 'SOL', icon: '◎' },
];

export default function MatchPage() {
    const params = useParams();
    const router = useRouter();
    const { address } = useAccount();
    const matchId = params.matchId as string;

    // State
    const [match, setMatch] = useState<Match | null>(null);
    const [prices, setPrices] = useState<Prices>({ eth: 2000, btc: 60000, sol: 100 });
    const [myPortfolio, setMyPortfolio] = useState<Portfolio>({ usdc: 50, eth: 0, btc: 0, sol: 0 });
    const [opponentPortfolio, setOpponentPortfolio] = useState<Portfolio>({ usdc: 50, eth: 0, btc: 0, sol: 0 });
    const [timeLeft, setTimeLeft] = useState(300);
    const [selectedAsset, setSelectedAsset] = useState<'eth' | 'btc' | 'sol'>('eth');
    const [tradeAmount, setTradeAmount] = useState('');
    const [isTrading, setIsTrading] = useState(false);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [matchStatus, setMatchStatus] = useState<'waiting' | 'active' | 'completed'>('waiting');
    const [showResult, setShowResult] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);

    // Connect to WebSocket
    useEffect(() => {
        if (!address || !matchId) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
        const websocket = new WebSocket(wsUrl);

        websocket.onopen = () => {
            console.log('[Match] WebSocket connected');
            setIsConnected(true);

            // Authenticate and join match
            websocket.send(JSON.stringify({ type: 'auth', address }));
            websocket.send(JSON.stringify({ type: 'join_match_room', matchId }));
        };

        websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('[Match] Received:', data.type);

                switch (data.type) {
                    case 'prices':
                        setPrices(data.prices);
                        break;
                    case 'match_data':
                    case 'match_update':
                    case 'match_started':
                        if (data.match) {
                            setMatch(data.match);
                            setMatchStatus(data.match.status);

                            // Update portfolios
                            const isPlayerA = data.match.playerA?.address?.toLowerCase() === address?.toLowerCase() ||
                                data.match.playerA?.toLowerCase() === address?.toLowerCase();

                            if (isPlayerA) {
                                setMyPortfolio(data.match.portfolioA || { usdc: data.match.stakeAmount, eth: 0, btc: 0, sol: 0 });
                                setOpponentPortfolio(data.match.portfolioB || { usdc: data.match.stakeAmount, eth: 0, btc: 0, sol: 0 });
                            } else {
                                setMyPortfolio(data.match.portfolioB || { usdc: data.match.stakeAmount, eth: 0, btc: 0, sol: 0 });
                                setOpponentPortfolio(data.match.portfolioA || { usdc: data.match.stakeAmount, eth: 0, btc: 0, sol: 0 });
                            }
                        }
                        break;
                    case 'trade_executed':
                        setMyPortfolio(data.portfolio);
                        setIsTrading(false);
                        break;
                    case 'match_ended':
                        setMatchStatus('completed');
                        setWinner(data.match?.winner || data.winner);
                        setShowResult(true);
                        break;
                    case 'trade_error':
                        alert(data.message || 'Trade failed');
                        setIsTrading(false);
                        break;
                }
            } catch (err) {
                console.error('[Match] Parse error:', err);
            }
        };

        websocket.onclose = () => {
            console.log('[Match] WebSocket disconnected');
            setIsConnected(false);
        };

        setWs(websocket);

        return () => {
            websocket.close();
        };
    }, [address, matchId]);

    // Fetch prices from CoinGecko directly
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const response = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd'
                );
                const data = await response.json();
                setPrices({
                    eth: data.ethereum?.usd || 2000,
                    btc: data.bitcoin?.usd || 60000,
                    sol: data.solana?.usd || 100,
                });
            } catch (err) {
                console.error('Price fetch error:', err);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    // Timer countdown
    useEffect(() => {
        if (matchStatus !== 'active') return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    // Match ended
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [matchStatus]);

    // Calculate portfolio value
    const calculateValue = useCallback((portfolio: Portfolio) => {
        return (
            portfolio.usdc +
            portfolio.eth * prices.eth +
            portfolio.btc * prices.btc +
            portfolio.sol * prices.sol
        );
    }, [prices]);

    const myValue = calculateValue(myPortfolio);
    const opponentValue = calculateValue(opponentPortfolio);
    const stakeAmount = match?.stakeAmount || 50;
    const myPnL = myValue - stakeAmount;
    const myPnLPercent = stakeAmount > 0 ? (myPnL / stakeAmount) * 100 : 0;

    // Execute trade
    const executeTrade = (action: 'buy' | 'sell') => {
        if (!ws || !tradeAmount || isTrading) return;

        const quantity = parseFloat(tradeAmount);
        if (isNaN(quantity) || quantity <= 0) return;

        const price = prices[selectedAsset];
        const cost = quantity * price;

        // Validate
        if (action === 'buy' && myPortfolio.usdc < cost) {
            alert('Insufficient USDC');
            return;
        }
        if (action === 'sell' && myPortfolio[selectedAsset] < quantity) {
            alert(`Insufficient ${selectedAsset.toUpperCase()}`);
            return;
        }

        setIsTrading(true);

        // Send trade to backend
        ws.send(JSON.stringify({
            type: 'trade',
            matchId,
            asset: selectedAsset,
            action,
            quantity,
            price,
        }));

        // Optimistically update portfolio
        setMyPortfolio((prev) => {
            const updated = { ...prev };
            if (action === 'buy') {
                updated.usdc -= cost;
                updated[selectedAsset] += quantity;
            } else {
                updated.usdc += cost;
                updated[selectedAsset] -= quantity;
            }
            return updated;
        });

        setTradeAmount('');
        setIsTrading(false);
    };

    // Format helpers
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatUSD = (value: number) => {
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const shortenAddress = (addr: string) => {
        if (!addr) return '???';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Quick amount buttons
    const setQuickAmount = (percent: number) => {
        const price = prices[selectedAsset];
        const maxBuy = myPortfolio.usdc / price;
        setTradeAmount((maxBuy * percent).toFixed(6));
    };

    // Result Modal
    if (showResult) {
        const isWinner = winner?.toLowerCase() === address?.toLowerCase();
        const prizePool = (match?.prizePool || stakeAmount * 2);
        const winnings = prizePool * 0.95;

        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="p-8 max-w-lg w-full text-center">
                    <div className="text-8xl mb-6">{isWinner ? '🏆' : '😢'}</div>
                    <h2 className={`text-4xl font-bold mb-2 ${isWinner ? 'text-green-500' : 'text-red-500'}`}>
                        {isWinner ? 'Victory!' : 'Defeat'}
                    </h2>
                    <p className="text-muted mb-6">
                        {isWinner ? `You won ${formatUSD(winnings)}!` : 'Better luck next time!'}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className={`p-4 rounded-xl ${isWinner ? 'bg-green-500/20 border-2 border-green-500' : 'bg-card-border/50'}`}>
                            <p className="font-bold">You</p>
                            <p className="text-2xl font-bold">{formatUSD(myValue)}</p>
                            <p className={myPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {myPnL >= 0 ? '+' : ''}{formatUSD(myPnL)}
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl ${!isWinner ? 'bg-green-500/20 border-2 border-green-500' : 'bg-card-border/50'}`}>
                            <p className="font-bold">Opponent</p>
                            <p className="text-2xl font-bold">{formatUSD(opponentValue)}</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button onClick={() => router.push('/lobby')} className="flex-1" size="lg">
                            Play Again
                        </Button>
                        <Button variant="secondary" onClick={() => router.push('/')} className="flex-1" size="lg">
                            Home
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Waiting for opponent
    if (matchStatus === 'waiting') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-6 animate-bounce">⏳</div>
                    <h2 className="text-2xl font-bold mb-4">Waiting for Opponent</h2>
                    <p className="text-muted mb-6">Share this match to find a challenger!</p>
                    <div className="bg-background rounded-xl p-4 mb-6">
                        <p className="text-sm text-muted mb-1">Stake Amount</p>
                        <p className="text-2xl font-bold text-primary">{formatUSD(stakeAmount)}</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-sm text-muted">{isConnected ? 'Connected' : 'Connecting...'}</span>
                    </div>
                    <Button variant="secondary" onClick={() => router.push('/lobby')}>
                        Back to Lobby
                    </Button>
                </Card>
            </div>
        );
    }

    // Active Trading Arena
    return (
        <div className="min-h-screen py-4 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header with Timer */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">⚔️ Live Battle</h1>
                        <p className="text-muted">Trade to grow your portfolio!</p>
                    </div>
                    <div className={`text-center px-6 py-3 rounded-2xl ${timeLeft <= 30 ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-card border border-card-border'
                        }`}>
                        <p className="text-sm text-muted">Time Left</p>
                        <p className="text-3xl font-bold font-mono">{formatTime(timeLeft)}</p>
                    </div>
                </div>

                {/* Score Comparison */}
                <Card className="p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                    YOU
                                </div>
                                <div>
                                    <p className="font-bold">Your Portfolio</p>
                                    <p className="text-2xl font-bold text-primary">{formatUSD(myValue)}</p>
                                    <p className={myPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                                        {myPnL >= 0 ? '+' : ''}{formatUSD(myPnL)} ({myPnLPercent >= 0 ? '+' : ''}{myPnLPercent.toFixed(1)}%)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center px-6">
                            <p className="text-4xl font-bold">VS</p>
                            <p className="text-sm text-muted">Prize: {formatUSD(match?.prizePool || stakeAmount * 2)}</p>
                        </div>

                        <div className="flex-1 text-right">
                            <div className="flex items-center gap-3 justify-end">
                                <div>
                                    <p className="font-bold">Opponent</p>
                                    <p className="text-2xl font-bold">{formatUSD(opponentValue)}</p>
                                </div>
                                <div className="w-12 h-12 bg-card-border rounded-full flex items-center justify-center font-bold">
                                    OPP
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                        <div className="h-3 bg-card-border rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-cyan-500 transition-all duration-500"
                                style={{ width: `${(myValue / (myValue + opponentValue)) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-1 text-sm text-muted">
                            <span>{((myValue / (myValue + opponentValue)) * 100).toFixed(1)}%</span>
                            <span>{((opponentValue / (myValue + opponentValue)) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </Card>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* My Portfolio */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">💼 Your Portfolio</h2>

                        <div className="bg-background rounded-xl p-4 mb-4">
                            <p className="text-sm text-muted">Cash Balance</p>
                            <p className="text-2xl font-bold text-green-500">{formatUSD(myPortfolio.usdc)}</p>
                        </div>

                        <div className="space-y-3">
                            {ASSETS.map((asset) => {
                                const amount = myPortfolio[asset.id as keyof Portfolio] as number;
                                const value = amount * prices[asset.id as keyof Prices];
                                return (
                                    <div key={asset.id} className="flex items-center justify-between p-3 bg-background rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{asset.icon}</span>
                                            <div>
                                                <p className="font-semibold">{asset.symbol}</p>
                                                <p className="text-sm text-muted">{amount.toFixed(6)}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold">{formatUSD(value)}</p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 pt-4 border-t border-card-border">
                            <div className="flex justify-between">
                                <span className="text-muted">Total Value</span>
                                <span className="text-xl font-bold text-primary">{formatUSD(myValue)}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Trading Panel */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">📈 Trade</h2>

                        {/* Asset Selection */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {ASSETS.map((asset) => (
                                <button
                                    key={asset.id}
                                    onClick={() => setSelectedAsset(asset.id as 'eth' | 'btc' | 'sol')}
                                    className={`p-3 rounded-xl text-center transition-all ${selectedAsset === asset.id
                                        ? 'bg-primary text-white'
                                        : 'bg-background border border-card-border hover:border-primary/50'
                                        }`}
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
                                    <p className="text-2xl font-bold">{formatUSD(prices[selectedAsset])}</p>
                                </div>
                                <span className="text-4xl">
                                    {ASSETS.find(a => a.id === selectedAsset)?.icon}
                                </span>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="mb-4">
                            <label className="block text-sm text-muted mb-2">
                                Amount ({ASSETS.find(a => a.id === selectedAsset)?.symbol})
                            </label>
                            <input
                                type="number"
                                value={tradeAmount}
                                onChange={(e) => setTradeAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-lg focus:border-primary outline-none"
                            />
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {[0.25, 0.5, 0.75, 1].map((percent) => (
                                    <button
                                        key={percent}
                                        onClick={() => setQuickAmount(percent)}
                                        className="py-1 text-sm bg-background border border-card-border rounded-lg hover:border-primary/50"
                                    >
                                        {percent * 100}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cost Preview */}
                        {tradeAmount && parseFloat(tradeAmount) > 0 && (
                            <div className="bg-background rounded-xl p-3 mb-4">
                                <p className="text-sm text-muted">Estimated Cost</p>
                                <p className="font-bold">{formatUSD(parseFloat(tradeAmount) * prices[selectedAsset])}</p>
                            </div>
                        )}

                        {/* Buy/Sell Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={() => executeTrade('buy')}
                                disabled={isTrading || !tradeAmount}
                                loading={isTrading}
                                className="bg-green-500 hover:bg-green-600"
                            >
                                Buy
                            </Button>
                            <Button
                                onClick={() => executeTrade('sell')}
                                disabled={isTrading || !tradeAmount}
                                loading={isTrading}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                Sell
                            </Button>
                        </div>
                    </Card>

                    {/* Live Prices */}
                    <div className="space-y-6">
                        <LivePrices />

                        {/* Opponent Info */}
                        <Card className="p-6">
                            <h3 className="font-bold mb-3">👁️ Opponent Status</h3>
                            <div className="text-center py-4">
                                <p className="text-3xl font-bold">{formatUSD(opponentValue)}</p>
                                <p className={`text-sm ${opponentValue > myValue ? 'text-red-500' : 'text-green-500'}`}>
                                    {opponentValue > myValue ? '⚠️ Opponent is ahead!' : '✅ You are winning!'}
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
