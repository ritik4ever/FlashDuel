export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export const SUPPORTED_CHAINS = [11155111]; // Sepolia

export const ASSETS = {
    eth: {
        name: 'Ethereum',
        symbol: 'ETH',
        icon: '/icons/eth.svg',
        color: '#627EEA',
    },
    btc: {
        name: 'Bitcoin',
        symbol: 'BTC',
        icon: '/icons/btc.svg',
        color: '#F7931A',
    },
    sol: {
        name: 'Solana',
        symbol: 'SOL',
        icon: '/icons/sol.svg',
        color: '#00FFA3',
    },
};

export const STAKE_OPTIONS = [10, 25, 50, 100];
export const DURATION_OPTIONS = [
    { value: 180, label: '3 min' },
    { value: 300, label: '5 min' },
    { value: 600, label: '10 min' },
];

export const PLATFORM_FEE = 0.05; // 5%