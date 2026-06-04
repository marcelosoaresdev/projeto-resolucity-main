import { Router } from 'express';
import authController from '../controllers/authController.js';

const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login',    authController.login);
authRoutes.post('/logout',   authController.logout);
authRoutes.get('/me',        authController.me);
authRoutes.get('/profile',   authController.getProfile);
authRoutes.put('/profile',   authController.updateProfile);
authRoutes.get('/',           authController.listUsers);
authRoutes.get('/confirm/:token', authController.confirm); // NOVO

export default authRoutes;
