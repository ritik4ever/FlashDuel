export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
export const FLASHDUEL_ADDRESS = process.env.NEXT_PUBLIC_FLASHDUEL_ADDRESS as `0x${string}`;

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
        name: 'getMatch',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'matchId', type: 'bytes32' }],
        outputs: [
            {
                type: 'tuple',
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
            { name: '_totalMatches', type: 'uint256' },
            { name: '_totalPrizePool', type: 'uint256' },
            { name: '_totalFees', type: 'uint256' },
            { name: '_totalPlayers', type: 'uint256' },
        ],
    },
    {
        name: 'getRecentMatches',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'limit', type: 'uint256' }],
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
] as const;