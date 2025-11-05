import { create } from 'zustand'
import { 
  getQuiz,
  getQuizzesByCourse,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizAttempts,
  getAttemptDetails,
  getQuizStatistics,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from '../api/quiz.service'
import type {
  QuizWithQuestions,
  QuizWithQuestionsPublic,
  QuizAttempt,
  QuizAttemptWithDetails,
  QuizStatistics,
  CreateQuizInput,
  UpdateQuizInput,
  TempQuizAnswers,
} from '../types/quiz.types'

interface QuizState {
  // Estado
  quizzesByCourse: Record<string, QuizWithQuestions[]>
  currentQuiz: QuizWithQuestions | QuizWithQuestionsPublic | null  // Puede ser con o sin respuestas correctas
  currentAttempt: QuizAttempt | null
  currentAttemptDetails: QuizAttemptWithDetails | null
  tempAnswers: TempQuizAnswers
  statistics: Record<string, QuizStatistics>
  loading: boolean
  error: string | null

  // Acciones
  loadQuizzesByCourse: (courseId: string) => Promise<void>
  loadQuiz: (quizId: string) => Promise<void>
  startAttempt: (quizId: string) => Promise<void>
  selectAnswer: (questionId: string, optionId: string | string[]) => void
  submitAttempt: () => Promise<void>
  listAttempts: (quizId: string) => Promise<QuizAttempt[]>
  fetchAttemptDetails: (attemptId: string) => Promise<void>
  fetchStatistics: (quizId: string) => Promise<void>
  resetCurrent: () => void
  clearError: () => void

  // Teacher/admin
  createQuiz: (payload: CreateQuizInput) => Promise<QuizWithQuestions>
  updateQuiz: (quizId: string, payload: UpdateQuizInput) => Promise<QuizWithQuestions>
  deleteQuiz: (quizId: string) => Promise<void>
}

export const useQuizStore = create<QuizState>((set, get) => ({
  quizzesByCourse: {},
  currentQuiz: null,
  currentAttempt: null,
  currentAttemptDetails: null,
  tempAnswers: {},
  statistics: {},
  loading: false,
  error: null,

  loadQuizzesByCourse: async (courseId: string) => {
    try {
      set({ loading: true, error: null })
      const res = await getQuizzesByCourse(courseId)
      set(state => ({
        quizzesByCourse: { ...state.quizzesByCourse, [courseId]: res.data },
        loading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar quizzes'
      set({ error: message, loading: false })
      throw err
    }
  },

  loadQuiz: async (quizId: string) => {
    try {
      set({ loading: true, error: null })
      const res = await getQuiz(quizId)
      set({ currentQuiz: res.data, loading: false, tempAnswers: {}, currentAttempt: null, currentAttemptDetails: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar quiz'
      set({ error: message, loading: false, currentQuiz: null })
      throw err
    }
  },

  startAttempt: async (quizId: string) => {
    try {
      set({ loading: true, error: null })
      const res = await startQuizAttempt(quizId)
      
      set({ currentAttempt: res.data.attempt, currentQuiz: res.data.quiz, loading: false, tempAnswers: {} })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar intento'
      set({ error: message, loading: false })
      throw err
    }
  },

  selectAnswer: (questionId, optionId) => {
    set(state => ({ tempAnswers: { ...state.tempAnswers, [questionId]: optionId } }))
  },

  submitAttempt: async () => {
    const attempt = get().currentAttempt
    const quiz = get().currentQuiz
    if (!attempt || !quiz) {
      throw new Error('No hay intento activo para enviar')
    }
    try {
      set({ loading: true, error: null })
      const answers = quiz.questions.map(q => {
        const selected = get().tempAnswers[q.id]
        return {
          question_id: q.id,
          selected_option_id: Array.isArray(selected) ? selected[0] : selected,
        }
      }).filter(a => !!a.selected_option_id)

      const res = await submitQuizAttempt(attempt.id, { answers })
      set({ currentAttemptDetails: res.data, currentAttempt: res.data, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar intento'
      set({ error: message, loading: false })
      throw err
    }
  },

  listAttempts: async (quizId: string) => {
    const res = await getQuizAttempts(quizId)
    return res.data
  },

  fetchAttemptDetails: async (attemptId: string) => {
    try {
      set({ loading: true, error: null })
      const res = await getAttemptDetails(attemptId)
      set({ currentAttemptDetails: res.data, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener detalles del intento'
      set({ error: message, loading: false })
      throw err
    }
  },

  fetchStatistics: async (quizId: string) => {
    try {
      set({ loading: true, error: null })
      const res = await getQuizStatistics(quizId)
      set(state => ({ statistics: { ...state.statistics, [quizId]: res.data }, loading: false }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener estadísticas'
      set({ error: message, loading: false })
      throw err
    }
  },

  resetCurrent: () => set({ currentQuiz: null, currentAttempt: null, currentAttemptDetails: null, tempAnswers: {} }),
  clearError: () => set({ error: null }),

  // Teacher/admin
  createQuiz: async (payload: CreateQuizInput) => {
    const res = await createQuiz(payload)
    return res.data
  },
  updateQuiz: async (quizId: string, payload: UpdateQuizInput) => {
    const res = await updateQuiz(quizId, payload)
    set({ currentQuiz: res.data })
    return res.data
  },
  deleteQuiz: async (quizId: string) => {
    await deleteQuiz(quizId)
  },
}))
