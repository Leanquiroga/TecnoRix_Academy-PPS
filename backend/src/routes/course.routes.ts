import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { authorizeRoles } from '../middleware/roles'
import { UserRole } from '../types/auth.types'
import { createCourseController, getPublicCoursesController, getCourseByIdController, updateCourseController, deleteCourseController, getCourseMaterialsController } from '../controllers/course.controller'
import { EnrollmentController } from '../controllers/enrollment.controller'

const router = Router()

// Públicas: listar cursos aprobados
router.get('/', getPublicCoursesController)
router.get('/:id', getCourseByIdController)
router.get('/:id/materials', getCourseMaterialsController)

// Obtener estudiantes de un curso (solo teacher)
router.get('/:courseId/students', authMiddleware, authorizeRoles(UserRole.TEACHER), EnrollmentController.getCourseStudents)

// Privadas: crear curso (solo teacher aprobado, validado en service)
router.post('/', authMiddleware, createCourseController)
router.put('/:id', authMiddleware, updateCourseController)
router.delete('/:id', authMiddleware, deleteCourseController)

export default router
