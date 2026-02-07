'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MatchHeader } from '@/components/match/MatchHeader';
import { PlayerCard } from '@/components/match/PlayerCard';
import { TradingPanel } from '@/components/match/TradingPanel';
import { PriceDisplay } from '@/components/match/PriceDisplay';
import { TradeHistory } from '@/components/match/TradeHistory';
import { ResultModal } from '@/components/match/ResultModal';
import { usePrices } from '@/hooks/usePrices';
import { formatUSD, shortenAddress } from '@/lib/utils';

interface Portfolio {
    usdc: number;
    assets: { [key: string]: number };
}

interface Match {
    id: string;
    playerA: string;
    playerB: string | null;
    stakeAmount: number;
    prizePool: number;
    duration: number;
    status: 'waiting' | 'active' | 'completed' | 'settling';
    startedAt: number;
    portfolioA: Portfolio;
    portfolioB: Portfolio;
    winner: string | null;
    playerAScore: number;
    playerBScore: number;
}

interface Trade {
    id: string;
    asset: string;
    action: 'buy' | 'sell';
    quantity: number;
    price: number;
    total: number;
    timestamp: number;
}

export default function MatchPage() {
    const params = useParams();
    const router = useRouter();
    const { address } = useAccount();
    const matchId = params.matchId as string;
    const { prices } = usePrices();

    const [match, setMatch] = useState<Match | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTrading, setIsTrading] = useState(false);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [showResult, setShowResult] = useState(false);

    // WebSocket connection
    useEffect(() => {
        if (!address) return;

        const websocket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');

        websocket.onopen = () => {
            websocket.send(JSON.stringify({ type: 'auth', address }));
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'match_update':
                case 'match_started':
                case 'match_joined':
                    setMatch(data.match);
                    break;
                case 'trade_executed':
                    setIsTrading(false);
                    break;
                case 'match_ended':
                    setMatch(data.match);
                    setShowResult(true);
                    break;
                case 'trade_error':
                    setIsTrading(false);
                    alert(data.message);
                    break;
            }
        };

        setWs(websocket);

        return () => websocket.close();
    }, [address, matchId]);

    // Timer countdown
    useEffect(() => {
        if (!match || match.status !== 'active') return;

        const endTime = match.startedAt + match.duration * 1000;

        const interval = setInterval(() => {
            const remaining = Math.max(0, endTime - Date.now());
            setTimeLeft(Math.floor(remaining / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [match]);

    // Calculate values
    const calculateValue = useCallback((portfolio: Portfolio) => {
        let value = portfolio.usdc;
        for (const [asset, amount] of Object.entries(portfolio.assets)) {
            const price = prices[asset as keyof typeof prices];
            if (price) value += amount * price;
        }
        return value;
    }, [prices]);

    const isPlayerA = match?.playerA.toLowerCase() === address?.toLowerCase();
    const myPortfolio = match ? (isPlayerA ? match.portfolioA : match.portfolioB) : null;
    const opponentPortfolio = match ? (isPlayerA ? match.portfolioB : match.portfolioA) : null;
    const myValue = myPortfolio ? calculateValue(myPortfolio) : 0;
    const opponentValue = opponentPortfolio ? calculateValue(opponentPortfolio) : 0;

    // Execute trade
    const handleTrade = async (
        asset: 'eth' | 'btc' | 'sol',
        action: 'buy' | 'sell',
        quantity: number,
        price: number
    ): Promise<boolean> => {
        if (!ws || !match) return false;

        setIsTrading(true);
        ws.send(JSON.stringify({
            type: 'trade',
            matchId: match.id,
            asset,
            action,
            quantity,
            price,
        }));

        setTrades(prev => [...prev, {
            id: `trade_${Date.now()}`,
            asset,
            action,
            quantity,
            price,
            total: quantity * price,
            timestamp: Date.now(),
        }]);

        return true;
    };

    // Loading state
    if (!match) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted">Loading match...</p>
                </div>
            </div>
        );
    }

    // Waiting for opponent
    if (match.status === 'waiting') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-6 animate-bounce">⏳</div>
                    <h2 className="text-2xl font-bold mb-4">Waiting for Opponent</h2>
                    <p className="text-muted mb-6">Share this match with a friend to battle!</p>

                    <div className="bg-background rounded-xl p-4 mb-6">
                        <p className="text-sm text-muted mb-1">Match ID</p>
                        <p className="font-mono text-sm break-all">{match.id}</p>
                    </div>

                    <div className="bg-background rounded-xl p-4 mb-6">
                        <p className="text-sm text-muted mb-1">Stake Amount</p>
                        <p className="text-2xl font-bold text-primary">{formatUSD(match.stakeAmount)}</p>
                        <p className="text-muted">Prize Pool: {formatUSD(match.prizePool)}</p>
                    </div>

                    <Button variant="secondary" onClick={() => router.push('/lobby')}>
                        Back to Lobby
                    </Button>
                </Card>
            </div>
        );
    }

    // Active match - Main trading UI
    return (
        <div className="min-h-screen py-4 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header with VS and Timer */}
                <div className="mb-6">
                    <MatchHeader
                        playerA={match.playerA}
                        playerB={match.playerB}
                        myAddress={address || ''}
                        myValue={myValue}
                        opponentValue={opponentValue}
                        prizePool={match.prizePool}
                        timeLeft={timeLeft}
                        status={match.status}
                    />
                </div>

                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Left - My Portfolio */}
                    <div className="lg:col-span-3">
                        {myPortfolio && (
                            <PlayerCard
                                address={address || ''}
                                portfolio={myPortfolio}
                                value={myValue}
                                stakeAmount={match.stakeAmount}
                                isMe={true}
                                isWinner={match.status === 'completed' && match.winner?.toLowerCase() === address?.toLowerCase()}
                                prices={prices}
                            />
                        )}
                    </div>

                    {/* Center - Trading */}
                    <div className="lg:col-span-6 space-y-6">
                        {myPortfolio && (
                            <TradingPanel
                                prices={prices}
                                portfolio={myPortfolio}
                                onTrade={handleTrade}
                                isTrading={isTrading}
                                disabled={match.status !== 'active'}
                            />
                        )}

                        <TradeHistory trades={trades} />
                    </div>

                    {/* Right - Prices & Opponent */}
                    <div className="lg:col-span-3 space-y-6">
                        <PriceDisplay prices={prices} />

                        {opponentPortfolio && match.playerB && (
                            <PlayerCard
                                address={match.playerB}
                                portfolio={opponentPortfolio}
                                value={opponentValue}
                                stakeAmount={match.stakeAmount}
                                isMe={false}
                                isWinner={match.status === 'completed' && match.winner?.toLowerCase() === match.playerB.toLowerCase()}
                                prices={prices}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Result Modal */}
            <ResultModal
                isOpen={showResult}
                isWinner={match.winner?.toLowerCase() === address?.toLowerCase()}
                myAddress={address || ''}
                opponentAddress={isPlayerA ? (match.playerB || '') : match.playerA}
                myValue={myValue}
                opponentValue={opponentValue}
                prizePool={match.prizePool}
                myScore={isPlayerA ? match.playerAScore : match.playerBScore}
                opponentScore={isPlayerA ? match.playerBScore : match.playerAScore}
                stakeAmount={match.stakeAmount}
                onClose={() => setShowResult(false)}
            />
        </div>
    );
}
