import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { setupWebSocket, getConnectedClientsCount } from './websocket';
import { startPriceUpdates } from './services/priceService';
import matchRoutes from './routes/matches';
import priceRoutes from './routes/prices';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// REST API Routes
app.use('/api/matches', matchRoutes);
app.use('/api/prices', priceRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    connectedClients: getConnectedClientsCount(),
  });
});

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket
setupWebSocket(server);

// Start price updates (every 10 seconds)
startPriceUpdates(10000);

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ⚔️  FlashDuel Backend Server                          ║
║                                                           ║
║     HTTP API:    http://localhost:${PORT}                    ║
║     WebSocket:   ws://localhost:${PORT}                      ║
║                                                           ║
║     Endpoints:                                            ║
║     • GET  /api/matches/open     - Open matches           ║
║     • GET  /api/matches/active   - Active matches         ║
║     • GET  /api/matches/:id      - Specific match         ║
║     • GET  /api/prices           - Current prices         ║
║     • GET  /health               - Health check           ║
║                                                           ║
║     WebSocket Messages:                                   ║
║     • auth          - Authenticate with wallet address    ║
║     • create_match  - Create new match                    ║
║     • join_match    - Join existing match                 ║
║     • trade         - Execute a trade                     ║
║     • get_prices    - Get current prices                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
});
