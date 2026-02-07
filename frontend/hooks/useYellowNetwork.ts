'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWalletClient, useAccount } from 'wagmi';

// Yellow Network Sandbox WebSocket
const CLEARNODE_URL = 'wss://clearnet-sandbox.yellow.com/ws';

// Types
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
    version: number;
}

interface Prices {
    eth: number;
    btc: number;
    sol: number;
}

interface UseYellowNetworkReturn {
    // Connection state
    isConnected: boolean;
    isAuthenticated: boolean;
    error: string | null;

    // Balance (from Yellow Network unified balance)
    balance: number;

    // Prices
    prices: Prices;

    // Matches
    openMatches: Match[];
    currentMatch: Match | null;

    // Actions
    connect: () => Promise<void>;
    authenticate: () => Promise<void>;
    createMatch: (stakeAmount: number, duration: number) => Promise<string>;
    joinMatch: (matchId: string) => Promise<void>;
    executeTrade: (asset: 'eth' | 'btc' | 'sol', action: 'buy' | 'sell', quantity: number) => void;
    settleMatch: () => Promise<string>;
    disconnect: () => void;
    requestFaucet: () => Promise<void>;
}

export function useYellowNetwork(): UseYellowNetworkReturn {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();

    // State
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [balance, setBalance] = useState(0);
    const [prices, setPrices] = useState<Prices>({ eth: 2000, btc: 69000, sol: 87 });
    const [openMatches, setOpenMatches] = useState<Match[]>([]);
    const [currentMatch, setCurrentMatch] = useState<Match | null>(null);

    // WebSocket ref
    const wsRef = useRef<WebSocket | null>(null);
    const sessionKeyRef = useRef<string | null>(null);
    const requestIdRef = useRef(0);

    // Connect to Yellow Network ClearNode
    const connect = useCallback(async () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        return new Promise<void>((resolve, reject) => {
            console.log('[Yellow] Connecting to ClearNode...');
            const ws = new WebSocket(CLEARNODE_URL);

            ws.onopen = () => {
                console.log('[Yellow] ✅ Connected to ClearNode');
                setIsConnected(true);
                setError(null);
                wsRef.current = ws;
                resolve();
            };

            ws.onmessage = (event) => {
                handleMessage(event.data);
            };

            ws.onerror = (err) => {
                console.error('[Yellow] WebSocket error:', err);
                setError('Connection failed');
                reject(err);
            };

            ws.onclose = () => {
                console.log('[Yellow] Disconnected');
                setIsConnected(false);
                setIsAuthenticated(false);
                wsRef.current = null;
            };
        });
    }, []);

    // Handle incoming messages
    const handleMessage = useCallback((data: string) => {
        try {
            const response = JSON.parse(data);
            console.log('[Yellow] Received:', response);

            // Handle different message types
            if (response.res) {
                const [reqId, status, payload] = response.res;

                if (status === 'error') {
                    setError(payload.message || 'Unknown error');
                    return;
                }

                // Handle based on request type (stored in pending requests)
                if (payload.balance) {
                    setBalance(Number(payload.balance['ytest.usd'] || 0) / 1_000_000);
                }

                if (payload.matches) {
                    setOpenMatches(payload.matches);
                }

                if (payload.match) {
                    setCurrentMatch(payload.match);
                }

                if (payload.config) {
                    console.log('[Yellow] Config:', payload.config);
                }
            }

            // Handle specific message types
            switch (response.type) {
                case 'auth_challenge':
                    // Handle auth challenge
                    break;
                case 'auth_success':
                    setIsAuthenticated(true);
                    console.log('[Yellow] ✅ Authenticated');
                    break;
                case 'session_created':
                    console.log('[Yellow] Match created');
                    break;
                case 'session_joined':
                    console.log('[Yellow] Joined match');
                    break;
                case 'state_update':
                    if (response.match) {
                        setCurrentMatch(response.match);
                    }
                    break;
                case 'prices':
                    setPrices(response.prices);
                    break;
                case 'error':
                    setError(response.message || response.error);
                    break;
            }
        } catch (err) {
            console.error('[Yellow] Parse error:', err);
        }
    }, []);

    // Send message to ClearNode
    const sendMessage = useCallback((method: string, params: any = {}) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            throw new Error('Not connected to ClearNode');
        }

        const reqId = ++requestIdRef.current;
        const timestamp = Date.now();

        const message = {
            req: [reqId, method, params, timestamp],
            sig: [], // Would be signed with session key in production
        };

        wsRef.current.send(JSON.stringify(message));
        return reqId;
    }, []);

    // Authenticate with Yellow Network
    const authenticate = useCallback(async () => {
        if (!address || !walletClient) {
            throw new Error('Wallet not connected');
        }

        if (!wsRef.current) {
            await connect();
        }

        // Generate session key (simplified for demo)
        const sessionKey = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        sessionKeyRef.current = sessionKey;

        // Send auth request
        const authParams = {
            address,
            application: 'FlashDuel',
            session_key: sessionKey,
            allowances: [{ asset: 'ytest.usd', amount: '1000000000' }],
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            scope: 'flashduel',
        };

        sendMessage('auth_request', authParams);

        // In production, would handle challenge/response flow
        // For demo, we'll simulate authentication
        setTimeout(() => {
            setIsAuthenticated(true);
            // Fetch initial balance
            sendMessage('get_balance', {});
        }, 1000);
    }, [address, walletClient, connect, sendMessage]);

    // Request test tokens from faucet
    const requestFaucet = useCallback(async () => {
        if (!address) throw new Error('Wallet not connected');

        try {
            const response = await fetch('https://clearnet-sandbox.yellow.com/faucet/requestTokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userAddress: address }),
            });

            if (!response.ok) {
                throw new Error('Faucet request failed');
            }

            const data = await response.json();
            console.log('[Yellow] Faucet response:', data);

            // Refresh balance
            setTimeout(() => {
                sendMessage('get_balance', {});
            }, 2000);
        } catch (err) {
            console.error('[Yellow] Faucet error:', err);
            throw err;
        }
    }, [address, sendMessage]);

    // Create a match
    const createMatch = useCallback(async (stakeAmount: number, duration: number): Promise<string> => {
        if (!isAuthenticated) throw new Error('Not authenticated');

        const matchId = `match_${Date.now()}`;

        const params = {
            matchId,
            stakeAmount: stakeAmount * 1_000_000, // Convert to 6 decimals
            duration,
            participant: address,
        };

        sendMessage('create_session', params);

        // Return match ID (in production, would wait for confirmation)
        return matchId;
    }, [isAuthenticated, address, sendMessage]);

    // Join a match
    const joinMatch = useCallback(async (matchId: string) => {
        if (!isAuthenticated) throw new Error('Not authenticated');

        sendMessage('join_session', {
            matchId,
            participant: address,
        });
    }, [isAuthenticated, address, sendMessage]);

    // Execute a trade (off-chain state update)
    const executeTrade = useCallback((
        asset: 'eth' | 'btc' | 'sol',
        action: 'buy' | 'sell',
        quantity: number
    ) => {
        if (!isAuthenticated || !currentMatch) {
            console.error('Cannot trade: not authenticated or no active match');
            return;
        }

        const price = prices[asset];
        const cost = quantity * price;

        // Optimistically update local state
        setCurrentMatch(prev => {
            if (!prev) return prev;

            const isPlayerA = prev.playerA.toLowerCase() === address?.toLowerCase();
            const portfolio = isPlayerA ? { ...prev.portfolioA } : { ...prev.portfolioB };

            if (action === 'buy') {
                portfolio.usdc -= cost;
                portfolio[asset] += quantity;
            } else {
                portfolio.usdc += cost;
                portfolio[asset] -= quantity;
            }

            return {
                ...prev,
                ...(isPlayerA ? { portfolioA: portfolio } : { portfolioB: portfolio }),
                version: prev.version + 1,
            };
        });

        // Send state update to ClearNode
        sendMessage('state_update', {
            matchId: currentMatch.id,
            trade: { asset, action, quantity, price, timestamp: Date.now() },
        });

        console.log(`[Yellow] ⚡ Trade executed: ${action} ${quantity} ${asset} @ $${price}`);
    }, [isAuthenticated, currentMatch, prices, address, sendMessage]);

    // Settle match
    const settleMatch = useCallback(async (): Promise<string> => {
        if (!currentMatch) throw new Error('No active match');

        sendMessage('finalize_session', {
            matchId: currentMatch.id,
        });

        // Calculate winner
        const valueA = calculatePortfolioValue(currentMatch.portfolioA, prices);
        const valueB = calculatePortfolioValue(currentMatch.portfolioB, prices);
        const winner = valueA >= valueB ? currentMatch.playerA : currentMatch.playerB!;

        return winner;
    }, [currentMatch, prices, sendMessage]);

    // Disconnect
    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
        setIsAuthenticated(false);
        setCurrentMatch(null);
    }, []);

    // Fetch prices from CoinGecko
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const response = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd'
                );
                const data = await response.json();
                setPrices({
                    eth: data.ethereum?.usd || 2000,
                    btc: data.bitcoin?.usd || 69000,
                    sol: data.solana?.usd || 87,
                });
            } catch (err) {
                console.error('Price fetch error:', err);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    // Auto-connect when address changes
    useEffect(() => {
        if (address && !isConnected) {
            connect().catch(console.error);
        }
    }, [address, isConnected, connect]);

    return {
        isConnected,
        isAuthenticated,
        error,
        balance,
        prices,
        openMatches,
        currentMatch,
        connect,
        authenticate,
        createMatch,
        joinMatch,
        executeTrade,
        settleMatch,
        disconnect,
        requestFaucet,
    };
}

// Helper: Calculate portfolio value
function calculatePortfolioValue(portfolio: Portfolio, prices: Prices): number {
    return (
        portfolio.usdc +
        portfolio.eth * prices.eth +
        portfolio.btc * prices.btc +
        portfolio.sol * prices.sol
    );
}
