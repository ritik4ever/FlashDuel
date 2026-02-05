export interface Player {
    address: string;
    portfolio: Portfolio;
    portfolioValue: number;
    tradesCount: number;
    trades: Trade[];
}

export interface Portfolio {
    usdc: number;
    eth: number;
    btc: number;
    sol: number;
}

export interface Trade {
    id: string;
    asset: 'eth' | 'btc' | 'sol';
    side: 'buy' | 'sell';
    amount: number;
    price: number;
    timestamp: number;
}

export interface Match {
    id: string;
    status: 'waiting' | 'active' | 'completed';
    stakeAmount: number;
    duration: number;
    assets: string[];
    createdAt: number;
    startedAt?: number;
    endedAt?: number;
    prizePool: number;
    winner?: string;
    playerA: Player | null;
    playerB: Player | null;
}

export interface PriceData {
    eth: number;
    btc: number;
    sol: number;
    timestamp: number;
}

export type AssetType = 'eth' | 'btc' | 'sol';