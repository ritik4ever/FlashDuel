import { v4 as uuidv4 } from 'uuid';
import { Match, Player, Trade, Portfolio, PriceData } from '../types';
import { calculatePortfolioValue, generateMatchId } from '../utils/helpers';
import { getCurrentPrices } from './priceService';

// In-memory storage (use Redis/DB in production)
const matches: Map<string, Match> = new Map();
const playerMatches: Map<string, string> = new Map(); // address -> matchId

export function createMatch(
  creatorAddress: string,
  stakeAmount: number,
  duration: number,
  assets: string[]
): Match {
  const matchId = generateMatchId();

  const playerA: Player = {
    address: creatorAddress,
    sessionId: '',
    portfolio: {
      usdc: stakeAmount,
      eth: 0,
      btc: 0,
      sol: 0
    },
    trades: [],
    connected: true
  };

  const match: Match = {
    id: matchId,
    status: 'waiting',
    stakeAmount,
    duration,
    assets,
    createdAt: Date.now(),
    playerA,
    playerB: null,
    prizePool: stakeAmount * 2
  };

  matches.set(matchId, match);
  playerMatches.set(creatorAddress, matchId);

  return match;
}

export function joinMatch(matchId: string, playerAddress: string): Match | null {
  const match = matches.get(matchId);

  if (!match || match.status !== 'waiting' || match.playerA?.address === playerAddress) {
    return null;
  }

  const playerB: Player = {
    address: playerAddress,
    sessionId: '',
    portfolio: {
      usdc: match.stakeAmount,
      eth: 0,
      btc: 0,
      sol: 0
    },
    trades: [],
    connected: true
  };

  match.playerB = playerB;
  match.status = 'active';
  match.startedAt = Date.now();

  playerMatches.set(playerAddress, matchId);

  return match;
}

export function executeTrade(
  matchId: string,
  playerAddress: string,
  asset: 'eth' | 'btc' | 'sol',
  side: 'buy' | 'sell',
  amount: number
): { success: boolean; trade?: Trade; error?: string } {
  const match = matches.get(matchId);

  if (!match || match.status !== 'active') {
    return { success: false, error: 'Match not active' };
  }

  const player = match.playerA?.address === playerAddress
    ? match.playerA
    : match.playerB;

  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  const prices = getCurrentPrices();
  const price = prices[asset];
  const cost = amount * price;

  if (side === 'buy') {
    if (player.portfolio.usdc < cost) {
      return { success: false, error: 'Insufficient USDC balance' };
    }
    player.portfolio.usdc -= cost;
    player.portfolio[asset] += amount;
  } else {
    if (player.portfolio[asset] < amount) {
      return { success: false, error: `Insufficient ${asset.toUpperCase()} balance` };
    }
    player.portfolio[asset] -= amount;
    player.portfolio.usdc += cost;
  }

  const trade: Trade = {
    id: uuidv4(),
    asset,
    side,
    amount,
    price,
    timestamp: Date.now()
  };

  player.trades.push(trade);

  return { success: true, trade };
}

export function endMatch(matchId: string): Match | null {
  const match = matches.get(matchId);

  if (!match || match.status !== 'active') {
    return null;
  }

  const prices = getCurrentPrices();

  const playerAValue = match.playerA
    ? calculatePortfolioValue(match.playerA.portfolio, prices)
    : 0;
  const playerBValue = match.playerB
    ? calculatePortfolioValue(match.playerB.portfolio, prices)
    : 0;

  match.status = 'completed';
  match.endedAt = Date.now();

  if (playerAValue > playerBValue) {
    match.winner = match.playerA?.address;
  } else if (playerBValue > playerAValue) {
    match.winner = match.playerB?.address;
  } else {
    match.winner = 'draw';
  }

  return match;
}

export function getMatch(matchId: string): Match | undefined {
  return matches.get(matchId);
}

export function getOpenMatches(): Match[] {
  return Array.from(matches.values()).filter(m => m.status === 'waiting');
}

export function getActiveMatches(): Match[] {
  return Array.from(matches.values()).filter(m => m.status === 'active');
}

export function getPlayerMatch(address: string): Match | undefined {
  const matchId = playerMatches.get(address);
  return matchId ? matches.get(matchId) : undefined;
}

export function removePlayerFromMatch(address: string): void {
  playerMatches.delete(address);
}

export function cancelMatch(matchId: string, playerAddress: string): boolean {
  const match = matches.get(matchId);

  if (!match || match.status !== 'waiting' || match.playerA?.address !== playerAddress) {
    return false;
  }

  matches.delete(matchId);
  playerMatches.delete(playerAddress);

  return true;
}