import reportController from '../controllers/reportController.js';
import { Router } from 'express';

const router = Router();

router.get('/', reportController.getStats);

export default router;