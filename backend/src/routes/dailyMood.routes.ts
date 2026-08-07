import { Router } from 'express';
import { getDailyMoods, createDailyMood } from '../controllers/dailyMood.controller';

const router = Router();

router.get('/', getDailyMoods);
router.post('/', createDailyMood);

export default router;
