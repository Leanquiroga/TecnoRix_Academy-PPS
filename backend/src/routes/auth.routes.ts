import { Router } from 'express'
import { login, me, refresh, register, forgotPassword, resetPassword } from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', authMiddleware, me)
router.post('/refresh', authMiddleware, refresh)

// Password recovery - FASE 6.6
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

export default router
