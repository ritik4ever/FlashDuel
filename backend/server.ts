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
    onChainId: string | null;
    playerA: string;
    playerB: string | null;
    stakeAmount: number;
    prizePool: number;
    duration: number;
    status: 'waiting' | 'active' | 'completed' | 'settling';
    startedAt: number;
    createdAt: number;
    portfolioA: Portfolio;
    portfolioB: Portfolio;
    assets: string[];
    winner: string | null;
    playerAScore: number;
    playerBScore: number;
}

interface PriceData {
    ethereum?: { usd: number };
    bitcoin?: { usd: number };
    solana?: { usd: number };
}

const players: Map<string, Player> = new Map();
const matches: Map<string, Match> = new Map();
const onChainToLocalId: Map<string, string> = new Map();

function broadcast(message: object): void {
    const data = JSON.stringify(message);
    players.forEach((player) => {
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(data);
        }
    });
}

function sendTo(address: string, message: object): void {
    const player = players.get(address.toLowerCase());
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

function calculatePortfolioValue(portfolio: Portfolio, prices: { [key: string]: number }): number {
    let value = portfolio.usdc;
    for (const [asset, amount] of Object.entries(portfolio.assets)) {
        value += amount * (prices[asset] || 0);
    }
    return value;
}

async function fetchPrices(): Promise<{ [key: string]: number }> {
    try {
        const res = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd'
        );
        const data = await res.json() as PriceData;  // Add type assertion here
        return {
            eth: data.ethereum?.usd || 3000,
            btc: data.bitcoin?.usd || 95000,
            sol: data.solana?.usd || 200,
        };
    } catch (error) {
        console.error('Error fetching prices:', error);
        return { eth: 3000, btc: 95000, sol: 200 };
    }
}

wss.on('connection', (ws: WebSocket) => {
    let playerAddress: string | null = null;

    ws.on('message', async (data: Buffer) => {
        try {
            const message = JSON.parse(data.toString());

            switch (message.type) {
                case 'auth': {
                    playerAddress = message.address.toLowerCase();
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

                case 'match_created_onchain': {
                    if (!playerAddress) return;

                    const match: Match = {
                        id: uuidv4(),
                        onChainId: message.onChainId || null,
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
                        assets: message.assets || ['eth', 'btc', 'sol'],
                        winner: null,
                        playerAScore: 0,
                        playerBScore: 0,
                    };

                    matches.set(match.id, match);
                    if (message.onChainId) {
                        onChainToLocalId.set(message.onChainId, match.id);
                    }

                    sendTo(playerAddress, { type: 'match_created', match });
                    broadcast({ type: 'matches', matches: getOpenMatches() });
                    console.log(`Match created: ${match.id} by ${playerAddress}`);
                    break;
                }

                case 'create_match': {
                    if (!playerAddress) return;

                    const match: Match = {
                        id: uuidv4(),
                        onChainId: null,
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
                        assets: message.assets || ['eth', 'btc', 'sol'],
                        winner: null,
                        playerAScore: 0,
                        playerBScore: 0,
                    };

                    matches.set(match.id, match);

                    sendTo(playerAddress, { type: 'match_created', match });
                    broadcast({ type: 'matches', matches: getOpenMatches() });
                    console.log(`Match created: ${match.id} by ${playerAddress}`);
                    break;
                }

                case 'match_joined_onchain': {
                    if (!playerAddress) return;

                    const localId = onChainToLocalId.get(message.onChainId);
                    if (!localId) return;

                    const match = matches.get(localId);
                    if (!match || match.status !== 'waiting') return;

                    match.playerB = playerAddress;
                    match.status = 'active';
                    match.startedAt = Date.now();

                    sendTo(match.playerA, { type: 'match_started', match });
                    sendTo(playerAddress, { type: 'match_joined', match });
                    broadcast({ type: 'matches', matches: getOpenMatches() });

                    console.log(`Match ${match.id} started: ${match.playerA} vs ${playerAddress}`);

                    setTimeout(async () => {
                        await endMatch(match.id);
                    }, match.duration * 1000);
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
                    broadcast({ type: 'matches', matches: getOpenMatches() });

                    console.log(`Match ${match.id} started: ${match.playerA} vs ${playerAddress}`);

                    setTimeout(async () => {
                        await endMatch(match.id);
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
                        if (portfolio.usdc < cost) {
                            sendTo(playerAddress, { type: 'trade_error', message: 'Insufficient USDC' });
                            return;
                        }
                        portfolio.usdc -= cost;
                        portfolio.assets[asset] = (portfolio.assets[asset] || 0) + quantity;
                    } else {
                        if ((portfolio.assets[asset] || 0) < quantity) {
                            sendTo(playerAddress, { type: 'trade_error', message: 'Insufficient asset' });
                            return;
                        }
                        portfolio.assets[asset] -= quantity;
                        portfolio.usdc += cost;
                    }

                    console.log(`Trade: ${playerAddress} ${action} ${quantity} ${asset} @ ${price}`);

                    sendTo(playerAddress, { type: 'trade_executed', portfolio });
                    sendTo(match.playerA, { type: 'match_update', match });
                    if (match.playerB) {
                        sendTo(match.playerB, { type: 'match_update', match });
                    }
                    break;
                }

                case 'get_prices': {
                    const prices = await fetchPrices();
                    ws.send(JSON.stringify({ type: 'prices', prices }));
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

async function endMatch(matchId: string): Promise<void> {
    const match = matches.get(matchId);
    if (!match || match.status !== 'active') return;

    match.status = 'settling';
    console.log(`Match ${matchId} ending...`);

    const prices = await fetchPrices();

    const playerAValue = calculatePortfolioValue(match.portfolioA, prices);
    const playerBValue = calculatePortfolioValue(match.portfolioB, prices);

    match.playerAScore = Math.round((playerAValue - match.stakeAmount) * 100);
    match.playerBScore = Math.round((playerBValue - match.stakeAmount) * 100);

    if (playerAValue >= playerBValue) {
        match.winner = match.playerA;
    } else {
        match.winner = match.playerB;
    }

    match.status = 'completed';

    console.log(`Match ${matchId} ended.`);
    console.log(`  Player A (${match.playerA}): $${playerAValue.toFixed(2)} (score: ${match.playerAScore})`);
    console.log(`  Player B (${match.playerB}): $${playerBValue.toFixed(2)} (score: ${match.playerBScore})`);
    console.log(`  Winner: ${match.winner}`);

    const result = {
        type: 'match_ended',
        match,
        prices,
        playerAValue,
        playerBValue,
    };

    sendTo(match.playerA, result);
    if (match.playerB) {
        sendTo(match.playerB, result);
    }
}

// Periodic price broadcast
setInterval(async () => {
    const prices = await fetchPrices();
    broadcast({ type: 'prices', prices });
}, 10000);

console.log(`
╔═══════════════════════════════════════════╗
║     FlashDuel WebSocket Server            ║
║     Running on port ${PORT}                   ║
╚═══════════════════════════════════════════╝
`);