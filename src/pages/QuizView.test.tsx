import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import QuizView from './QuizView'

// Mock inscripciones con estado mutable
let mockMyCourses: any[] = []
vi.mock('../store/enrollment.store', () => ({
  useEnrollmentStore: () => ({ myCourses: mockMyCourses }),
}))

const loadQuizMock = vi.fn().mockResolvedValue(undefined)
const startAttemptMock = vi.fn().mockResolvedValue(undefined)

vi.mock('../store/quiz.store', () => {
  return {
    useQuizStore: () => ({
      currentQuiz: {
        id: 'quiz-1',
        course_id: 'course-1',
        title: 'Quiz Demo',
        description: null,
        passing_score: 60,
        time_limit_minutes: null,
        max_attempts: null,
        order_index: 0,
        created_at: '',
        updated_at: '',
        questions: [
          { id: 'q1', quiz_id: 'quiz-1', question_text: 'Pregunta 1', type: 'multiple_choice', points: 1, order_index: 1, explanation: null, created_at: '', updated_at: '', deleted_at: null,
            options: [
              { id: 'o1', question_id: 'q1', option_text: 'A', is_correct: false, order_index: 1, created_at: '', updated_at: '' },
              { id: 'o2', question_id: 'q1', option_text: 'B', is_correct: true, order_index: 2, created_at: '', updated_at: '' },
            ]
          },
        ],
      },
      currentAttempt: null,
      currentAttemptDetails: null,
      tempAnswers: {},
      loading: false,
      error: null,
      loadQuiz: loadQuizMock,
      startAttempt: startAttemptMock,
      selectAnswer: vi.fn(),
      submitAttempt: vi.fn(),
    }),
  }
})

function renderWithRoute(path: string, element: React.ReactNode) {
  const router = createMemoryRouter(
    [
      { path, element },
    ],
    { initialEntries: [path.replace(':quizId', 'quiz-1')] }
  )
  return render(<RouterProvider router={router} />)
}

describe('QuizView', () => {
  beforeEach(() => {
    vi.resetModules()
    mockMyCourses = []
  })

  it('no inicia intento automáticamente y muestra botón Comenzar intento (no inscrito)', async () => {
    renderWithRoute('/quizzes/:quizId', <QuizView />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /comenzar intento/i })).toBeInTheDocument()
    })

    // Button debe estar deshabilitado si no está inscrito
    expect(screen.getByRole('button', { name: /comenzar intento/i })).toBeDisabled()
  })

  it('inicia intento al hacer clic cuando está inscrito', async () => {
    // Simular inscripción
    mockMyCourses = [{ id: 'enr1', course_id: 'course-1' }]

    renderWithRoute('/quizzes/:quizId', <QuizView />)

    const btn = await screen.findByRole('button', { name: /comenzar intento/i })
    expect(btn).not.toBeDisabled()

    const user = userEvent.setup()
    await user.click(btn)

    await waitFor(() => {
      expect(startAttemptMock).toHaveBeenCalled()
    })
  })

  it('muestra error si startAttempt falla (403, no inscrito)', async () => {
    // Simular inscripción y startAttempt que falla
    mockMyCourses = [{ id: 'enr1', course_id: 'course-1' }]
    const err: any = new Error('Debes estar inscrito en el curso para tomar el quiz')
    err.response = { data: { error: 'Debes estar inscrito en el curso para tomar el quiz' } }
    startAttemptMock.mockRejectedValueOnce(err)

    renderWithRoute('/quizzes/:quizId', <QuizView />)

    const btn = await screen.findByRole('button', { name: /comenzar intento/i })
    const user = userEvent.setup()
    await user.click(btn)

    await waitFor(() => {
      expect(screen.getByText(/debes estar inscrito en el curso/i)).toBeInTheDocument()
    })
  })

  it('muestra navegación entre preguntas cuando hay intento activo', async () => {
    mockMyCourses = [{ id: 'enr1', course_id: 'course-1' }]

    // Mock con intento activo y múltiples preguntas
    vi.mock('../store/quiz.store', () => ({
      useQuizStore: () => ({
        currentQuiz: {
          id: 'quiz-1',
          course_id: 'course-1',
          title: 'Quiz Demo',
          passing_score: 60,
          time_limit_minutes: null,
          questions: [
            { id: 'q1', question_text: 'Pregunta 1', type: 'multiple_choice', options: [{ id: 'o1', option_text: 'A' }] },
            { id: 'q2', question_text: 'Pregunta 2', type: 'multiple_choice', options: [{ id: 'o2', option_text: 'B' }] },
          ],
        },
        currentAttempt: { id: 'att-1', quiz_id: 'quiz-1', student_id: 's1' },
        tempAnswers: {},
        loading: false,
        error: null,
        loadQuiz: vi.fn(),
        startAttempt: vi.fn(),
        selectAnswer: vi.fn(),
        submitAttempt: vi.fn(),
      }),
    }))

    renderWithRoute('/quizzes/:quizId', <QuizView />)

    await waitFor(() => {
      expect(screen.getByText('Pregunta 1')).toBeInTheDocument()
    })

    // Debe haber botones de navegación
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled() // Primera pregunta
  })

  it('muestra botón Enviar Quiz en última pregunta', async () => {
    mockMyCourses = [{ id: 'enr1', course_id: 'course-1' }]

    vi.mock('../store/quiz.store', () => ({
      useQuizStore: () => ({
        currentQuiz: {
          id: 'quiz-1',
          course_id: 'course-1',
          title: 'Quiz Demo',
          passing_score: 60,
          time_limit_minutes: null,
          questions: [
            { id: 'q1', question_text: 'Pregunta 1', type: 'multiple_choice', options: [{ id: 'o1', option_text: 'A' }] },
          ],
        },
        currentAttempt: { id: 'att-1', quiz_id: 'quiz-1', student_id: 's1' },
        tempAnswers: { q1: 'o1' },
        loading: false,
        error: null,
        loadQuiz: vi.fn(),
        startAttempt: vi.fn(),
        selectAnswer: vi.fn(),
        submitAttempt: vi.fn(),
      }),
    }))

    renderWithRoute('/quizzes/:quizId', <QuizView />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enviar quiz/i })).toBeInTheDocument()
    })
  })
})
