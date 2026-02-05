export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export const STAKE_OPTIONS = [10, 25, 50, 100];

export const DURATION_OPTIONS = [
    { value: 180, label: '3 min' },
    { value: 300, label: '5 min' },
    { value: 600, label: '10 min' },
];

export const ASSETS: { [key: string]: { symbol: string; name: string; color: string; coingeckoId: string } } = {
    eth: {
        symbol: 'ETH',
        name: 'Ethereum',
        color: '#627EEA',
        coingeckoId: 'ethereum',
    },
    btc: {
        symbol: 'BTC',
        name: 'Bitcoin',
        color: '#F7931A',
        coingeckoId: 'bitcoin',
    },
    sol: {
        symbol: 'SOL',
        name: 'Solana',
        color: '#00FFA3',
        coingeckoId: 'solana',
    },
};

export const PLATFORM_FEE = 0.05;

export const CHAIN_CONFIG = {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org',
};