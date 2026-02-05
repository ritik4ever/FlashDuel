import { WebSocket, WebSocketServer } from 'ws';
import { WSMessage, PriceData, Match } from './types';
import * as matchService from './services/matchService';
import { getCurrentPrices, onPriceUpdate } from './services/priceService';
import { calculatePortfolioValue } from './utils/helpers';

interface ConnectedClient {
  ws: WebSocket;
  address: string;
  matchId?: string;
}

const clients: Map<WebSocket, ConnectedClient> = new Map();

export function setupWebSocket(server: any): WebSocketServer {
  const wss = new WebSocketServer({ server });

  // Subscribe to price updates
  onPriceUpdate((prices) => {
    broadcastPrices(prices);
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', (data: string) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        handleMessage(ws, message);
      } catch (error) {
        console.error('Failed to parse message:', error);
        sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      const client = clients.get(ws);
      if (client) {
        console.log(`Client disconnected: ${client.address}`);
        clients.delete(ws);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Check for match timeouts every second
  setInterval(() => {
    checkMatchTimeouts();
  }, 1000);

  return wss;
}

function handleMessage(ws: WebSocket, message: WSMessage): void {
  const { type, payload } = message;

  switch (type) {
    case 'auth':
      handleAuth(ws, payload);
      break;
    case 'create_match':
      handleCreateMatch(ws, payload);
      break;
    case 'join_match':
      handleJoinMatch(ws, payload);
      break;
    case 'trade':
      handleTrade(ws, payload);
      break;
    case 'get_matches':
      handleGetMatches(ws);
      break;
    case 'get_match':
      handleGetMatch(ws, payload);
      break;
    case 'cancel_match':
      handleCancelMatch(ws, payload);
      break;
    default:
      sendError(ws, `Unknown message type: ${type}`);
  }
}

function handleAuth(ws: WebSocket, payload: { address: string }): void {
  const { address } = payload;

  clients.set(ws, { ws, address });

  send(ws, {
    type: 'auth_success',
    payload: { address }
  });

  // Send current prices
  send(ws, {
    type: 'prices',
    payload: getCurrentPrices()
  });

  // Check if player has an active match
  const existingMatch = matchService.getPlayerMatch(address);
  if (existingMatch) {
    send(ws, {
      type: 'match_restored',
      payload: { match: sanitizeMatch(existingMatch) }
    });
  }

  console.log(`Client authenticated: ${address}`);
}

function handleCreateMatch(
  ws: WebSocket,
  payload: { stakeAmount: number; duration: number; assets: string[] }
): void {
  const client = clients.get(ws);
  if (!client?.address) {
    sendError(ws, 'Not authenticated');
    return;
  }

  const { stakeAmount, duration, assets } = payload;

  // Validate inputs
  if (stakeAmount < 1 || stakeAmount > 1000) {
    sendError(ws, 'Stake amount must be between 1 and 1000');
    return;
  }

  if (duration < 60 || duration > 600) {
    sendError(ws, 'Duration must be between 60 and 600 seconds');
    return;
  }

  const match = matchService.createMatch(client.address, stakeAmount, duration, assets);
  client.matchId = match.id;

  send(ws, {
    type: 'match_created',
    payload: { match: sanitizeMatch(match) }
  });

  // Broadcast new match to all clients
  broadcastOpenMatches();

  console.log(`Match created: ${match.id} by ${client.address}`);
}

function handleJoinMatch(ws: WebSocket, payload: { matchId: string }): void {
  const client = clients.get(ws);
  if (!client?.address) {
    sendError(ws, 'Not authenticated');
    return;
  }

  const { matchId } = payload;
  const match = matchService.joinMatch(matchId, client.address);

  if (!match) {
    sendError(ws, 'Failed to join match');
    return;
  }

  client.matchId = match.id;

  // Notify both players
  const playerAWs = findClientByAddress(match.playerA?.address);
  const playerBWs = findClientByAddress(match.playerB?.address);

  const matchData = sanitizeMatch(match);

  if (playerAWs) {
    send(playerAWs, { type: 'match_started', payload: { match: matchData } });
  }
  if (playerBWs) {
    send(playerBWs, { type: 'match_started', payload: { match: matchData } });
  }

  // Update open matches for lobby
  broadcastOpenMatches();

  console.log(`Match started: ${match.id}`);
}

function handleTrade(
  ws: WebSocket,
  payload: { matchId: string; asset: 'eth' | 'btc' | 'sol'; side: 'buy' | 'sell'; amount: number }
): void {
  const client = clients.get(ws);
  if (!client?.address) {
    sendError(ws, 'Not authenticated');
    return;
  }

  const { matchId, asset, side, amount } = payload;

  const result = matchService.executeTrade(matchId, client.address, asset, side, amount);

  if (!result.success) {
    sendError(ws, result.error || 'Trade failed');
    return;
  }

  const match = matchService.getMatch(matchId);
  if (!match) return;

  // Send trade confirmation to the trader
  send(ws, {
    type: 'trade_executed',
    payload: { trade: result.trade }
  });

  // Broadcast updated match state to both players
  const matchData = sanitizeMatch(match);
  const playerAWs = findClientByAddress(match.playerA?.address);
  const playerBWs = findClientByAddress(match.playerB?.address);

  if (playerAWs) {
    send(playerAWs, { type: 'match_updated', payload: { match: matchData } });
  }
  if (playerBWs) {
    send(playerBWs, { type: 'match_updated', payload: { match: matchData } });
  }
}

function handleGetMatches(ws: WebSocket): void {
  const openMatches = matchService.getOpenMatches().map(sanitizeMatch);

  send(ws, {
    type: 'open_matches',
    payload: { matches: openMatches }
  });
}

function handleGetMatch(ws: WebSocket, payload: { matchId: string }): void {
  const match = matchService.getMatch(payload.matchId);

  if (!match) {
    sendError(ws, 'Match not found');
    return;
  }

  send(ws, {
    type: 'match_data',
    payload: { match: sanitizeMatch(match) }
  });
}

function handleCancelMatch(ws: WebSocket, payload: { matchId: string }): void {
  const client = clients.get(ws);
  if (!client?.address) {
    sendError(ws, 'Not authenticated');
    return;
  }

  const success = matchService.cancelMatch(payload.matchId, client.address);

  if (!success) {
    sendError(ws, 'Failed to cancel match');
    return;
  }

  client.matchId = undefined;

  send(ws, {
    type: 'match_cancelled',
    payload: { matchId: payload.matchId }
  });

  broadcastOpenMatches();
}

function checkMatchTimeouts(): void {
  const activeMatches = matchService.getActiveMatches();
  const now = Date.now();

  for (const match of activeMatches) {
    if (match.startedAt && now - match.startedAt >= match.duration * 1000) {
      const endedMatch = matchService.endMatch(match.id);

      if (endedMatch) {
        const matchData = sanitizeMatch(endedMatch);

        const playerAWs = findClientByAddress(endedMatch.playerA?.address);
        const playerBWs = findClientByAddress(endedMatch.playerB?.address);

        if (playerAWs) {
          send(playerAWs, { type: 'match_ended', payload: { match: matchData } });
        }
        if (playerBWs) {
          send(playerBWs, { type: 'match_ended', payload: { match: matchData } });
        }

        console.log(`Match ended: ${match.id}, Winner: ${endedMatch.winner}`);
      }
    }
  }
}

function broadcastPrices(prices: PriceData): void {
  const message = { type: 'prices', payload: prices };

  clients.forEach((client, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      send(ws, message);
    }
  });
}

function broadcastOpenMatches(): void {
  const openMatches = matchService.getOpenMatches().map(sanitizeMatch);
  const message = { type: 'open_matches', payload: { matches: openMatches } };

  clients.forEach((client, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      send(ws, message);
    }
  });
}

function findClientByAddress(address?: string): WebSocket | undefined {
  if (!address) return undefined;

  for (const [ws, client] of clients.entries()) {
    if (client.address === address && ws.readyState === WebSocket.OPEN) {
      return ws;
    }
  }
  return undefined;
}

function sanitizeMatch(match: Match): any {
  const prices = getCurrentPrices();

  return {
    id: match.id,
    status: match.status,
    stakeAmount: match.stakeAmount,
    duration: match.duration,
    assets: match.assets,
    createdAt: match.createdAt,
    startedAt: match.startedAt,
    endedAt: match.endedAt,
    prizePool: match.prizePool,
    winner: match.winner,
    playerA: match.playerA ? {
      address: match.playerA.address,
      portfolio: match.playerA.portfolio,
      portfolioValue: calculatePortfolioValue(match.playerA.portfolio, prices),
      tradesCount: match.playerA.trades.length,
      trades: match.playerA.trades.slice(-10)
    } : null,
    playerB: match.playerB ? {
      address: match.playerB.address,
      portfolio: match.playerB.portfolio,
      portfolioValue: calculatePortfolioValue(match.playerB.portfolio, prices),
      tradesCount: match.playerB.trades.length,
      trades: match.playerB.trades.slice(-10)
    } : null
  };
}

function send(ws: WebSocket, message: WSMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function sendError(ws: WebSocket, error: string): void {
  send(ws, { type: 'error', payload: { message: error } });
}