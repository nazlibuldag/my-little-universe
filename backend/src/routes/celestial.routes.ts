import { Router } from 'express';
import { getCelestials, createCelestial, completeGoal, updateProgress, deleteCelestial, analyzeMemory, exportUniverse, importUniverse } from '../controllers/celestial.controller';

const router = Router();

router.get('/', getCelestials);
router.post('/', createCelestial);
router.post('/ai-analyze', analyzeMemory);
router.patch('/:id/complete', completeGoal);
router.patch('/:id/progress', updateProgress);
router.delete('/:id', deleteCelestial);
router.get('/export', exportUniverse);
router.post('/import', importUniverse);

export default router;
