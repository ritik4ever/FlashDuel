import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

interface Player {
    ws: WebSocket;
    address: string;
}

interface Portfolio {
    usdc: number;
    assets: { [key: string]: number };
}

interface Match {
    id: string;
    playerA: string;
    playerB: string | null;
    stakeAmount: number;
    prizePool: number;
    duration: number;
    status: 'waiting' | 'active' | 'completed';
    startedAt: number;
    createdAt: number;
    portfolioA: Portfolio;
    portfolioB: Portfolio;
    assets: string[];
    winner: string | null;
}

const players: Map<string, Player> = new Map();
const matches: Map<string, Match> = new Map();

function broadcast(message: object): void {
    const data = JSON.stringify(message);
    players.forEach((player) => {
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(data);
        }
    });
}

function sendTo(address: string, message: object): void {
    const player = players.get(address);
    if (player && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message));
    }
}

function getOpenMatches(): Match[] {
    return Array.from(matches.values()).filter((m) => m.status === 'waiting');
}

function createPortfolio(stakeAmount: number): Portfolio {
    return {
        usdc: stakeAmount,
        assets: {},
    };
}

wss.on('connection', (ws: WebSocket) => {
    let playerAddress: string | null = null;

    ws.on('message', (data: Buffer) => {
        try {
            const message = JSON.parse(data.toString());

            switch (message.type) {
                case 'auth': {
                    playerAddress = message.address as string;
                    if (playerAddress) {
                        players.set(playerAddress, { ws, address: playerAddress });
                        console.log(`Player connected: ${playerAddress}`);

                        ws.send(JSON.stringify({
                            type: 'matches',
                            matches: getOpenMatches(),
                        }));
                    }
                    break;
                }

                case 'create_match': {
                    if (!playerAddress) return;

                    const match: Match = {
                        id: uuidv4(),
                        playerA: playerAddress,
                        playerB: null,
                        stakeAmount: message.stakeAmount,
                        prizePool: message.stakeAmount * 2,
                        duration: message.duration,
                        status: 'waiting',
                        startedAt: 0,
                        createdAt: Date.now(),
                        portfolioA: createPortfolio(message.stakeAmount),
                        portfolioB: createPortfolio(message.stakeAmount),
                        assets: message.assets,
                        winner: null,
                    };

                    matches.set(match.id, match);

                    sendTo(playerAddress, {
                        type: 'match_created',
                        match,
                    });

                    broadcast({
                        type: 'matches',
                        matches: getOpenMatches(),
                    });
                    break;
                }

                case 'join_match': {
                    if (!playerAddress) return;

                    const match = matches.get(message.matchId);
                    if (!match || match.status !== 'waiting') return;
                    if (match.playerA === playerAddress) return;

                    match.playerB = playerAddress;
                    match.status = 'active';
                    match.startedAt = Date.now();

                    sendTo(match.playerA, { type: 'match_started', match });
                    sendTo(playerAddress, { type: 'match_joined', match });

                    broadcast({
                        type: 'matches',
                        matches: getOpenMatches(),
                    });

                    setTimeout(() => {
                        endMatch(match.id);
                    }, match.duration * 1000);
                    break;
                }

                case 'trade': {
                    if (!playerAddress) return;

                    const match = matches.get(message.matchId);
                    if (!match || match.status !== 'active') return;

                    const isPlayerA = match.playerA === playerAddress;
                    const portfolio = isPlayerA ? match.portfolioA : match.portfolioB;

                    const { asset, action, quantity, price } = message;
                    const cost = quantity * price;

                    if (action === 'buy') {
                        if (portfolio.usdc < cost) return;
                        portfolio.usdc -= cost;
                        portfolio.assets[asset] = (portfolio.assets[asset] || 0) + quantity;
                    } else {
                        if ((portfolio.assets[asset] || 0) < quantity) return;
                        portfolio.assets[asset] -= quantity;
                        portfolio.usdc += cost;
                    }

                    sendTo(playerAddress, {
                        type: 'trade_executed',
                        portfolio,
                    });

                    sendTo(match.playerA, { type: 'match_update', match });
                    if (match.playerB) {
                        sendTo(match.playerB, { type: 'match_update', match });
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    ws.on('close', () => {
        if (playerAddress) {
            players.delete(playerAddress);
            console.log(`Player disconnected: ${playerAddress}`);
        }
    });
});

function endMatch(matchId: string): void {
    const match = matches.get(matchId);
    if (!match || match.status !== 'active') return;

    match.status = 'completed';

    const valueA = match.portfolioA.usdc;
    const valueB = match.portfolioB.usdc;

    if (valueA >= valueB) {
        match.winner = match.playerA;
    } else {
        match.winner = match.playerB;
    }

    sendTo(match.playerA, { type: 'match_ended', match });
    if (match.playerB) {
        sendTo(match.playerB, { type: 'match_ended', match });
    }

    console.log(`Match ${matchId} ended. Winner: ${match.winner}`);
}

console.log(`WebSocket server running on port ${PORT}`);