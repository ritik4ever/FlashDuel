import { Router, Request, Response } from 'express';
import { getCurrentPrices, fetchPrices } from '../services/priceService';

const router = Router();

// Get current prices
router.get('/', (_req: Request, res: Response) => {
  const prices = getCurrentPrices();
  res.json(prices);
});

// Force refresh prices
router.post('/refresh', async (_req: Request, res: Response) => {
  const prices = await fetchPrices();
  res.json(prices);
});

export default router;
