'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';


// CONTRACT ADDRESSES (deployed contracts on Sepolia)

const USDC_ADDRESS = '0x9FA9F632F2b6afCbb112Ee53D2638202EfE9B71A' as const;
const FLASHDUEL_ADDRESS = '0x7c1d47ED0aFC7efCc2d6592b7Da3D838D97A00B4' as const;


// BACKEND URL

const BACKEND_WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';


const USDC_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ type: 'uint256' }],
    },
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ type: 'bool' }],
    },
    {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ type: 'uint256' }],
    },
    {
        name: 'faucet',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: [],
    },
] as const;

const FLASHDUEL_ABI = [
    {
        name: 'createMatch',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'stakeAmount', type: 'uint256' },
            { name: 'duration', type: 'uint256' },
        ],
        outputs: [{ type: 'bytes32' }],
    },
    {
        name: 'joinMatch',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'matchId', type: 'bytes32' }],
        outputs: [],
    },
    {
        name: 'getOpenMatches',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
            {
                type: 'tuple[]',
                components: [
                    { name: 'id', type: 'bytes32' },
                    { name: 'playerA', type: 'address' },
                    { name: 'playerB', type: 'address' },
                    { name: 'stakeAmount', type: 'uint256' },
                    { name: 'prizePool', type: 'uint256' },
                    { name: 'createdAt', type: 'uint256' },
                    { name: 'startedAt', type: 'uint256' },
                    { name: 'endedAt', type: 'uint256' },
                    { name: 'duration', type: 'uint256' },
                    { name: 'status', type: 'uint8' },
                    { name: 'winner', type: 'address' },
                    { name: 'playerAScore', type: 'int256' },
                    { name: 'playerBScore', type: 'int256' },
                ],
            },
        ],
    },
    {
        name: 'getPlatformStats',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
            { name: '', type: 'uint256' },
            { name: '', type: 'uint256' },
            { name: '', type: 'uint256' },
            { name: '', type: 'uint256' },
        ],
    },
] as const;


export interface Portfolio {
    usdc: number;
    eth: number;
    btc: number;
    sol: number;
}

export interface Match {
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

export interface Prices {
    eth: number;
    btc: number;
    sol: number;
}

export interface PlatformStats {
    totalMatches: number;
    totalPrizePool: number;
    totalPlayers: number;
    totalFees: number;
}


export function calculatePortfolioValue(portfolio: Portfolio, prices: Prices): number {
    return (
        portfolio.usdc +
        portfolio.eth * prices.eth +
        portfolio.btc * prices.btc +
        portfolio.sol * prices.sol
    );
}


export function useFlashDuel() {
    const { address, isConnected } = useAccount();

    // State
    const [wsConnected, setWsConnected] = useState(false);
    const [prices, setPrices] = useState<Prices>({ eth: 2000, btc: 69000, sol: 87 });
    const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
    const [error, setError] = useState<string | null>(null);

    // WebSocket ref
    const wsRef = useRef<WebSocket | null>(null);


    const { data: balanceData, refetch: refetchBalance } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address, refetchInterval: 5000 },
    });

    const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: address ? [address, FLASHDUEL_ADDRESS] : undefined,
        query: { enabled: !!address, refetchInterval: 5000 },
    });

    const { data: openMatchesData, refetch: refetchMatches } = useReadContract({
        address: FLASHDUEL_ADDRESS,
        abi: FLASHDUEL_ABI,
        functionName: 'getOpenMatches',
        query: { refetchInterval: 3000 },
    });

    const { data: platformStatsData } = useReadContract({
        address: FLASHDUEL_ADDRESS,
        abi: FLASHDUEL_ABI,
        functionName: 'getPlatformStats',
        query: { refetchInterval: 10000 },
    });


    const { writeContract, data: txHash, isPending, reset: resetTx } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });


    const balance = balanceData ? Number(formatUnits(balanceData, 6)) : 0;
    const allowance = allowanceData ? Number(formatUnits(allowanceData, 6)) : 0;

    const openMatches: Match[] = (openMatchesData || [])
        .filter((m: any) => Number(m.status) === 0) // Status 0 = Waiting
        .map((m: any) => ({
            id: m.id,
            playerA: m.playerA,
            playerB: m.playerB === '0x0000000000000000000000000000000000000000' ? null : m.playerB,
            stakeAmount: Number(formatUnits(m.stakeAmount, 6)),
            prizePool: Number(formatUnits(m.prizePool, 6)),
            duration: Number(m.duration),
            status: 'waiting' as const,
            startedAt: Number(m.startedAt) * 1000,
            portfolioA: { usdc: Number(formatUnits(m.stakeAmount, 6)), eth: 0, btc: 0, sol: 0 },
            portfolioB: { usdc: Number(formatUnits(m.stakeAmount, 6)), eth: 0, btc: 0, sol: 0 },
            winner: null,
        }));

    const platformStats: PlatformStats = platformStatsData
        ? {
            totalMatches: Number(platformStatsData[0]),
            totalPrizePool: Number(formatUnits(platformStatsData[1], 6)),
            totalPlayers: Number(platformStatsData[2]),
            totalFees: Number(formatUnits(platformStatsData[3], 6)),
        }
        : { totalMatches: 0, totalPrizePool: 0, totalPlayers: 0, totalFees: 0 };


    const connectWebSocket = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        console.log('[WS] Connecting to:', BACKEND_WS_URL);

        try {
            const ws = new WebSocket(BACKEND_WS_URL);

            ws.onopen = () => {
                console.log('[WS] ✅ Connected');
                setWsConnected(true);
                if (address) {
                    ws.send(JSON.stringify({ type: 'auth', address }));
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleWsMessage(data);
                } catch (err) {
                    console.error('[WS] Parse error:', err);
                }
            };

            ws.onclose = () => {
                console.log('[WS] Disconnected');
                setWsConnected(false);
                wsRef.current = null;
                // Reconnect after 3 seconds
                setTimeout(connectWebSocket, 3000);
            };

            ws.onerror = (err) => {
                console.error('[WS] Error:', err);
                setWsConnected(false);
            };

            wsRef.current = ws;
        } catch (err) {
            console.error('[WS] Connection error:', err);
            setWsConnected(false);
        }
    }, [address]);

    const handleWsMessage = useCallback(
        (data: any) => {
            console.log('[WS] Received:', data.type);

            switch (data.type) {
                case 'prices':
                    setPrices(data.prices);
                    break;
                case 'match_started':
                case 'match_update':
                    if (data.match) {
                        setCurrentMatch((prev) => ({
                            ...prev,
                            ...data.match,
                            status: 'active',
                        }));
                    }
                    break;
                case 'trade_executed':
                    if (data.portfolio && address) {
                        setCurrentMatch((prev) => {
                            if (!prev) return prev;
                            const isPlayerA = prev.playerA.toLowerCase() === address.toLowerCase();
                            return {
                                ...prev,
                                ...(isPlayerA ? { portfolioA: data.portfolio } : { portfolioB: data.portfolio }),
                            };
                        });
                    }
                    break;
                case 'opponent_trade':
                    if (data.portfolio && address) {
                        setCurrentMatch((prev) => {
                            if (!prev) return prev;
                            const isPlayerA = prev.playerA.toLowerCase() === address.toLowerCase();
                            return {
                                ...prev,
                                ...(isPlayerA ? { portfolioB: data.portfolio } : { portfolioA: data.portfolio }),
                            };
                        });
                    }
                    break;
                case 'match_ended':
                    if (data.match) {
                        setCurrentMatch({ ...data.match, status: 'completed' });
                    }
                    break;
                case 'error':
                    setError(data.message);
                    break;
            }
        },
        [address]
    );



    const approveUSDC = useCallback(
        (amount: number) => {
            writeContract({
                address: USDC_ADDRESS,
                abi: USDC_ABI,
                functionName: 'approve',
                args: [FLASHDUEL_ADDRESS, parseUnits((amount * 10).toString(), 6)],
            });
        },
        [writeContract]
    );

    const requestFaucet = useCallback(() => {
        writeContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'faucet',
        });
    }, [writeContract]);

    const createMatch = useCallback(
        (stakeAmount: number, duration: number) => {
            if (allowance < stakeAmount) {
                approveUSDC(stakeAmount);
                return;
            }
            writeContract({
                address: FLASHDUEL_ADDRESS,
                abi: FLASHDUEL_ABI,
                functionName: 'createMatch',
                args: [parseUnits(stakeAmount.toString(), 6), BigInt(duration)],
            });
        },
        [allowance, writeContract, approveUSDC]
    );

    const joinMatch = useCallback(
        (matchId: string, stakeAmount: number) => {
            if (allowance < stakeAmount) {
                approveUSDC(stakeAmount);
                return;
            }
            writeContract({
                address: FLASHDUEL_ADDRESS,
                abi: FLASHDUEL_ABI,
                functionName: 'joinMatch',
                args: [matchId as `0x${string}`],
            });
        },
        [allowance, writeContract, approveUSDC]
    );

    const executeTrade = useCallback(
        (asset: 'eth' | 'btc' | 'sol', action: 'buy' | 'sell', quantity: number) => {
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                console.error('WebSocket not connected');
                return;
            }
            if (!currentMatch) {
                console.error('No active match');
                return;
            }

            const price = prices[asset];

            // Send trade to backend (Yellow Network style - off-chain)
            wsRef.current.send(
                JSON.stringify({
                    type: 'trade',
                    matchId: currentMatch.id,
                    asset,
                    action,
                    quantity,
                    price,
                })
            );

            // Optimistic update
            setCurrentMatch((prev) => {
                if (!prev || !address) return prev;
                const isPlayerA = prev.playerA.toLowerCase() === address.toLowerCase();
                const portfolio = { ...(isPlayerA ? prev.portfolioA : prev.portfolioB) };

                const cost = quantity * price;
                if (action === 'buy') {
                    if (portfolio.usdc < cost) return prev;
                    portfolio.usdc -= cost;
                    portfolio[asset] += quantity;
                } else {
                    if (portfolio[asset] < quantity) return prev;
                    portfolio.usdc += cost;
                    portfolio[asset] -= quantity;
                }

                return {
                    ...prev,
                    ...(isPlayerA ? { portfolioA: portfolio } : { portfolioB: portfolio }),
                };
            });

            console.log(`[Trade] ${action.toUpperCase()} ${quantity} ${asset.toUpperCase()} @ $${price}`);
        },
        [currentMatch, prices, address]
    );

    const joinMatchRoom = useCallback((matchId: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'join_match', matchId }));
        }
    }, []);



    // Connect WebSocket when address changes
    useEffect(() => {
        if (address) {
            connectWebSocket();
        }
        return () => {
            wsRef.current?.close();
        };
    }, [address, connectWebSocket]);

    // Fetch prices from CoinGecko
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd'
                );
                const data = await res.json();
                setPrices({
                    eth: data.ethereum?.usd || 2000,
                    btc: data.bitcoin?.usd || 69000,
                    sol: data.solana?.usd || 87,
                });
            } catch (err) {
                // Use defaults
            }
        };
        fetchPrices();
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    // Refetch after successful tx
    useEffect(() => {
        if (txSuccess) {
            refetchBalance();
            refetchAllowance();
            refetchMatches();
            resetTx();
        }
    }, [txSuccess, refetchBalance, refetchAllowance, refetchMatches, resetTx]);

    return {
        // State
        address,
        isConnected,
        balance,
        allowance,
        prices,
        openMatches,
        currentMatch,
        platformStats,
        wsConnected,
        error,

        // Transaction state
        isPending,
        isConfirming,
        txSuccess,

        // Actions
        approveUSDC,
        requestFaucet,
        createMatch,
        joinMatch,
        executeTrade,
        joinMatchRoom,
        setCurrentMatch,
        refetchMatches,
    };
}