'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { YellowSession, getYellowSession, createNewSession, type SessionBalance } from '@/lib/yellow/session';

export type SessionStatus = 'idle' | 'opening' | 'active' | 'closing' | 'closed' | 'error';

export interface UseYellowSessionReturn {
    sessionId: string | null;
    status: SessionStatus;
    balances: SessionBalance;
    totalValue: number;
    error: string | null;
    openSession: (amount: number) => Promise<boolean>;
    closeSession: () => Promise<number>;
    trade: (
        side: 'buy' | 'sell',
        asset: 'eth' | 'btc' | 'sol',
        amount: number,
        price: number
    ) => Promise<boolean>;
    calculateValue: (prices: { eth: number; btc: number; sol: number }) => number;
}

export function useYellowSession(): UseYellowSessionReturn {
    const { address } = useAccount();
    const [session] = useState<YellowSession>(() => getYellowSession());
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [status, setStatus] = useState<SessionStatus>('idle');
    const [balances, setBalances] = useState<SessionBalance>({ usdc: 0, eth: 0, btc: 0, sol: 0 });
    const [totalValue, setTotalValue] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const openSession = useCallback(async (amount: number): Promise<boolean> => {
        if (!address) {
            setError('Wallet not connected');
            return false;
        }

        try {
            setStatus('opening');
            setError(null);

            const newSession = await session.open(address, amount);

            setSessionId(newSession.id);
            setBalances(session.getBalances());
            setTotalValue(amount);
            setStatus('active');

            return true;
        } catch (err) {
            console.error('Error opening session:', err);
            setError(err instanceof Error ? err.message : 'Failed to open session');
            setStatus('error');
            return false;
        }
    }, [address, session]);

    const closeSession = useCallback(async (): Promise<number> => {
        try {
            setStatus('closing');
            setError(null);

            const result = await session.close();

            setStatus('closed');
            setSessionId(null);

            return result.finalBalance;
        } catch (err) {
            console.error('Error closing session:', err);
            setError(err instanceof Error ? err.message : 'Failed to close session');
            setStatus('error');
            return 0;
        }
    }, [session]);

    const trade = useCallback(async (
        side: 'buy' | 'sell',
        asset: 'eth' | 'btc' | 'sol',
        amount: number,
        price: number
    ): Promise<boolean> => {
        try {
            setError(null);

            const result = await session.trade(side, asset, amount, price);

            if (result.success) {
                setBalances(result.newBalances);
                setTotalValue(session.calculateTotalValue());
                return true;
            }

            return false;
        } catch (err) {
            console.error('Error executing trade:', err);
            setError(err instanceof Error ? err.message : 'Trade failed');
            return false;
        }
    }, [session]);

    const calculateValue = useCallback((prices: { eth: number; btc: number; sol: number }): number => {
        return session.calculateTotalValue(prices);
    }, [session]);

    return {
        sessionId,
        status,
        balances,
        totalValue,
        error,
        openSession,
        closeSession,
        trade,
        calculateValue,
    };
}

// Create a fresh session for a new match
export function useNewYellowSession(): UseYellowSessionReturn {
    const { address } = useAccount();
    const [session] = useState<YellowSession>(() => createNewSession());
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [status, setStatus] = useState<SessionStatus>('idle');
    const [balances, setBalances] = useState<SessionBalance>({ usdc: 0, eth: 0, btc: 0, sol: 0 });
    const [totalValue, setTotalValue] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const openSession = useCallback(async (amount: number): Promise<boolean> => {
        if (!address) {
            setError('Wallet not connected');
            return false;
        }

        try {
            setStatus('opening');
            setError(null);

            const newSession = await session.open(address, amount);

            setSessionId(newSession.id);
            setBalances(session.getBalances());
            setTotalValue(amount);
            setStatus('active');

            return true;
        } catch (err) {
            console.error('Error opening session:', err);
            setError(err instanceof Error ? err.message : 'Failed to open session');
            setStatus('error');
            return false;
        }
    }, [address, session]);

    const closeSession = useCallback(async (): Promise<number> => {
        try {
            setStatus('closing');
            setError(null);

            const result = await session.close();

            setStatus('closed');
            setSessionId(null);

            return result.finalBalance;
        } catch (err) {
            console.error('Error closing session:', err);
            setError(err instanceof Error ? err.message : 'Failed to close session');
            setStatus('error');
            return 0;
        }
    }, [session]);

    const trade = useCallback(async (
        side: 'buy' | 'sell',
        asset: 'eth' | 'btc' | 'sol',
        amount: number,
        price: number
    ): Promise<boolean> => {
        try {
            setError(null);

            const result = await session.trade(side, asset, amount, price);

            if (result.success) {
                setBalances(result.newBalances);
                setTotalValue(session.calculateTotalValue());
                return true;
            }

            return false;
        } catch (err) {
            console.error('Error executing trade:', err);
            setError(err instanceof Error ? err.message : 'Trade failed');
            return false;
        }
    }, [session]);

    const calculateValue = useCallback((prices: { eth: number; btc: number; sol: number }): number => {
        return session.calculateTotalValue(prices);
    }, [session]);

    return {
        sessionId,
        status,
        balances,
        totalValue,
        error,
        openSession,
        closeSession,
        trade,
        calculateValue,
    };
}
