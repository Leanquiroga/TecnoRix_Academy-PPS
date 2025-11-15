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

  expect(screen.getByLabelText(/^título/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/passing score/i)).toBeInTheDocument()
  })

  it('permite agregar una pregunta', async () => {
    renderWithRoute('/teacher/courses/:id/quizzes/create', <CreateQuizPage />)

    const user = userEvent.setup()
    const addQuestionBtn = screen.getByRole('button', { name: /agregar pregunta/i })
    await user.click(addQuestionBtn)

    await waitFor(() => {
      expect(screen.getByLabelText(/pregunta 1/i)).toBeInTheDocument()
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
    const titleInput = screen.getByLabelText(/^título/i)
    await user.type(titleInput, 'Quiz de Prueba')

    // Llenar puntaje de aprobación
  const passingScoreInput = screen.getByLabelText(/passing score/i)
    await user.clear(passingScoreInput)
    await user.type(passingScoreInput, '70')

    // Llenar texto de pregunta (Pregunta 1 por defecto)
    const questionInput = screen.getByLabelText(/pregunta 1/i)
    await user.type(questionInput, '¿Cuál es la respuesta correcta?')

    // Completar textos de opciones mínimas de Pregunta 1
    const optionInputs = screen.getAllByLabelText(/opción \d+/i)
    expect(optionInputs.length).toBeGreaterThanOrEqual(2)
    await user.type(optionInputs[0], 'Opción A')
    await user.type(optionInputs[1], 'Opción B')

    // Asegurar una opción correcta marcada (usar el primer botón "Correcta")
    const correctButtons = screen.getAllByRole('button', { name: /correcta/i })
    if (correctButtons.length > 0) {
      await user.click(correctButtons[0])
    }

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
    const titleInput = screen.getByLabelText(/^título/i)
    await user.type(titleInput, 'Quiz de Prueba')

    // Pregunta 1 válida
    const questionInput = screen.getByLabelText(/pregunta 1/i)
    await user.type(questionInput, '¿Cuál es la capital de Francia?')

    const optionInputs = screen.getAllByLabelText(/opción \d+/i)
    expect(optionInputs.length).toBeGreaterThanOrEqual(2)
    await user.type(optionInputs[0], 'París')
    await user.type(optionInputs[1], 'Lyon')

    // Marcar correcta
    const correctButtons = screen.getAllByRole('button', { name: /correcta/i })
    if (correctButtons.length > 0) {
      await user.click(correctButtons[0])
    }

    const submitBtn = screen.getByRole('button', { name: /crear quiz/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/error al crear quiz|no se pudo crear el quiz/i)).toBeInTheDocument()
    })
  })

  it('permite marcar una opción como correcta', async () => {
    renderWithRoute('/teacher/courses/:id/quizzes/create', <CreateQuizPage />)

    const user = userEvent.setup()

    // Agregar pregunta
    const addQuestionBtn = screen.getByRole('button', { name: /agregar pregunta/i })
    await user.click(addQuestionBtn)

    // Agregar opciones
  // Hay un botón "Agregar opción" por pregunta; usamos el primero
  const addOptionBtns = screen.getAllByRole('button', { name: /agregar opción/i })
  await user.click(addOptionBtns[0])

    // Click en botón "Correcta" de la primera opción
    const correctButtons = screen.getAllByRole('button', { name: /correcta/i })
    await user.click(correctButtons[0])

    // Aserciones ligeras: el primero queda "contained" y los demás "outlined"
    expect(correctButtons[0].className).toMatch(/MuiButton-contained/)
    if (correctButtons[1]) {
      expect(correctButtons[1].className).toMatch(/MuiButton-outlined/)
    }
  })

  it('permite configurar tiempo límite del quiz', async () => {
    renderWithRoute('/teacher/courses/:id/quizzes/create', <CreateQuizPage />)

  const timeLimitInput = screen.getByLabelText(/time limit/i)
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
      expect(screen.getByLabelText(/pregunta 2/i)).toBeInTheDocument()
    })

  // Buscar y hacer clic en botón eliminar de esa pregunta
  const deleteBtns = screen.getAllByRole('button', { name: /eliminar pregunta/i })
  // Eliminar la segunda pregunta (último botón)
  await user.click(deleteBtns[deleteBtns.length - 1])

    await waitFor(() => {
      expect(screen.queryByLabelText(/pregunta 2/i)).not.toBeInTheDocument()
    })
  })
})
