import { Router } from 'express';
import { generateVideoHandler, generateDroneShot } from '../controllers/sora.controller';

const router = Router();

router.post('/generate-video', generateVideoHandler);
router.post('/generate-drone-shot', generateDroneShot);

export default router;
