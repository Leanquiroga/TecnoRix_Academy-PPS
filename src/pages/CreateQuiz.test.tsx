import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import CreateQuizPage from './CreateQuiz'

const createQuizMock = vi.fn()
const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: 'course-1' }),
  }
})

vi.mock('../store/quiz.store', () => ({
  useQuizStore: () => ({
    createQuiz: createQuizMock,
    loading: false,
    error: null,
  }),
}))

function renderWithRoute(path: string, element: React.ReactNode) {
  const router = createMemoryRouter(
    [{ path, element }],
    { initialEntries: [path.replace(':id', 'course-1')] }
  )
  return render(<RouterProvider router={router} />)
}

describe('CreateQuiz', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza formulario de creación de quiz', () => {
    renderWithRoute('/teacher/courses/:id/quizzes/create', <CreateQuizPage />)

    expect(screen.getByLabelText(/título del quiz/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/puntaje de aprobación/i)).toBeInTheDocument()
  })

  it('permite agregar una pregunta', async () => {
    renderWithRoute('/teacher/courses/:id/quizzes/create', <CreateQuizPage />)

    const user = userEvent.setup()
    const addQuestionBtn = screen.getByRole('button', { name: /agregar pregunta/i })
    await user.click(addQuestionBtn)

    await waitFor(() => {
      expect(screen.getByLabelText(/texto de la pregunta/i)).toBeInTheDocument()
    })
  })

  it('valida campos requeridos antes de enviar', async () => {
    renderWithRoute('/teacher/courses/:id/quizzes/create', <CreateQuizPage />)

    const user = userEvent.setup()
    const submitBtn = screen.getByRole('button', { name: /crear quiz/i })
    await user.click(submitBtn)

    // No debe llamar a createQuiz si faltan campos
    expect(createQuizMock).not.toHaveBeenCalled()
  })

  it('permite crear un quiz con preguntas y opciones', async () => {
    createQuizMock.mockResolvedValue({ id: 'quiz-1', title: 'Nuevo Quiz' })

    renderWithRoute('/teacher/courses/:id/quizzes/create', <CreateQuizPage />)

    const user = userEvent.setup()

    // Llenar título
    const titleInput = screen.getByLabelText(/título del quiz/i)
    await user.type(titleInput, 'Quiz de Prueba')

    // Llenar puntaje de aprobación
    const passingScoreInput = screen.getByLabelText(/puntaje de aprobación/i)
    await user.clear(passingScoreInput)
    await user.type(passingScoreInput, '70')

    // Agregar pregunta
    const addQuestionBtn = screen.getByRole('button', { name: /agregar pregunta/i })
    await user.click(addQuestionBtn)

    await waitFor(() => {
      expect(screen.getByLabelText(/texto de la pregunta/i)).toBeInTheDocument()
    })

    // Llenar texto de pregunta
    const questionInput = screen.getByLabelText(/texto de la pregunta/i)
    await user.type(questionInput, '¿Cuál es la respuesta correcta?')

    // Agregar opciones
    const addOptionBtn = screen.getByRole('button', { name: /agregar opción/i })
    await user.click(addOptionBtn)
    await user.click(addOptionBtn)

    await waitFor(() => {
      const optionInputs = screen.getAllByPlaceholderText(/opción/i)
      expect(optionInputs.length).toBeGreaterThanOrEqual(2)
    })

    // Enviar formulario
    const submitBtn = screen.getByRole('button', { name: /crear quiz/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(createQuizMock).toHaveBeenCalled()
    })
  })

  it('muestra error si la creación falla', async () => {
    createQuizMock.mockRejectedValue(new Error('Error al crear quiz'))

    renderWithRoute('/teacher/courses/:id/quizzes/create', <CreateQuizPage />)

    const user = userEvent.setup()

    // Llenar campos mínimos
    const titleInput = screen.getByLabelText(/título del quiz/i)
    await user.type(titleInput, 'Quiz de Prueba')

    const submitBtn = screen.getByRole('button', { name: /crear quiz/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('permite marcar una opción como correcta', async () => {
    renderWithRoute('/teacher/courses/:id/quizzes/create', <CreateQuizPage />)

    const user = userEvent.setup()

    // Agregar pregunta
    const addQuestionBtn = screen.getByRole('button', { name: /agregar pregunta/i })
    await user.click(addQuestionBtn)

    // Agregar opciones
    const addOptionBtn = screen.getByRole('button', { name: /agregar opción/i })
    await user.click(addOptionBtn)

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })

    // Marcar primera opción como correcta
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])

    expect(checkboxes[0]).toBeChecked()
  })

  it('permite configurar tiempo límite del quiz', async () => {
    renderWithRoute('/teacher/courses/:id/quizzes/create', <CreateQuizPage />)

    const timeLimitInput = screen.getByLabelText(/tiempo límite.*minutos/i)
    expect(timeLimitInput).toBeInTheDocument()

    const user = userEvent.setup()
    await user.type(timeLimitInput, '30')

    expect(timeLimitInput).toHaveValue(30)
  })

  it('permite eliminar una pregunta agregada', async () => {
    renderWithRoute('/teacher/courses/:id/quizzes/create', <CreateQuizPage />)

    const user = userEvent.setup()

    // Agregar pregunta
    const addQuestionBtn = screen.getByRole('button', { name: /agregar pregunta/i })
    await user.click(addQuestionBtn)

    await waitFor(() => {
      expect(screen.getByLabelText(/texto de la pregunta/i)).toBeInTheDocument()
    })

    // Buscar y hacer clic en botón eliminar
    const deleteBtn = screen.getByRole('button', { name: /eliminar pregunta/i })
    await user.click(deleteBtn)

    await waitFor(() => {
      expect(screen.queryByLabelText(/texto de la pregunta/i)).not.toBeInTheDocument()
    })
  })
})
