export interface Player {
  address: string;
  odName: string;
  portfolio: Portfolio;
  trades: Trade[];
  connected: boolean;
  ws?: any;
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
  duration: number; // seconds
  assets: string[];
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  playerA: Player | null;
  playerB: Player | null;
  winner?: string;
  prizePool: number;
}

export interface PriceData {
  eth: number;
  btc: number;
  sol: number;
  timestamp: number;
}

export interface WSMessage {
  type: string;
  payload: any;
}