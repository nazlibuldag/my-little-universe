import { Router } from 'express';
import { getCelestials, createCelestial, completeGoal, deleteCelestial, analyzeMemory } from '../controllers/celestial.controller';

const router = Router();

router.get('/', getCelestials);
router.post('/', createCelestial);
router.post('/ai-analyze', analyzeMemory);
router.patch('/:id/complete', completeGoal);
router.delete('/:id', deleteCelestial);

export default router;
