import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { ConnectedClient, WSMessage } from './types';
import * as matchService from './services/matchService';
import { getCurrentPrices, onPriceUpdate } from './services/priceService';

// Connected clients
const clients: Map<string, ConnectedClient> = new Map();

// WebSocket instance
let wss: WebSocketServer;

export function setupWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server });

  console.log('[WebSocket] Server initialized');

  // Subscribe to price updates to broadcast to all clients
  onPriceUpdate((prices) => {
    broadcast({ type: 'prices', prices });
  });

  wss.on('connection', (ws: WebSocket) => {
    let clientAddress: string | null = null;

    console.log('[WebSocket] New connection');

    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());

        switch (message.type) {
          case 'auth': {
            const address = (message.address as string).toLowerCase();
            clientAddress = address;

            clients.set(address, { ws, address });
            console.log(`[WebSocket] Client authenticated: ${address}`);

            // Send current prices
            ws.send(JSON.stringify({
              type: 'prices',
              prices: getCurrentPrices()
            }));

            // Send open matches
            ws.send(JSON.stringify({
              type: 'open_matches',
              matches: matchService.getOpenMatches()
            }));
            break;
          }

          case 'create_match': {
            if (!clientAddress) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
              return;
            }

            const match = matchService.createMatch(
              clientAddress,
              message.stakeAmount as number,
              message.duration as number,
              message.onChainId as string | undefined
            );

            // Send to creator
            ws.send(JSON.stringify({ type: 'match_created', match }));

            // Broadcast new open match to all
            broadcast({ type: 'open_matches', matches: matchService.getOpenMatches() });
            break;
          }

          case 'join_match': {
            if (!clientAddress) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
              return;
            }

            const match = matchService.joinMatch(
              message.matchId as string,
              clientAddress,
              message.onChainId as string | undefined
            );

            if (!match) {
              ws.send(JSON.stringify({ type: 'error', message: 'Cannot join match' }));
              return;
            }

            // Notify both players
            sendToPlayer(match.playerA.address, { type: 'match_started', match });
            sendToPlayer(clientAddress, { type: 'match_joined', match });

            // Broadcast updated open matches
            broadcast({ type: 'open_matches', matches: matchService.getOpenMatches() });

            // Subscribe both players to match updates
            matchService.onMatchUpdate(match.id, (updatedMatch) => {
              sendToPlayer(match.playerA.address, { type: 'match_update', match: updatedMatch });
              if (match.playerB) {
                sendToPlayer(match.playerB.address, { type: 'match_update', match: updatedMatch });
              }

              // If match ended, send result
              if (updatedMatch.status === 'completed') {
                const prices = getCurrentPrices();
                const result = {
                  type: 'match_ended',
                  match: updatedMatch,
                  prices,
                };
                sendToPlayer(match.playerA.address, result);
                if (match.playerB) {
                  sendToPlayer(match.playerB.address, result);
                }
              }
            });
            break;
          }

          case 'trade': {
            if (!clientAddress) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
              return;
            }

            const result = matchService.executeTrade(
              message.matchId as string,
              clientAddress,
              message.asset as 'eth' | 'btc' | 'sol',
              message.action as 'buy' | 'sell',
              message.quantity as number
            );

            if (!result.success) {
              ws.send(JSON.stringify({ type: 'trade_error', message: result.error }));
              return;
            }

            ws.send(JSON.stringify({
              type: 'trade_executed',
              portfolio: result.portfolio,
              prices: getCurrentPrices(),
            }));
            break;
          }

          case 'get_match': {
            const match = matchService.getMatch(message.matchId as string);
            if (match) {
              ws.send(JSON.stringify({ type: 'match_data', match }));
            } else {
              ws.send(JSON.stringify({ type: 'error', message: 'Match not found' }));
            }
            break;
          }

          case 'get_prices': {
            ws.send(JSON.stringify({ type: 'prices', prices: getCurrentPrices() }));
            break;
          }

          case 'get_open_matches': {
            ws.send(JSON.stringify({
              type: 'open_matches',
              matches: matchService.getOpenMatches()
            }));
            break;
          }

          case 'cancel_match': {
            if (!clientAddress) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
              return;
            }

            const success = matchService.cancelMatch(message.matchId as string, clientAddress);

            if (success) {
              ws.send(JSON.stringify({ type: 'match_cancelled', matchId: message.matchId }));
              broadcast({ type: 'open_matches', matches: matchService.getOpenMatches() });
            } else {
              ws.send(JSON.stringify({ type: 'error', message: 'Cannot cancel match' }));
            }
            break;
          }
        }
      } catch (error) {
        console.error('[WebSocket] Error handling message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
      }
    });

    ws.on('close', () => {
      if (clientAddress) {
        clients.delete(clientAddress);
        console.log(`[WebSocket] Client disconnected: ${clientAddress}`);
      }
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });
  });

  return wss;
}

// Send message to specific player
function sendToPlayer(address: string, message: object): void {
  const client = clients.get(address.toLowerCase());
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

// Broadcast to all connected clients
function broadcast(message: object): void {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

// Get connected clients count
export function getConnectedClientsCount(): number {
  return clients.size;
}
