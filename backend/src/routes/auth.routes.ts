import { Router } from 'express'
import { login, me, refresh, register } from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', authMiddleware, me)
router.post('/refresh', authMiddleware, refresh)

export default router
