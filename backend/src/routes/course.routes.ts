import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { createCourseController, getPublicCoursesController, getCourseByIdController, updateCourseController, deleteCourseController } from '../controllers/course.controller'

const router = Router()

// Públicas: listar cursos aprobados
router.get('/', getPublicCoursesController)
router.get('/:id', getCourseByIdController)

// Privadas: crear curso (solo teacher aprobado, validado en service)
router.post('/', authMiddleware, createCourseController)
router.put('/:id', authMiddleware, updateCourseController)
router.delete('/:id', authMiddleware, deleteCourseController)

export default router
