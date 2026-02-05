import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { setupWebSocket } from './websocket';
import { startPriceUpdates } from './services/priceService';
import matchRoutes from './routes/matches';
import priceRoutes from './routes/prices';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/matches', matchRoutes);
app.use('/api/prices', priceRoutes);


app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});


const server = http.createServer(app);


setupWebSocket(server);


startPriceUpdates(5000);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 FlashDuel Backend running on port ${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`   REST API: http://localhost:${PORT}/api`);
});