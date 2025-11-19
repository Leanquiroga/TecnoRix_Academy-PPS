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
  replaceQuizQuestions,
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
  replaceQuestions: (quizId: string, questions: CreateQuizInput['questions']) => Promise<QuizWithQuestions>
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
      // Filtrar quizzes eliminados (soft delete)
      const active = (res.data || []).filter(q => !q.deleted_at)
      set(state => ({
        quizzesByCourse: { ...state.quizzesByCourse, [courseId]: active },
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
    const quiz = res.data
    if (quiz && !quiz.deleted_at) {
      set(state => {
        const list = state.quizzesByCourse[payload.course_id] || []
        return {
          quizzesByCourse: {
            ...state.quizzesByCourse,
            [payload.course_id]: [...list, quiz].sort((a, b) => a.order_index - b.order_index),
          },
        }
      })
    }
    return quiz
  },
  updateQuiz: async (quizId: string, payload: UpdateQuizInput) => {
    const res = await updateQuiz(quizId, payload)
    const updated = res.data
    set(state => {
      // Actualizar lista si el quiz pertenece a alguna colección cargada
      const courseId = (updated as any).course_id
      if (courseId && state.quizzesByCourse[courseId]) {
        const replaced = state.quizzesByCourse[courseId]
          .filter(q => q.id !== quizId && !q.deleted_at)
        const next = updated.deleted_at ? replaced : [...replaced, updated].sort((a, b) => a.order_index - b.order_index)
        return {
          currentQuiz: updated,
          quizzesByCourse: { ...state.quizzesByCourse, [courseId]: next },
        }
      }
      return { currentQuiz: updated }
    })
    return res.data
  },
  deleteQuiz: async (quizId: string) => {
    const current = get().currentQuiz
    await deleteQuiz(quizId)
    // Si el backend retorna success sin data, recargar curso; asumimos ahora retorna data con deleted_at
    if (current && current.id === quizId) {
      set({ currentQuiz: null })
    }
    // Remover de listas
    set(state => {
      const updatedCollections: Record<string, QuizWithQuestions[]> = {}
      for (const [cid, list] of Object.entries(state.quizzesByCourse)) {
        updatedCollections[cid] = list.filter(q => q.id !== quizId && !q.deleted_at)
      }
      return { quizzesByCourse: updatedCollections }
    })
  },
  replaceQuestions: async (quizId: string, questions: CreateQuizInput['questions']) => {
    const res = await replaceQuizQuestions(quizId, questions)
    const replaced = res.data as unknown as QuizWithQuestions
    set(state => {
      const courseId = (replaced as any).course_id
      if (courseId && state.quizzesByCourse[courseId]) {
        const list = state.quizzesByCourse[courseId].filter(q => q.id !== quizId && !q.deleted_at)
        return {
          currentQuiz: replaced,
          quizzesByCourse: { ...state.quizzesByCourse, [courseId]: [...list, replaced].sort((a, b) => a.order_index - b.order_index) },
        }
      }
      return { currentQuiz: replaced }
    })
    return res.data as unknown as QuizWithQuestions
  },
}))
