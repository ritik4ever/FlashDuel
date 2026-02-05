import { Router } from 'express';
import { getCurrentPrices } from '../services/priceService';

const router = Router();

router.get('/', (req, res) => {
  const prices = getCurrentPrices();
  res.json(prices);
});

export default router;