import { Router } from 'express';
import reportController from '../controllers/reportController.js';
import { requireAuth } from '../middlewares/auth.js';

const reportRoutes = Router();

reportRoutes.get('/mine', requireAuth, reportController.listMyReports);
reportRoutes.post('/', requireAuth, reportController.createReport);
reportRoutes.get('/', reportController.listReports);

export default reportRoutes;
