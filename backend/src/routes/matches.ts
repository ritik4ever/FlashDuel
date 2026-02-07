import { Router, Request, Response } from 'express';
import * as matchService from '../services/matchService';

const router = Router();

// Get all open matches
router.get('/open', (_req: Request, res: Response) => {
  const matches = matchService.getOpenMatches();
  res.json({ matches });
});

// Get all active matches
router.get('/active', (_req: Request, res: Response) => {
  const matches = matchService.getActiveMatches();
  res.json({ matches });
});

// Get recent completed matches
router.get('/recent', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const matches = matchService.getRecentMatches(limit);
  res.json({ matches });
});

// Get specific match
router.get('/:matchId', (req: Request, res: Response) => {
  const match = matchService.getMatch(req.params.matchId);

  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  res.json({ match });
});

// Get matches for a player
router.get('/player/:address', (req: Request, res: Response) => {
  const matches = matchService.getPlayerMatches(req.params.address);
  res.json({ matches });
});

// Get match statistics
router.get('/stats/overview', (_req: Request, res: Response) => {
  const stats = matchService.getMatchStats();
  res.json(stats);
});

export default router;
