import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authMiddleware, checkRole } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);

// Rutas protegidas
router.get('/me', authMiddleware, AuthController.me);

// Ruta de admin para aprobar profesores (ejemplo)
router.put('/users/:id/approve', 
  authMiddleware,
  checkRole(['admin']),
  AuthController.approveTeacher
);

export default router;