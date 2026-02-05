import { Router } from 'express';
import * as matchService from '../services/matchService';

const router = Router();

router.get('/open', (req, res) => {
  const matches = matchService.getOpenMatches();
  res.json({ matches });
});

router.get('/active', (req, res) => {
  const matches = matchService.getActiveMatches();
  res.json({ matches });
});

router.get('/:matchId', (req, res) => {
  const match = matchService.getMatch(req.params.matchId);

  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  res.json({ match });
});

export default router;