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
    {
        name: 'symbol',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'string' }],
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

// ============================================
// USDC BALANCE - READ FROM BLOCKCHAIN
// ============================================
export function useUSDCBalance(address: `0x${string}` | undefined) {
    const { data, refetch, isLoading, isError, error } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 5000, // Refetch every 5 seconds
            staleTime: 3000,
        },
    });

    // USDC has 6 decimals - convert from raw to human readable
    const balanceRaw = data ?? BigInt(0);
    const balance = Number(formatUnits(balanceRaw, 6));

    return {
        balance,          // Human readable (e.g., 100.50)
        balanceRaw,       // Raw BigInt
        refetch,
        isLoading,
        isError,
        error,
    };
}

// ============================================
// USDC ALLOWANCE - CHECK APPROVAL
// ============================================
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

    const allowanceRaw = data ?? BigInt(0);
    const allowance = Number(formatUnits(allowanceRaw, 6));

    return {
        allowance,
        allowanceRaw,
        refetch,
        isLoading,
    };
}

// ============================================
// USDC OPERATIONS - APPROVE & FAUCET
// ============================================
export function useUSDC() {
    const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const approve = (amount: number) => {
        const amountInWei = parseUnits(amount.toString(), 6);
        writeContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [FLASHDUEL_ADDRESS, amountInWei],
        });
    };

    const approveMax = () => {
        // Approve max uint256
        writeContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [FLASHDUEL_ADDRESS, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
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

// ============================================
// FLASHDUEL CONTRACT OPERATIONS
// ============================================
export function useFlashDuel() {
    const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const createMatch = (stakeAmount: number, duration: number) => {
        const stakeInWei = parseUnits(stakeAmount.toString(), 6);
        writeContract({
            address: FLASHDUEL_ADDRESS,
            abi: FLASHDUEL_ABI,
            functionName: 'createMatch',
            args: [stakeInWei, BigInt(duration)],
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

// ============================================
// READ CONTRACT DATA
// ============================================
export function useOpenMatches() {
    const { data, refetch, isLoading, isError } = useReadContract({
        address: FLASHDUEL_ADDRESS,
        abi: FLASHDUEL_ABI,
        functionName: 'getOpenMatches',
        query: {
            refetchInterval: 5000,
        },
    });

    return {
        matches: data || [],
        refetch,
        isLoading,
        isError,
    };
}

export function useLeaderboard(limit: number = 10) {
    const { data, refetch, isLoading } = useReadContract({
        address: FLASHDUEL_ADDRESS,
        abi: FLASHDUEL_ABI,
        functionName: 'getLeaderboard',
        args: [BigInt(limit)],
        query: {
            refetchInterval: 30000,
        },
    });

    return {
        leaderboard: data || [],
        refetch,
        isLoading,
    };
}

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
        isLoading,
    };
}

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
        stats: data
            ? {
                totalMatches: Number(data[0]),
                totalPrizePool: Number(formatUnits(data[1], 6)),
                totalFees: Number(formatUnits(data[2], 6)),
                totalPlayers: Number(data[3]),
            }
            : null,
        refetch,
        isLoading,
    };
}
