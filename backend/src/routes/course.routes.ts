import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { createCourseController, getPublicCoursesController, getCourseByIdController, updateCourseController, deleteCourseController, getCourseMaterialsController } from '../controllers/course.controller'

const router = Router()

// Públicas: listar cursos aprobados
router.get('/', getPublicCoursesController)
router.get('/:id', getCourseByIdController)
router.get('/:id/materials', getCourseMaterialsController)

// Privadas: crear curso (solo teacher aprobado, validado en service)
router.post('/', authMiddleware, createCourseController)
router.put('/:id', authMiddleware, updateCourseController)
router.delete('/:id', authMiddleware, deleteCourseController)

export default router
