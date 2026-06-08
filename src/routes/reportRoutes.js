import { Router } from 'express';
import reportController from '../controllers/reportController.js';
import { requireAuth } from '../middlewares/auth.js';

const reportRoutes = Router();

reportRoutes.get('/mine', requireAuth, reportController.listMyReports);
reportRoutes.post('/', requireAuth, reportController.createReport);
reportRoutes.get('/', reportController.listReports);
reportRoutes.put('/:id', requireAuth, reportController.updateReport);
reportRoutes.delete('/:id', requireAuth, reportController.deleteReport);

export default reportRoutes;
