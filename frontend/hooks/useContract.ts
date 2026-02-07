'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

// Contract addresses from env
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x9FA9F632F2b6afCbb112Ee53D2638202EfE9B71A') as `0x${string}`;
export const FLASHDUEL_ADDRESS = (process.env.NEXT_PUBLIC_FLASHDUEL_ADDRESS || '0x7c1d47ED0aFC7efCc2d6592b7Da3D838D97A00B4') as `0x${string}`;

// USDC ABI (ERC20 + faucet)
export const USDC_ABI = [
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
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ type: 'uint256' }],
    },
    {
        name: 'faucet',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: [],
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint8' }],
    },
] as const;

// FlashDuel ABI
export const FLASHDUEL_ABI = [
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
        name: 'cancelMatch',
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
        name: 'getPlayerStats',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'player', type: 'address' }],
        outputs: [
            {
                type: 'tuple',
                components: [
                    { name: 'totalMatches', type: 'uint256' },
                    { name: 'wins', type: 'uint256' },
                    { name: 'losses', type: 'uint256' },
                    { name: 'totalEarnings', type: 'uint256' },
                    { name: 'totalStaked', type: 'uint256' },
                    { name: 'bestScore', type: 'int256' },
                ],
            },
        ],
    },
    {
        name: 'getLeaderboard',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'limit', type: 'uint256' }],
        outputs: [
            {
                type: 'tuple[]',
                components: [
                    { name: 'player', type: 'address' },
                    { name: 'wins', type: 'uint256' },
                    { name: 'totalMatches', type: 'uint256' },
                    { name: 'earnings', type: 'uint256' },
                    { name: 'winRate', type: 'int256' },
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

// Hook to get REAL USDC balance from blockchain
export function useUSDCBalance(address: `0x${string}` | undefined) {
    const { data, refetch, isLoading, isError } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 10000, // Refetch every 10 seconds
        },
    });

    // USDC has 6 decimals
    const balance = data ? Number(formatUnits(data, 6)) : 0;

    return {
        balance,
        balanceRaw: data || BigInt(0),
        refetch,
        isLoading,
        isError,
    };
}

// Hook to get USDC allowance
export function useUSDCAllowance(owner: `0x${string}` | undefined) {
    const { data, refetch, isLoading } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: owner ? [owner, FLASHDUEL_ADDRESS] : undefined,
        query: {
            enabled: !!owner,
            refetchInterval: 5000,
        },
    });

    return {
        allowance: data ? Number(formatUnits(data, 6)) : 0,
        allowanceRaw: data || BigInt(0),
        refetch,
        isLoading,
    };
}

// Hook for USDC operations (approve, faucet)
export function useUSDC() {
    const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const approve = (amount: number) => {
        writeContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [FLASHDUEL_ADDRESS, parseUnits(amount.toString(), 6)],
        });
    };

    const approveMax = () => {
        writeContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [FLASHDUEL_ADDRESS, parseUnits('1000000', 6)], // Approve 1M USDC
        });
    };

    const faucet = () => {
        writeContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'faucet',
        });
    };

    return {
        approve,
        approveMax,
        faucet,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
        reset,
    };
}

// Hook for FlashDuel contract operations
export function useFlashDuel() {
    const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
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
        error,
        reset,
    };
}

// Hook to get open matches from contract
export function useOpenMatches() {
    const { data, refetch, isLoading, isError } = useReadContract({
        address: FLASHDUEL_ADDRESS,
        abi: FLASHDUEL_ABI,
        functionName: 'getOpenMatches',
        query: {
            refetchInterval: 5000, // Refresh every 5 seconds
        },
    });

    return {
        matches: data || [],
        refetch,
        isLoading,
        isError,
    };
}

// Hook to get leaderboard
export function useLeaderboard(limit: number = 10) {
    const { data, refetch, isLoading } = useReadContract({
        address: FLASHDUEL_ADDRESS,
        abi: FLASHDUEL_ABI,
        functionName: 'getLeaderboard',
        args: [BigInt(limit)],
        query: {
            refetchInterval: 30000, // Refresh every 30 seconds
        },
    });

    return {
        leaderboard: data || [],
        refetch,
        isLoading
    };
}

// Hook to get player stats
export function usePlayerStats(address: `0x${string}` | undefined) {
    const { data, refetch, isLoading } = useReadContract({
        address: FLASHDUEL_ADDRESS,
        abi: FLASHDUEL_ABI,
        functionName: 'getPlayerStats',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 10000,
        },
    });

    return {
        stats: data,
        refetch,
        isLoading
    };
}

// Hook to get platform stats
export function usePlatformStats() {
    const { data, refetch, isLoading } = useReadContract({
        address: FLASHDUEL_ADDRESS,
        abi: FLASHDUEL_ABI,
        functionName: 'getPlatformStats',
        query: {
            refetchInterval: 10000,
        },
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
