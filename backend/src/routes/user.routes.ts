import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { updateProfile, activitySummary } from '../controllers/user.controller'

const router = Router()

router.put('/profile', authMiddleware, updateProfile)
router.get('/activity', authMiddleware, activitySummary)

export default router
