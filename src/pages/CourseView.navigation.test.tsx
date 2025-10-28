import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CourseView } from './CourseView'
import type { CourseMaterial } from '../types/course'

// Mock hooks y componentes
const mockGoToMyCourses = vi.fn()
vi.mock('../hooks/useNavigation', () => ({
  useNavigation: () => ({
    goToMyCourses: mockGoToMyCourses,
  }),
}))

const mockCourse = {
  id: 'c1',
  title: 'React Avanzado',
  description: 'Aprende React',
  price: 100,
  teacher_id: 't1',
  instructor_name: 'Teacher',
  level: 'intermediate' as const,
  category: 'Programación',
}

const mockMaterials: CourseMaterial[] = [
  {
    id: 'm1',
    course_id: 'c1',
    title: 'Introducción',
    type: 'video',
    url: 'https://video.mp4',
    order: 1,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  },
  {
    id: 'm2',
    course_id: 'c1',
    title: 'Conceptos',
    type: 'pdf',
    url: 'https://pdf.pdf',
    order: 2,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  },
  {
    id: 'm3',
    course_id: 'c1',
    title: 'Práctica',
    type: 'video',
    url: 'https://video2.mp4',
    order: 3,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  },
]

let mockUseCourseReturn: any

vi.mock('../hooks/useCourse', () => ({
  useCourse: () => mockUseCourseReturn,
}))

vi.mock('../store/enrollment.store', () => ({
  useEnrollmentStore: () => ({
    myCourses: [
      {
        id: 'e1',
        course_id: 'c1',
        student_id: 's1',
        status: 'active',
        progress: 50,
        enrolled_at: '2025-01-01',
      },
    ],
  }),
}))

vi.mock('../api/enrollment.service', () => ({
  enrollmentService: {
    updateProgress: vi.fn(),
  },
}))

vi.mock('../components/VideoPlayer', () => ({
  VideoPlayer: ({ title }: { title: string }) => <div data-testid="video-player">{title}</div>,
}))

vi.mock('../components/PdfViewer', () => ({
  PdfViewer: ({ title }: { title: string }) => <div data-testid="pdf-viewer">{title}</div>,
}))

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'c1' }),
  }
})

describe('CourseView - Navegación de Materiales', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCourseReturn = {
      currentCourse: mockCourse,
      materials: mockMaterials,
      loading: false,
      error: null,
      fetchCourseById: vi.fn(),
      fetchCourseMaterials: vi.fn(),
      clearCurrentCourse: vi.fn(),
    }
  })

  it('muestra botones de navegación entre materiales', async () => {
    render(<CourseView />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /anterior/i })).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument()
    expect(screen.getByText(/material 1 de 3/i)).toBeInTheDocument()
  })

  it('deshabilita botón Anterior en el primer material', async () => {
    render(<CourseView />)

    await waitFor(() => {
      const anteriorBtn = screen.getByRole('button', { name: /anterior/i })
      expect(anteriorBtn).toBeDisabled()
    })

    const siguienteBtn = screen.getByRole('button', { name: /siguiente/i })
    expect(siguienteBtn).not.toBeDisabled()
  })

  it('deshabilita botón Siguiente en el último material', async () => {
    render(<CourseView />)
    const user = userEvent.setup()

    // Navegar al último material
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument()
    })

    const siguienteBtn = screen.getByRole('button', { name: /siguiente/i })
    
    // Click 2 veces para llegar al último
    await user.click(siguienteBtn)
    await user.click(siguienteBtn)

    await waitFor(() => {
      expect(screen.getByText(/material 3 de 3/i)).toBeInTheDocument()
    })

    expect(siguienteBtn).toBeDisabled()
  })

  it('navega al siguiente material cuando se hace click en Siguiente', async () => {
    render(<CourseView />)
    const user = userEvent.setup()

    await waitFor(() => {
      expect(screen.getByText(/material 1 de 3/i)).toBeInTheDocument()
    })

    const siguienteBtn = screen.getByRole('button', { name: /siguiente/i })
    await user.click(siguienteBtn)

    await waitFor(() => {
      expect(screen.getByText(/material 2 de 3/i)).toBeInTheDocument()
    })
  })

  it('navega al material anterior cuando se hace click en Anterior', async () => {
    render(<CourseView />)
    const user = userEvent.setup()

    // Primero ir al segundo material
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument()
    })

    const siguienteBtn = screen.getByRole('button', { name: /siguiente/i })
    await user.click(siguienteBtn)

    await waitFor(() => {
      expect(screen.getByText(/material 2 de 3/i)).toBeInTheDocument()
    })

    // Ahora volver al anterior
    const anteriorBtn = screen.getByRole('button', { name: /anterior/i })
    await user.click(anteriorBtn)

    await waitFor(() => {
      expect(screen.getByText(/material 1 de 3/i)).toBeInTheDocument()
    })
  })

  it('no muestra botones de navegación si solo hay 1 material', async () => {
    mockUseCourseReturn.materials = [mockMaterials[0]]
    
    render(<CourseView />)

    await waitFor(() => {
      expect(screen.getByText(mockCourse.title)).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /anterior/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /siguiente/i })).not.toBeInTheDocument()
  })
})
