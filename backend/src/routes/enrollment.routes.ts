import { Router } from 'express'
import { EnrollmentController } from '../controllers/enrollment.controller'
import { authMiddleware } from '../middleware/auth'
import { authorizeRoles } from '../middleware/roles'
import { UserRole } from '../types/auth.types'

const router = Router()

/**
 * @route POST /api/enrollments
 * @desc Inscribir a un estudiante en un curso
 * @access Private (Student)
 */
router.post('/', authMiddleware, authorizeRoles(UserRole.STUDENT), EnrollmentController.enrollStudent)

/**
 * @route GET /api/enrollments/my-courses
 * @desc Obtener cursos del estudiante autenticado
 * @access Private (Student)
 */
router.get('/my-courses', authMiddleware, authorizeRoles(UserRole.STUDENT), EnrollmentController.getMyCourses)

/**
 * @route GET /api/enrollments/stats/student
 * @desc Obtener estadísticas del estudiante
 * @access Private (Student)
 */
router.get('/stats/student', authMiddleware, authorizeRoles(UserRole.STUDENT), EnrollmentController.getStudentStats)

/**
 * @route GET /api/enrollments/:id
 * @desc Obtener detalles de una inscripción específica
 * @access Private (Student, Teacher)
 */
router.get('/:id', authMiddleware, EnrollmentController.getEnrollment)

/**
 * @route PUT /api/enrollments/:id/progress
 * @desc Actualizar progreso de una inscripción
 * @access Private (Student)
 */
router.put('/:id/progress', authMiddleware, authorizeRoles(UserRole.STUDENT), EnrollmentController.updateProgress)

/**
 * @route DELETE /api/enrollments/:id
 * @desc Cancelar una inscripción
 * @access Private (Student)
 */
router.delete('/:id', authMiddleware, authorizeRoles(UserRole.STUDENT), EnrollmentController.cancelEnrollment)

export default router
