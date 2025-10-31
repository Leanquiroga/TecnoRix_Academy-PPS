import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import CourseApproval from './CourseApproval'
import * as CourseAPI from '../api/course.service'
import type { Course } from '../types/course'

// Mock del módulo de API
vi.mock('../api/course.service', () => ({
  listPendingCourses: vi.fn(),
  approveCourse: vi.fn(),
  rejectCourse: vi.fn(),
}))

const mockCourses: Course[] = [
  {
    id: 'course-1',
    title: 'React Avanzado',
    description: 'Aprende React desde cero',
    teacher_id: 'teacher-1',
    status: 'pending_approval',
    price: 15000,
    category: 'Programación',
    level: 'intermediate',
    thumbnail_url: 'https://example.com/thumb.jpg',
    duration_hours: 20,
    language: 'es',
    tags: ['react', 'javascript'],
    metadata: {},
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'course-2',
    title: 'Node.js Básico',
    description: 'Introducción a Node.js',
    teacher_id: 'teacher-2',
    status: 'pending_approval',
    price: 10000,
    category: 'Backend',
    level: 'beginner',
    thumbnail_url: null,
    duration_hours: 15,
    language: 'es',
    tags: ['nodejs', 'backend'],
    metadata: {},
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
]

function renderCourseApproval() {
  return render(
    <MemoryRouter>
      <CourseApproval />
    </MemoryRouter>
  )
}

describe('CourseApproval', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra loading mientras carga los cursos', () => {
    vi.spyOn(CourseAPI, 'listPendingCourses').mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderCourseApproval()

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('carga y muestra la lista de cursos pendientes', async () => {
    vi.spyOn(CourseAPI, 'listPendingCourses').mockResolvedValue(mockCourses)

    renderCourseApproval()

    await waitFor(() => {
      expect(screen.getByText('React Avanzado')).toBeInTheDocument()
    })

    expect(screen.getByText('Node.js Básico')).toBeInTheDocument()
    expect(screen.getByText('Aprende React desde cero')).toBeInTheDocument()
    expect(screen.getByText('Programación')).toBeInTheDocument()
    expect(screen.getByText('intermediate')).toBeInTheDocument()
    expect(screen.getByText('$15000')).toBeInTheDocument()
  })

  it('muestra error cuando falla la carga de cursos', async () => {
    vi.spyOn(CourseAPI, 'listPendingCourses').mockRejectedValue(new Error('Error de red'))

    renderCourseApproval()

    await waitFor(() => {
      expect(screen.getByText(/error de red/i)).toBeInTheDocument()
    })
  })

  it('muestra mensaje cuando no hay cursos pendientes', async () => {
    vi.spyOn(CourseAPI, 'listPendingCourses').mockResolvedValue([])

    renderCourseApproval()

    await waitFor(() => {
      expect(screen.getByText(/no hay cursos pendientes de aprobación/i)).toBeInTheDocument()
    })
  })

  it('aprueba un curso correctamente', async () => {
    vi.spyOn(CourseAPI, 'listPendingCourses').mockResolvedValue(mockCourses)
    const approveSpy = vi.spyOn(CourseAPI, 'approveCourse').mockResolvedValue({
      ...mockCourses[0],
      status: 'approved',
    })

    const user = userEvent.setup()
    renderCourseApproval()

    await waitFor(() => {
      expect(screen.getByText('React Avanzado')).toBeInTheDocument()
    })

    // Click en el primer botón de aprobar
    const approveButtons = screen.getAllByRole('button', { name: /aprobar/i })
    await user.click(approveButtons[0])

    await waitFor(() => {
      expect(approveSpy).toHaveBeenCalledWith('course-1')
    })

    // Verificar mensaje de éxito
    expect(screen.getByText(/curso aprobado exitosamente/i)).toBeInTheDocument()

    // El curso debe desaparecer de la lista
    await waitFor(() => {
      expect(screen.queryByText('React Avanzado')).not.toBeInTheDocument()
    })

    // El otro curso debe seguir visible
    expect(screen.getByText('Node.js Básico')).toBeInTheDocument()
  })

  it('muestra error al aprobar curso cuando falla', async () => {
    vi.spyOn(CourseAPI, 'listPendingCourses').mockResolvedValue(mockCourses)
    vi.spyOn(CourseAPI, 'approveCourse').mockRejectedValue(new Error('Error al aprobar'))

    const user = userEvent.setup()
    renderCourseApproval()

    await waitFor(() => {
      expect(screen.getByText('React Avanzado')).toBeInTheDocument()
    })

    const approveButtons = screen.getAllByRole('button', { name: /aprobar/i })
    await user.click(approveButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/error al aprobar/i)).toBeInTheDocument()
    })

    // El curso debe seguir visible
    expect(screen.getByText('React Avanzado')).toBeInTheDocument()
  })

  it('abre modal de rechazo y valida razón requerida', async () => {
    vi.spyOn(CourseAPI, 'listPendingCourses').mockResolvedValue(mockCourses)

    const user = userEvent.setup()
    renderCourseApproval()

    await waitFor(() => {
      expect(screen.getByText('React Avanzado')).toBeInTheDocument()
    })

    // Click en rechazar
    const rejectButtons = screen.getAllByRole('button', { name: /rechazar/i })
    await user.click(rejectButtons[0])

    // Debe abrir el modal
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Intentar confirmar sin razón
    const confirmButton = screen.getByRole('button', { name: /confirmar rechazo/i })
    await user.click(confirmButton)

    // Debe mostrar error de validación
    await waitFor(() => {
      expect(screen.getByText(/debes proporcionar una razón/i)).toBeInTheDocument()
    })
  })

  it('rechaza un curso con razón correctamente', async () => {
    vi.spyOn(CourseAPI, 'listPendingCourses').mockResolvedValue(mockCourses)
    const rejectSpy = vi.spyOn(CourseAPI, 'rejectCourse').mockResolvedValue({
      ...mockCourses[0],
      status: 'rejected',
    })

    const user = userEvent.setup()
    renderCourseApproval()

    await waitFor(() => {
      expect(screen.getByText('React Avanzado')).toBeInTheDocument()
    })

    // Click en rechazar
    const rejectButtons = screen.getAllByRole('button', { name: /rechazar/i })
    await user.click(rejectButtons[0])

    // Esperar modal
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Escribir razón
    const reasonInput = screen.getByLabelText(/razón del rechazo/i) as HTMLTextAreaElement
    await user.type(reasonInput, 'Contenido inapropiado')

    // Confirmar rechazo
    const confirmButton = screen.getByRole('button', { name: /confirmar rechazo/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(rejectSpy).toHaveBeenCalledWith('course-1', 'Contenido inapropiado')
    })

    // Verificar mensaje de éxito
    expect(screen.getByText(/curso rechazado exitosamente/i)).toBeInTheDocument()

    // El curso debe desaparecer de la lista
    await waitFor(() => {
      expect(screen.queryByText('React Avanzado')).not.toBeInTheDocument()
    })
  }, 10000)

  it('permite cancelar el rechazo', async () => {
    vi.spyOn(CourseAPI, 'listPendingCourses').mockResolvedValue(mockCourses)
    const rejectSpy = vi.spyOn(CourseAPI, 'rejectCourse')

    const user = userEvent.setup()
    renderCourseApproval()

    await waitFor(() => {
      expect(screen.getByText('React Avanzado')).toBeInTheDocument()
    })

    // Click en rechazar
    const rejectButtons = screen.getAllByRole('button', { name: /rechazar/i })
    await user.click(rejectButtons[0])

    // Esperar modal
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Click en cancelar
    const cancelButton = screen.getByRole('button', { name: /^cancelar$/i })
    await user.click(cancelButton)

    // Modal debe cerrarse
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // No se debe llamar a rejectCourse
    expect(rejectSpy).not.toHaveBeenCalled()

    // El curso debe seguir visible
    expect(screen.getByText('React Avanzado')).toBeInTheDocument()
  })

  it('permite actualizar la lista de cursos', async () => {
    const listSpy = vi.spyOn(CourseAPI, 'listPendingCourses').mockResolvedValue(mockCourses)

    const user = userEvent.setup()
    renderCourseApproval()

    await waitFor(() => {
      expect(screen.getByText('React Avanzado')).toBeInTheDocument()
    })

    // Limpiar para verificar que se llama de nuevo
    listSpy.mockClear()

    // Click en actualizar
    const refreshButton = screen.getByRole('button', { name: /actualizar/i })
    await user.click(refreshButton)

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledTimes(1)
    })
  })
})
