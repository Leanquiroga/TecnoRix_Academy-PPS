/**
 * Rutas para el sistema de quizzes y evaluaciones
 */

import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import * as QuizController from '../controllers/quiz.controller'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// Gestión de quizzes
router.post('/courses/:courseId/quizzes', QuizController.createQuizController)
router.get('/courses/:courseId/quizzes', QuizController.listQuizzesController)
router.get('/quizzes/:quizId', QuizController.getQuizController)
router.put('/quizzes/:quizId', QuizController.updateQuizController)
router.put('/quizzes/:quizId/questions', QuizController.updateQuizQuestionsController)
router.delete('/quizzes/:quizId', QuizController.deleteQuizController)

// Intentos de quizzes
router.post('/quizzes/:quizId/start', QuizController.startQuizAttemptController)
router.post('/quiz-attempts/:attemptId/submit', QuizController.submitQuizController)
router.get('/quizzes/:quizId/attempts', QuizController.getQuizAttemptsController)
router.get('/quiz-attempts/:attemptId', QuizController.getQuizAttemptController)

// Estadísticas (solo profesores/admin)
router.get('/quizzes/:quizId/statistics', QuizController.getQuizStatisticsController)

export default router
