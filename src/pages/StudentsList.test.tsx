import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'c1' }),
  }
})

vi.mock('../api/course.service', () => ({
  getCoursePublicById: vi.fn().mockResolvedValue({
    id: 'c1', title: 'Curso Test', description: 'desc', price: 0, teacher_id: 't1'
  })
}))

vi.mock('../api/enrollment.service', () => ({
  enrollmentService: {
    getCourseStudents: vi.fn().mockResolvedValue([
      { id: 'e1', student_id: 's1', course_id: 'c1', status: 'active', enrolled_at: '2025-01-01', progress: 40,
        student: { id: 's1', name: 'Ana', email: 'ana@example.com' } },
      { id: 'e2', student_id: 's2', course_id: 'c1', status: 'completed', enrolled_at: '2025-01-02', progress: 100,
        student: { id: 's2', name: 'Luis', email: 'luis@example.com' } },
    ])
  }
}))

vi.mock('../hooks/useNavigation', () => ({
  useNavigation: () => ({
    goBack: vi.fn(),
    goToCourse: vi.fn(),
  })
}))

import StudentsList from './StudentsList'

describe('StudentsList', () => {
  it('renderiza título de curso y estudiantes', async () => {
    render(<StudentsList />)

    expect(await screen.findByText('Estudiantes del Curso')).toBeInTheDocument()
    expect(await screen.findByText('Curso Test')).toBeInTheDocument()

    // filas visibles
    expect(await screen.findByText('Ana')).toBeInTheDocument()
    expect(await screen.findByText('luis@example.com')).toBeInTheDocument()
  })

  it('filtra por texto y por estado', async () => {
    render(<StudentsList />)

    // Filtrar por nombre
    const search = await screen.findByPlaceholderText(/Buscar por nombre o email/i)
    await userEvent.type(search, 'ana')
    await waitFor(() => {
      expect(screen.getByText('Ana')).toBeInTheDocument()
      expect(screen.queryByText('Luis')).toBeNull()
    })

    // Limpiar y filtrar por estado Completado
    await userEvent.clear(search)
    const select = screen.getByLabelText('Estado')
    await userEvent.click(select)
    const opt = await screen.findByRole('option', { name: /Completado/i })
    await userEvent.click(opt)

    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument()
      expect(screen.queryByText('active')).toBeNull()
    })
  })

  it('muestra error si falla la carga', async () => {
    vi.resetModules()
    vi.doMock('../api/course.service', () => ({
      getCoursePublicById: vi.fn().mockRejectedValue(new Error('fallo curso'))
    }))
    vi.doMock('../api/enrollment.service', () => ({
      enrollmentService: {
        getCourseStudents: vi.fn().mockRejectedValue(new Error('fallo estudiantes'))
      }
    }))
    const { default: StudentsListErr } = await import('./StudentsList')
    render(<StudentsListErr />)

    expect(await screen.findByText(/Error al cargar estudiantes|fallo/i)).toBeInTheDocument()
  })
})
