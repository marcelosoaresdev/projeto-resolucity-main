import { Router } from 'express';
import authController from '../controllers/authController.js';

const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login',    authController.login);
authRoutes.post('/logout',   authController.logout);
authRoutes.get('/me',        authController.me);
authRoutes.get('/',          authController.listUsers);

export default authRoutes;
