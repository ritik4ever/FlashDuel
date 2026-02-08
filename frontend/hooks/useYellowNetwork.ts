'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';


const CLEARNODE_URL = 'wss://clearnet-sandbox.yellow.com/ws';


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
    endedAt: number;
    portfolioA: Portfolio;
    portfolioB: Portfolio;
    winner: string | null;
    version: number;
}

export interface Prices {
    eth: number;
    btc: number;
    sol: number;
}

export interface Trade {
    asset: 'eth' | 'btc' | 'sol';
    action: 'buy' | 'sell';
    quantity: number;
    price: number;
    timestamp: number;
}

// ============================================
// LOCAL STORAGE FOR DEMO BALANCE
// ============================================
const BALANCE_KEY = 'flashduel_balance';
const MATCHES_KEY = 'flashduel_matches';

function getStoredBalance(): number {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem(BALANCE_KEY);
    return stored ? parseFloat(stored) : 0;
}

function setStoredBalance(balance: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(BALANCE_KEY, balance.toString());
}

function getStoredMatches(): Match[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(MATCHES_KEY);
    return stored ? JSON.parse(stored) : [];
}

function setStoredMatches(matches: Match[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
}

// ============================================
// YELLOW NETWORK HOOK
// ============================================
export function useYellowNetwork() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();

    // Connection state
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data state
    const [balance, setBalance] = useState(0);
    const [prices, setPrices] = useState<Prices>({ eth: 2000, btc: 69000, sol: 87 });
    const [openMatches, setOpenMatches] = useState<Match[]>([]);
    const [currentMatch, setCurrentMatch] = useState<Match | null>(null);

    // Refs
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);

    // ============================================
    // LOAD STORED DATA ON MOUNT
    // ============================================
    useEffect(() => {
        if (address) {
            setBalance(getStoredBalance());
            setOpenMatches(getStoredMatches());
        }
    }, [address]);

    // ============================================
    // WEBSOCKET CONNECTION
    // ============================================
    const connect = useCallback(async (): Promise<void> => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('[Yellow] Already connected');
            return;
        }

        return new Promise((resolve, reject) => {
            console.log('[Yellow] Connecting to ClearNode:', CLEARNODE_URL);

            try {
                const ws = new WebSocket(CLEARNODE_URL);

                const timeout = setTimeout(() => {
                    if (ws.readyState !== WebSocket.OPEN) {
                        ws.close();
                        // Even if WS fails, we can still demo with local state
                        setIsConnected(true);
                        setIsAuthenticated(true);
                        resolve();
                    }
                }, 5000);

                ws.onopen = () => {
                    clearTimeout(timeout);
                    console.log('[Yellow] ✅ Connected to ClearNode');
                    setIsConnected(true);
                    setError(null);
                    wsRef.current = ws;
                    reconnectAttempts.current = 0;

                    // Send get_config to verify connection
                    ws.send(JSON.stringify({
                        req: [1, 'get_config', {}, Date.now()],
                        sig: []
                    }));

                    resolve();
                };

                ws.onmessage = (event) => {
                    handleMessage(event.data);
                };

                ws.onerror = (err) => {
                    clearTimeout(timeout);
                    console.error('[Yellow] WebSocket error:', err);
                    // Don't reject - use local demo mode
                    setIsConnected(true);
                    setIsAuthenticated(true);
                    resolve();
                };

                ws.onclose = (event) => {
                    console.log('[Yellow] Disconnected:', event.code);
                    wsRef.current = null;

                    // Auto-reconnect with backoff
                    if (reconnectAttempts.current < 3) {
                        reconnectAttempts.current++;
                        setTimeout(() => connect(), 2000 * reconnectAttempts.current);
                    }
                };
            } catch (err) {
                // Fallback to demo mode
                setIsConnected(true);
                setIsAuthenticated(true);
                resolve();
            }
        });
    }, []);

    // ============================================
    // MESSAGE HANDLER
    // ============================================
    const handleMessage = useCallback((data: string) => {
        try {
            const response = JSON.parse(data);
            console.log('[Yellow] 📨 Received:', response);

            if (response.res) {
                const [reqId, status, payload] = response.res;

                if (payload?.config) {
                    console.log('[Yellow] Config:', payload.config);
                    setIsAuthenticated(true);
                }

                if (payload?.balance) {
                    const bal = payload.balance['ytest.usd'] || payload.balance['usdc'] || 0;
                    setBalance(Number(bal));
                    setStoredBalance(Number(bal));
                }
            }
        } catch (err) {
            console.error('[Yellow] Parse error:', err);
        }
    }, []);

    // ============================================
    // AUTHENTICATE
    // ============================================
    const authenticate = useCallback(async (): Promise<void> => {
        if (!address) throw new Error('Wallet not connected');

        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            await connect();
        }

        // For demo purposes, authenticate immediately
        setIsAuthenticated(true);

        // Load stored balance
        const storedBal = getStoredBalance();
        if (storedBal > 0) {
            setBalance(storedBal);
        }
    }, [address, connect]);

    // ============================================
    // REQUEST FAUCET (Demo Mode)
    // ============================================
    const requestFaucet = useCallback(async (): Promise<void> => {
        if (!address) throw new Error('Wallet not connected');

        // Demo: Add 1000 ytest.USD to balance
        const newBalance = balance + 1000;
        setBalance(newBalance);
        setStoredBalance(newBalance);

        console.log('[Yellow] 🚰 Faucet: Added 1000 ytest.USD, new balance:', newBalance);

        // Also try the real faucet endpoint (may fail, that's ok)
        try {
            const response = await fetch('https://clearnet-sandbox.yellow.com/faucet/requestTokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userAddress: address }),
            });
            if (response.ok) {
                console.log('[Yellow] Real faucet also succeeded');
            }
        } catch (err) {
            // Ignore - demo mode works
        }
    }, [address, balance]);

    // ============================================
    // CREATE MATCH
    // ============================================
    const createMatch = useCallback(async (stakeAmount: number, duration: number): Promise<string> => {
        if (!address) throw new Error('Wallet not connected');
        if (balance < stakeAmount) throw new Error('Insufficient balance');

        const matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const newMatch: Match = {
            id: matchId,
            playerA: address,
            playerB: null,
            stakeAmount,
            prizePool: stakeAmount * 2,
            duration,
            status: 'waiting',
            startedAt: 0,
            endedAt: 0,
            portfolioA: { usdc: stakeAmount, eth: 0, btc: 0, sol: 0 },
            portfolioB: { usdc: stakeAmount, eth: 0, btc: 0, sol: 0 },
            winner: null,
            version: 1,
        };

        // Deduct stake from balance
        const newBalance = balance - stakeAmount;
        setBalance(newBalance);
        setStoredBalance(newBalance);

        // Add to matches
        const updatedMatches = [...openMatches, newMatch];
        setOpenMatches(updatedMatches);
        setStoredMatches(updatedMatches);
        setCurrentMatch(newMatch);

        // Send to Yellow Network if connected
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                req: [Date.now(), 'create_app_session', {
                    application: 'FlashDuel',
                    participant: address,
                    asset: 'ytest.usd',
                    amount: (stakeAmount * 1_000_000).toString(),
                    metadata: { matchId, duration, game: 'FlashDuel' }
                }, Date.now()],
                sig: []
            }));
        }

        console.log('[Yellow] ✅ Match created:', matchId);
        return matchId;
    }, [address, balance, openMatches]);

    // ============================================
    // JOIN MATCH
    // ============================================
    const joinMatch = useCallback(async (matchId: string): Promise<void> => {
        if (!address) throw new Error('Wallet not connected');

        const match = openMatches.find(m => m.id === matchId);
        if (!match) throw new Error('Match not found');
        if (balance < match.stakeAmount) throw new Error('Insufficient balance');

        // Deduct stake
        const newBalance = balance - match.stakeAmount;
        setBalance(newBalance);
        setStoredBalance(newBalance);

        // Update match
        const updatedMatch: Match = {
            ...match,
            playerB: address,
            status: 'active',
            startedAt: Date.now(),
            portfolioB: { usdc: match.stakeAmount, eth: 0, btc: 0, sol: 0 },
        };

        // Update matches list
        const updatedMatches = openMatches.map(m => m.id === matchId ? updatedMatch : m);
        setOpenMatches(updatedMatches);
        setStoredMatches(updatedMatches);
        setCurrentMatch(updatedMatch);

        console.log('[Yellow] ✅ Joined match:', matchId);
    }, [address, balance, openMatches]);

    // ============================================
    // EXECUTE TRADE
    // ============================================
    const executeTrade = useCallback((trade: Trade): void => {
        if (!currentMatch || !address) return;

        const { asset, action, quantity, price } = trade;
        const cost = quantity * price;

        setCurrentMatch(prev => {
            if (!prev) return prev;

            const isPlayerA = prev.playerA.toLowerCase() === address.toLowerCase();
            const portfolio = isPlayerA ? { ...prev.portfolioA } : { ...prev.portfolioB };

            // Validate
            if (action === 'buy' && portfolio.usdc < cost) {
                console.error('Insufficient USDC');
                return prev;
            }
            if (action === 'sell' && portfolio[asset] < quantity) {
                console.error(`Insufficient ${asset}`);
                return prev;
            }

            // Execute
            if (action === 'buy') {
                portfolio.usdc -= cost;
                portfolio[asset] += quantity;
            } else {
                portfolio.usdc += cost;
                portfolio[asset] -= quantity;
            }

            console.log(`[Yellow] ⚡ ${action.toUpperCase()} ${quantity} ${asset.toUpperCase()} @ $${price}`);

            return {
                ...prev,
                ...(isPlayerA ? { portfolioA: portfolio } : { portfolioB: portfolio }),
                version: prev.version + 1,
            };
        });
    }, [currentMatch, address]);

    // ============================================
    // SETTLE MATCH
    // ============================================
    const settleMatch = useCallback(async (): Promise<string | null> => {
        if (!currentMatch || !address) return null;

        const valueA = calculatePortfolioValue(currentMatch.portfolioA, prices);
        const valueB = calculatePortfolioValue(currentMatch.portfolioB, prices);
        const winner = valueA >= valueB ? currentMatch.playerA : currentMatch.playerB;

        // Winner gets 95% of prize pool
        if (winner?.toLowerCase() === address.toLowerCase()) {
            const winnings = currentMatch.prizePool * 0.95;
            const newBalance = balance + winnings;
            setBalance(newBalance);
            setStoredBalance(newBalance);
        }

        // Update match
        const settledMatch: Match = {
            ...currentMatch,
            status: 'completed',
            endedAt: Date.now(),
            winner,
        };

        setCurrentMatch(settledMatch);

        // Remove from open matches
        const updatedMatches = openMatches.filter(m => m.id !== currentMatch.id);
        setOpenMatches(updatedMatches);
        setStoredMatches(updatedMatches);

        console.log('[Yellow] 🏆 Match settled, winner:', winner);
        return winner;
    }, [currentMatch, address, balance, prices, openMatches]);

    // ============================================
    // DISCONNECT
    // ============================================
    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
        setIsAuthenticated(false);
    }, []);

    // ============================================
    // FETCH PRICES (CoinGecko)
    // ============================================
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const response = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd&include_24hr_change=true'
                );
                if (!response.ok) return;

                const data = await response.json();
                setPrices({
                    eth: data.ethereum?.usd || 2000,
                    btc: data.bitcoin?.usd || 69000,
                    sol: data.solana?.usd || 87,
                });
            } catch (err) {
                // Use default prices
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    // ============================================
    // AUTO-CONNECT
    // ============================================
    useEffect(() => {
        if (address) {
            connect().then(() => {
                setIsAuthenticated(true);
            }).catch(console.error);
        }
    }, [address, connect]);

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
        requestFaucet,
        createMatch,
        joinMatch,
        executeTrade,
        settleMatch,
        disconnect,
        setCurrentMatch,
    };
}

// ============================================
// HELPER: Calculate portfolio value
// ============================================
export function calculatePortfolioValue(portfolio: Portfolio, prices: Prices): number {
    return (
        portfolio.usdc +
        portfolio.eth * prices.eth +
        portfolio.btc * prices.btc +
        portfolio.sol * prices.sol
    );
}
