// Player type
export interface Player {
  address: string;
  oderId?: string;
}

// Portfolio for trading
export interface Portfolio {
  usdc: number;
  eth: number;
  btc: number;
  sol: number;
}

// Match status
export type MatchStatus = 'waiting' | 'active' | 'completed' | 'cancelled' | 'settling';

// Match structure
export interface Match {
  id: string;
  onChainId: string | null;
  playerA: Player;
  playerB: Player | null;
  stakeAmount: number;
  prizePool: number;
  duration: number; // seconds
  status: MatchStatus;
  createdAt: number;
  startedAt: number;
  endedAt: number;
  portfolioA: Portfolio;
  portfolioB: Portfolio;
  winner: string | null;
  playerAScore: number;
  playerBScore: number;
}

// Price data from CoinGecko
export interface PriceData {
  eth: number;
  btc: number;
  sol: number;
  timestamp: number;
}

// CoinGecko API response
export interface CoinGeckoResponse {
  ethereum?: { usd: number };
  bitcoin?: { usd: number };
  solana?: { usd: number };
}

// Trade action
export interface Trade {
  matchId: string;
  playerAddress: string;
  asset: 'eth' | 'btc' | 'sol';
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
}

// WebSocket message types
export interface WSMessage {
  type: string;
  [key: string]: unknown;
}

export interface AuthMessage extends WSMessage {
  type: 'auth';
  address: string;
}

export interface CreateMatchMessage extends WSMessage {
  type: 'create_match';
  stakeAmount: number;
  duration: number;
  onChainId?: string;
}

export interface JoinMatchMessage extends WSMessage {
  type: 'join_match';
  matchId: string;
  onChainId?: string;
}

export interface TradeMessage extends WSMessage {
  type: 'trade';
  matchId: string;
  asset: 'eth' | 'btc' | 'sol';
  action: 'buy' | 'sell';
  quantity: number;
}

// Connected client
export interface ConnectedClient {
  ws: import('ws').WebSocket;
  address: string;
  matchId?: string;
}
