import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from './SearchBar'
import type { CoursePublic } from '../../types/course'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockListPublicCourses = vi.fn()
vi.mock('../../api/course.service', () => ({
  listPublicCourses: () => mockListPublicCourses(),
}))

const mockCourses: CoursePublic[] = [
  {
    id: 'c1',
    title: 'React Fundamentals',
    description: 'Learn React basics',
    category: 'Frontend',
    level: 'beginner',
    price: null,
    instructor_name: 'Teacher One',
    thumbnail_url: '',
    teacher_id: 't1',
  },
  {
    id: 'c2',
    title: 'Advanced TypeScript',
    description: 'Master TypeScript advanced features',
    category: 'Backend',
    level: 'advanced',
    price: 50,
    instructor_name: 'Teacher One',
    thumbnail_url: '',
    teacher_id: 't1',
  },
]

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListPublicCourses.mockResolvedValue(mockCourses)
  })

  it('renderiza el input con placeholder por defecto', () => {
    render(<SearchBar />)
    expect(screen.getByPlaceholderText('Buscar cursos...')).toBeInTheDocument()
  })

  it('renderiza con placeholder personalizado', () => {
    render(<SearchBar placeholder="Buscar..." />)
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()
  })

  it('muestra resultados cuando el usuario escribe (min 2 caracteres)', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)

    const input = screen.getByPlaceholderText('Buscar cursos...')
    await user.type(input, 'React')

    await waitFor(() => {
      expect(mockListPublicCourses).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByText('React Fundamentals')).toBeInTheDocument()
    })
  })

  it('filtra resultados por título, descripción y categoría', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)

    const input = screen.getByPlaceholderText('Buscar cursos...')
    
    // Buscar por título
    await user.type(input, 'TypeScript')
    await waitFor(() => {
      expect(screen.getByText('Advanced TypeScript')).toBeInTheDocument()
    })
    expect(screen.queryByText('React Fundamentals')).not.toBeInTheDocument()
  })

  it('navega al curso cuando se selecciona un resultado', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)

    const input = screen.getByPlaceholderText('Buscar cursos...')
    await user.type(input, 'React')

    await waitFor(() => {
      expect(screen.getByText('React Fundamentals')).toBeInTheDocument()
    })

    const courseButton = screen.getByRole('button', { name: /react fundamentals/i })
    await user.click(courseButton)

    expect(mockNavigate).toHaveBeenCalledWith('/courses/c1')
  })

  it('muestra mensaje cuando no hay resultados', async () => {
    mockListPublicCourses.mockResolvedValue([])
    const user = userEvent.setup()
    render(<SearchBar />)

    const input = screen.getByPlaceholderText('Buscar cursos...')
    await user.type(input, 'XYZ')

    await waitFor(() => {
      expect(screen.getByText('No se encontraron cursos')).toBeInTheDocument()
    })
  })

  it('no busca si el texto tiene menos de 2 caracteres', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)

    const input = screen.getByPlaceholderText('Buscar cursos...')
    await user.type(input, 'R')

    // No debería llamar a la API
    expect(mockListPublicCourses).not.toHaveBeenCalled()
  })

  it('muestra indicador de carga mientras busca', async () => {
    mockListPublicCourses.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockCourses), 100))
    )

    const user = userEvent.setup()
    render(<SearchBar />)

    const input = screen.getByPlaceholderText('Buscar cursos...')
    await user.type(input, 'React')

    // Debería mostrar CircularProgress
    const progressIndicator = screen.getByRole('progressbar')
    expect(progressIndicator).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })
})
