import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { authorizeRoles } from '../middleware/roles'
import { UserRole } from '../types/auth.types'
import { getPendingCoursesController, approveCourseController, rejectCourseController } from '../controllers/course.controller'

const router = Router()

router.use(authMiddleware)
router.use(authorizeRoles(UserRole.ADMIN))

router.get('/pending', getPendingCoursesController)
router.put('/:id/approve', approveCourseController)
router.put('/:id/reject', rejectCourseController)

export default router
