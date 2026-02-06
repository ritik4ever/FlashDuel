'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import {
    USDC_ADDRESS,
    FLASHDUEL_ADDRESS,
    USDC_ABI,
    FLASHDUEL_ABI
} from '@/lib/contracts';

export function useUSDC() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const approve = (amount: number) => {
        writeContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [FLASHDUEL_ADDRESS, parseUnits(amount.toString(), 6)],
        });
    };

    const faucet = () => {
        writeContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'faucet',
        });
    };

    return { approve, faucet, isPending, isConfirming, isSuccess, error };
}

export function useUSDCBalance(address: `0x${string}` | undefined) {
    const { data, refetch } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    return {
        balance: data ? Number(formatUnits(data, 6)) : 0,
        refetch,
    };
}

export function useUSDCAllowance(owner: `0x${string}` | undefined) {
    const { data, refetch } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: owner ? [owner, FLASHDUEL_ADDRESS] : undefined,
        query: { enabled: !!owner },
    });

    return {
        allowance: data ? Number(formatUnits(data, 6)) : 0,
        refetch,
    };
}

export function useFlashDuel() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const createMatch = (stakeAmount: number, duration: number) => {
        writeContract({
            address: FLASHDUEL_ADDRESS,
            abi: FLASHDUEL_ABI,
            functionName: 'createMatch',
            args: [parseUnits(stakeAmount.toString(), 6), BigInt(duration)],
        });
    };

    const joinMatch = (matchId: `0x${string}`) => {
        writeContract({
            address: FLASHDUEL_ADDRESS,
            abi: FLASHDUEL_ABI,
            functionName: 'joinMatch',
            args: [matchId],
        });
    };

    const cancelMatch = (matchId: `0x${string}`) => {
        writeContract({
            address: FLASHDUEL_ADDRESS,
            abi: FLASHDUEL_ABI,
            functionName: 'cancelMatch',
            args: [matchId],
        });
    };

    return {
        createMatch,
        joinMatch,
        cancelMatch,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error
    };
}

export function useOpenMatches() {
    const { data, refetch, isLoading } = useReadContract({
        address: FLASHDUEL_ADDRESS,
        abi: FLASHDUEL_ABI,
        functionName: 'getOpenMatches',
    });

    return { matches: data || [], refetch, isLoading };
}

export function useLeaderboard(limit: number = 10) {
    const { data, refetch, isLoading } = useReadContract({
        address: FLASHDUEL_ADDRESS,
        abi: FLASHDUEL_ABI,
        functionName: 'getLeaderboard',
        args: [BigInt(limit)],
    });

    return { leaderboard: data || [], refetch, isLoading };
}

export function usePlayerStats(address: `0x${string}` | undefined) {
    const { data, refetch, isLoading } = useReadContract({
        address: FLASHDUEL_ADDRESS,
        abi: FLASHDUEL_ABI,
        functionName: 'getPlayerStats',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    return { stats: data, refetch, isLoading };
}

export function usePlatformStats() {
    const { data, refetch, isLoading } = useReadContract({
        address: FLASHDUEL_ADDRESS,
        abi: FLASHDUEL_ABI,
        functionName: 'getPlatformStats',
    });

    return {
        stats: data ? {
            totalMatches: Number(data[0]),
            totalPrizePool: Number(formatUnits(data[1], 6)),
            totalFees: Number(formatUnits(data[2], 6)),
            totalPlayers: Number(data[3]),
        } : null,
        refetch,
        isLoading,
    };
}

export function useRecentMatches(limit: number = 10) {
    const { data, refetch, isLoading } = useReadContract({
        address: FLASHDUEL_ADDRESS,
        abi: FLASHDUEL_ABI,
        functionName: 'getRecentMatches',
        args: [BigInt(limit)],
    });

    return { matches: data || [], refetch, isLoading };
}