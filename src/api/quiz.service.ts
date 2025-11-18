/**
 * Servicio para manejar operaciones de Quizzes
 */

import { http } from './http'
import type {
  CreateQuizInput,
  CreateQuizResponse,
  GetQuizResponse,
  ListQuizzesResponse,
  StartQuizAttemptResponse,
  SubmitQuizInput,
  SubmitQuizResponse,
  GetAttemptsResponse,
  GetAttemptDetailsResponse,
  GetStatisticsResponse,
  UpdateQuizInput,
  CreateQuestionInput,
} from '../types/quiz.types'

/**
 * Obtener todos los quizzes de un curso
 */
export const getQuizzesByCourse = async (courseId: string): Promise<ListQuizzesResponse> => {
  const response = await http.get(`/courses/${courseId}/quizzes`)
  return response.data
}

/**
 * Obtener un quiz específico con sus preguntas
 */
export const getQuiz = async (quizId: string): Promise<GetQuizResponse> => {
  const response = await http.get(`/quizzes/${quizId}`)
  return response.data
}

/**
 * Crear un nuevo quiz (teacher/admin)
 */
export const createQuiz = async (data: CreateQuizInput): Promise<CreateQuizResponse> => {
  const response = await http.post(`/courses/${data.course_id}/quizzes`, data)
  return response.data
}

/**
 * Actualizar un quiz existente (teacher/admin)
 */
export const updateQuiz = async (quizId: string, data: UpdateQuizInput): Promise<GetQuizResponse> => {
  const response = await http.put(`/quizzes/${quizId}`, data)
  return response.data
}

/**
 * Reemplazar todas las preguntas de un quiz (teacher/admin)
 */
export const replaceQuizQuestions = async (
  quizId: string,
  questions: CreateQuestionInput[]
): Promise<GetQuizResponse> => {
  const response = await http.put(`/quizzes/${quizId}/questions`, { questions })
  return response.data
}

/**
 * Eliminar un quiz (soft delete - teacher/admin)
 */
export const deleteQuiz = async (quizId: string): Promise<{ success: boolean; message: string }> => {
  const response = await http.delete(`/quizzes/${quizId}`)
  return response.data
}

/**
 * Iniciar un nuevo intento de quiz (student)
 */
export const startQuizAttempt = async (quizId: string): Promise<StartQuizAttemptResponse> => {
  const response = await http.post(`/quizzes/${quizId}/start`)
  return response.data
}

/**
 * Enviar respuestas y finalizar intento de quiz (student)
 */
export const submitQuizAttempt = async (
  attemptId: string,
  data: SubmitQuizInput
): Promise<SubmitQuizResponse> => {
  const response = await http.post(`/quiz-attempts/${attemptId}/submit`, data)
  return response.data
}

/**
 * Obtener historial de intentos de un quiz (student ve sus intentos, teacher/admin ven todos)
 */
export const getQuizAttempts = async (quizId: string): Promise<GetAttemptsResponse> => {
  const response = await http.get(`/quizzes/${quizId}/attempts`)
  return response.data
}

/**
 * Obtener detalles de un intento específico con respuestas
 */
export const getAttemptDetails = async (attemptId: string): Promise<GetAttemptDetailsResponse> => {
  const response = await http.get(`/quiz-attempts/${attemptId}`)
  return response.data
}

/**
 * Obtener estadísticas de un quiz (teacher/admin)
 */
export const getQuizStatistics = async (quizId: string): Promise<GetStatisticsResponse> => {
  const response = await http.get(`/quizzes/${quizId}/statistics`)
  return response.data
}

/**
 * Verificar si el estudiante puede realizar un nuevo intento
 */
export const canAttemptQuiz = async (quizId: string): Promise<{
  can_attempt: boolean
  attempts_count: number
  max_attempts?: number
  reason?: string
}> => {
  try {
    const attemptsResponse = await getQuizAttempts(quizId)
    const quizResponse = await getQuiz(quizId)
    
    const attempts = attemptsResponse.data
    const quiz = quizResponse.data
    
    const attemptsCount = attempts.length
    const maxAttempts = quiz.max_attempts
    
    // Si no hay límite de intentos
    if (!maxAttempts) {
      return {
        can_attempt: true,
        attempts_count: attemptsCount,
      }
    }
    
    // Si alcanzó el máximo de intentos
    if (attemptsCount >= maxAttempts) {
      return {
        can_attempt: false,
        attempts_count: attemptsCount,
        max_attempts: maxAttempts,
        reason: `Has alcanzado el máximo de intentos (${maxAttempts})`,
      }
    }
    
    return {
      can_attempt: true,
      attempts_count: attemptsCount,
      max_attempts: maxAttempts,
    }
  } catch (error) {
    console.error('Error al verificar intentos:', error)
    throw error
  }
}

const quizService = {
  getQuizzesByCourse,
  getQuiz,
  createQuiz,
  updateQuiz,
  replaceQuizQuestions,
  deleteQuiz,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizAttempts,
  getAttemptDetails,
  getQuizStatistics,
  canAttemptQuiz,
}

export default quizService
