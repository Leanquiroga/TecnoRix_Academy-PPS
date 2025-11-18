import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EditQuizPage from './EditQuiz'
import { useQuizStore } from '../store/quiz.store'
import type { QuizWithQuestions, QuestionType } from '../types/quiz.types'

// Mock del store
vi.mock('../store/quiz.store', () => ({
  useQuizStore: vi.fn()
}))

// Mock de notificaciones
const mockNotify = vi.fn()
vi.mock('../hooks/useNotify', () => ({
  useNotify: () => mockNotify
}))

// Mock de react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: '1', quizId: '123' }),
    useNavigate: () => vi.fn()
  }
})

const mockQuiz: QuizWithQuestions = {
  id: '123',
  course_id: '1',
  title: 'Quiz Original',
  description: 'Descripción original',
  passing_score: 70,
  time_limit_minutes: 30,
  max_attempts: 3,
  order_index: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
  questions: [
    {
      id: 'q1',
      quiz_id: '123',
      question_text: '¿Pregunta 1?',
      type: 'multiple_choice' as QuestionType,
      points: 10,
      order_index: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      options: [
        {
          id: 'o1',
          question_id: 'q1',
          option_text: 'Opción A',
          is_correct: true,
          order_index: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'o2',
          question_id: 'q1',
          option_text: 'Opción B',
          is_correct: false,
          order_index: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
    }
  ]
}

const mockLoadQuiz = vi.fn()
const mockUpdateQuiz = vi.fn()
const mockReplaceQuestions = vi.fn()

const renderWithRoute = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('EditQuizPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock simplificado que solo retorna funciones
    ;(useQuizStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      quizzes: [mockQuiz],
      loadQuiz: mockLoadQuiz,
      updateQuiz: mockUpdateQuiz,
      replaceQuestions: mockReplaceQuestions,
      loading: false,
      error: null
    })
    
    mockLoadQuiz.mockResolvedValue(mockQuiz)
    mockUpdateQuiz.mockResolvedValue(undefined)
    mockReplaceQuestions.mockResolvedValue(undefined)
  })

  it('renderiza el formulario de edición', () => {
    renderWithRoute(<EditQuizPage />)
    
    expect(screen.getByText('Editar Quiz')).toBeInTheDocument()
    expect(screen.getByLabelText(/^título/i)).toBeInTheDocument()
  })
})
