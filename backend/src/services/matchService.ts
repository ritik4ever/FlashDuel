import { v4 as uuidv4 } from 'uuid';
import { Match, Player, Portfolio, MatchStatus, Trade } from '../types';
import { getCurrentPrices, calculatePortfolioValue } from './priceService';

// In-memory storage for matches
const matches: Map<string, Match> = new Map();
const onChainIdToMatchId: Map<string, string> = new Map();

// Match event listeners
type MatchListener = (match: Match) => void;
const matchListeners: Map<string, MatchListener[]> = new Map();

// Create initial portfolio
function createPortfolio(usdcAmount: number): Portfolio {
  return {
    usdc: usdcAmount,
    eth: 0,
    btc: 0,
    sol: 0,
  };
}

// Create a new match
export function createMatch(
  playerAddress: string,
  stakeAmount: number,
  duration: number,
  onChainId?: string
): Match {
  const matchId = uuidv4();

  const match: Match = {
    id: matchId,
    onChainId: onChainId || null,
    playerA: {
      address: playerAddress,
    },
    playerB: null,
    stakeAmount,
    prizePool: stakeAmount * 2,
    duration,
    status: 'waiting',
    createdAt: Date.now(),
    startedAt: 0,
    endedAt: 0,
    portfolioA: createPortfolio(stakeAmount),
    portfolioB: createPortfolio(stakeAmount),
    winner: null,
    playerAScore: 0,
    playerBScore: 0,
  };

  matches.set(matchId, match);

  if (onChainId) {
    onChainIdToMatchId.set(onChainId, matchId);
  }

  console.log(`[Match] Created: ${matchId} by ${playerAddress}, stake: $${stakeAmount}, duration: ${duration}s`);

  return match;
}

// Join an existing match
export function joinMatch(matchId: string, playerAddress: string, onChainId?: string): Match | null {
  const match = matches.get(matchId);

  if (!match) {
    console.log(`[Match] Not found: ${matchId}`);
    return null;
  }

  if (match.status !== 'waiting') {
    console.log(`[Match] Cannot join, status: ${match.status}`);
    return null;
  }

  if (match.playerA.address.toLowerCase() === playerAddress.toLowerCase()) {
    console.log(`[Match] Cannot join own match`);
    return null;
  }

  match.playerB = {
    address: playerAddress,
  };
  match.status = 'active';
  match.startedAt = Date.now();

  if (onChainId && !match.onChainId) {
    match.onChainId = onChainId;
    onChainIdToMatchId.set(onChainId, matchId);
  }

  console.log(`[Match] ${matchId} started: ${match.playerA.address} vs ${playerAddress}`);

  // Notify listeners
  notifyMatchListeners(matchId, match);

  // Schedule match end
  setTimeout(() => {
    endMatch(matchId);
  }, match.duration * 1000);

  return match;
}

// Execute a trade
export function executeTrade(
  matchId: string,
  playerAddress: string,
  asset: 'eth' | 'btc' | 'sol',
  action: 'buy' | 'sell',
  quantity: number
): { success: boolean; portfolio?: Portfolio; error?: string } {
  const match = matches.get(matchId);

  if (!match) {
    return { success: false, error: 'Match not found' };
  }

  if (match.status !== 'active') {
    return { success: false, error: 'Match not active' };
  }

  // Determine which player's portfolio to update
  const isPlayerA = match.playerA.address.toLowerCase() === playerAddress.toLowerCase();
  const isPlayerB = match.playerB?.address.toLowerCase() === playerAddress.toLowerCase();

  if (!isPlayerA && !isPlayerB) {
    return { success: false, error: 'Not a player in this match' };
  }

  const portfolio = isPlayerA ? match.portfolioA : match.portfolioB;
  const prices = getCurrentPrices();
  const price = prices[asset];
  const cost = quantity * price;

  if (action === 'buy') {
    if (portfolio.usdc < cost) {
      return { success: false, error: 'Insufficient USDC balance' };
    }
    portfolio.usdc -= cost;
    portfolio[asset] += quantity;
  } else {
    if (portfolio[asset] < quantity) {
      return { success: false, error: `Insufficient ${asset.toUpperCase()} balance` };
    }
    portfolio[asset] -= quantity;
    portfolio.usdc += cost;
  }

  console.log(`[Trade] ${playerAddress} ${action} ${quantity} ${asset} @ $${price} in match ${matchId}`);

  // Notify listeners about match update
  notifyMatchListeners(matchId, match);

  return { success: true, portfolio: { ...portfolio } };
}

// End a match
export function endMatch(matchId: string): Match | null {
  const match = matches.get(matchId);

  if (!match || match.status !== 'active') {
    return null;
  }

  match.status = 'settling';
  match.endedAt = Date.now();

  const prices = getCurrentPrices();

  // Calculate final values
  const playerAValue = calculatePortfolioValue(match.portfolioA);
  const playerBValue = calculatePortfolioValue(match.portfolioB);

  // Calculate scores (profit/loss in basis points)
  match.playerAScore = Math.round(((playerAValue - match.stakeAmount) / match.stakeAmount) * 10000);
  match.playerBScore = Math.round(((playerBValue - match.stakeAmount) / match.stakeAmount) * 10000);

  // Determine winner
  if (playerAValue >= playerBValue) {
    match.winner = match.playerA.address;
  } else if (match.playerB) {
    match.winner = match.playerB.address;
  }

  match.status = 'completed';

  console.log(`[Match] ${matchId} ended`);
  console.log(`  Player A (${match.playerA.address}): $${playerAValue.toFixed(2)} (${match.playerAScore / 100}%)`);
  console.log(`  Player B (${match.playerB?.address}): $${playerBValue.toFixed(2)} (${match.playerBScore / 100}%)`);
  console.log(`  Winner: ${match.winner}`);

  // Notify listeners
  notifyMatchListeners(matchId, match);

  return match;
}

// Get a specific match
export function getMatch(matchId: string): Match | null {
  return matches.get(matchId) || null;
}

// Get match by on-chain ID
export function getMatchByOnChainId(onChainId: string): Match | null {
  const matchId = onChainIdToMatchId.get(onChainId);
  if (!matchId) return null;
  return matches.get(matchId) || null;
}

// Get all open matches (waiting for players)
export function getOpenMatches(): Match[] {
  return Array.from(matches.values())
    .filter(m => m.status === 'waiting')
    .sort((a, b) => b.createdAt - a.createdAt);
}

// Get all active matches
export function getActiveMatches(): Match[] {
  return Array.from(matches.values())
    .filter(m => m.status === 'active')
    .sort((a, b) => b.startedAt - a.startedAt);
}

// Get recent completed matches
export function getRecentMatches(limit: number = 10): Match[] {
  return Array.from(matches.values())
    .filter(m => m.status === 'completed')
    .sort((a, b) => b.endedAt - a.endedAt)
    .slice(0, limit);
}

// Get matches for a specific player
export function getPlayerMatches(playerAddress: string): Match[] {
  const addr = playerAddress.toLowerCase();
  return Array.from(matches.values())
    .filter(m =>
      m.playerA.address.toLowerCase() === addr ||
      m.playerB?.address.toLowerCase() === addr
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}

// Subscribe to match updates
export function onMatchUpdate(matchId: string, listener: MatchListener): () => void {
  if (!matchListeners.has(matchId)) {
    matchListeners.set(matchId, []);
  }
  matchListeners.get(matchId)!.push(listener);

  return () => {
    const listeners = matchListeners.get(matchId);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  };
}

// Notify match listeners
function notifyMatchListeners(matchId: string, match: Match): void {
  const listeners = matchListeners.get(matchId);
  if (listeners) {
    listeners.forEach(listener => listener(match));
  }
}

// Cancel a match (only creator, only if waiting)
export function cancelMatch(matchId: string, playerAddress: string): boolean {
  const match = matches.get(matchId);

  if (!match) return false;
  if (match.status !== 'waiting') return false;
  if (match.playerA.address.toLowerCase() !== playerAddress.toLowerCase()) return false;

  match.status = 'cancelled';
  console.log(`[Match] ${matchId} cancelled by ${playerAddress}`);

  return true;
}

// Get match statistics
export function getMatchStats(): { total: number; active: number; waiting: number; completed: number } {
  const all = Array.from(matches.values());
  return {
    total: all.length,
    active: all.filter(m => m.status === 'active').length,
    waiting: all.filter(m => m.status === 'waiting').length,
    completed: all.filter(m => m.status === 'completed').length,
  };
}
