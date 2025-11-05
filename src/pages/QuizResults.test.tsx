import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import QuizResults from './QuizResults'

// Mock store con estado mutable para poder inyectar detalles por prueba
let mockAttemptDetails: any = null
const fetchAttemptDetails = vi.fn()
vi.mock('../store/quiz.store', () => ({
  useQuizStore: () => ({
    currentAttemptDetails: mockAttemptDetails,
    loading: false,
    error: null,
    fetchAttemptDetails,
  }),
}))

// Helper para renderizar con ruta
function renderWithRoute(path: string, element: React.ReactNode) {
  const router = createMemoryRouter(
    [
      { path, element },
    ],
    { initialEntries: [path.replace(':attemptId', 'attempt-1')] }
  )
  return render(<RouterProvider router={router} />)
}

// Utilidad para sobrescribir temporalmente el estado del store mockeado
function setAttemptDetails(details: any) {
  mockAttemptDetails = details
}

describe('QuizResults', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('muestra respuestas seleccionadas y correctas cuando corresponde', async () => {
    const details = {
      id: 'attempt-1',
      score: 1,
      total_points: 2,
      percentage: 50,
      passed: false,
      quiz: { id: 'quiz-1', title: 'Quiz Demo', passing_score: 70 },
      answers: [
        {
          id: 'ans-1',
          question_id: 'q1',
          is_correct: true,
          points_earned: 1,
          question: { id: 'q1', question_text: 'Pregunta 1', type: 'multiple_choice', points: 1, explanation: 'Expl 1' },
          selected_option: { id: 'o1', option_text: 'Opción A', is_correct: true },
          correct_option: { id: 'o1', option_text: 'Opción A', is_correct: true },
        },
        {
          id: 'ans-2',
          question_id: 'q2',
          is_correct: false,
          points_earned: 0,
          question: { id: 'q2', question_text: 'Pregunta 2', type: 'multiple_choice', points: 1, explanation: null },
          selected_option: { id: 'o3', option_text: 'Opción C', is_correct: false },
          correct_option: { id: 'o2', option_text: 'Opción B', is_correct: true },
        },
      ],
    }

    setAttemptDetails(details)

    renderWithRoute('/quiz-attempts/:attemptId', <QuizResults />)

    await waitFor(() => {
      expect(screen.getByText(/resultados del quiz/i)).toBeInTheDocument()
    })

    // Cabecera de puntaje
    expect(screen.getByText(/puntaje:/i)).toBeInTheDocument()

  // Respuesta correcta (no debe duplicar ni romper)
    expect(screen.getByText('Pregunta 1')).toBeInTheDocument()
    expect(screen.getByText(/tu respuesta: opción a/i)).toBeInTheDocument()

    // Respuesta incorrecta muestra correcta
    expect(screen.getByText('Pregunta 2')).toBeInTheDocument()
    expect(screen.getByText(/tu respuesta: opción c/i)).toBeInTheDocument()
    expect(screen.getByText(/respuesta correcta: opción b/i)).toBeInTheDocument()
  })
})
