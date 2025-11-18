import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

const mockUser = { id: 't1', name: 'Teacher One', email: 't1@example.com', role: 'teacher', status: 'active' }

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser })
}))

const mockGoToCreateCourse = vi.fn()
const mockGoToCourses = vi.fn()
const mockGoToCourse = vi.fn()
const mockGoTo = vi.fn()
vi.mock('../hooks/useNavigation', () => ({
  useNavigation: () => ({
    goHome: vi.fn(), goBack: vi.fn(), goTo: mockGoTo, navigateByRole: vi.fn(), goToDashboard: vi.fn(),
    goToCourses: mockGoToCourses, goToCourse: mockGoToCourse, goToCourseView: vi.fn(), goToCreateCourse: mockGoToCreateCourse,
    goToEditCourse: vi.fn(), goToMyCourses: vi.fn(), goToProfile: vi.fn(), goToSettings: vi.fn(), goToAdmin: vi.fn(),
    goToLogin: vi.fn(), goToRegister: vi.fn(), goToNotFound: vi.fn(), goToTeacherDashboard: vi.fn(), goToStudentDashboard: vi.fn(),
    searchParams: new URLSearchParams(),
  })
}))

vi.mock('../api/course.service', () => ({
  listPublicCourses: vi.fn().mockResolvedValue([
    { id: 'c1', title: 'Curso 1', description: 'desc', price: 0, teacher_id: 't1', category: 'Web', level: 'beginner', instructor_name: 'T1', status: 'approved' },
    { id: 'c2', title: 'Curso 2', description: 'desc', price: 20, teacher_id: 't1', category: 'Data', level: 'intermediate', instructor_name: 'T1', status: 'pending_approval' },
    { id: 'c3', title: 'Otro', description: 'desc', price: 15, teacher_id: 't2', category: 'Web', level: 'beginner', instructor_name: 'T2', status: 'approved' },
  ]),
  deleteCourse: vi.fn()
}))

import type { Enrollment } from '../types/enrollment'

vi.mock('../api/enrollment.service', () => ({
  enrollmentService: {
    getCourseStudents: vi.fn((courseId: string) => {
      if (courseId === 'c1') return Promise.resolve([{ id: 'e1' } as Enrollment, { id: 'e2' } as Enrollment])
      if (courseId === 'c2') return Promise.resolve([{ id: 'e3' } as Enrollment])
      return Promise.resolve([])
    })
  }
}))

import TeacherDashboard from './TeacherDashboard'
import * as courseService from '../api/course.service'

describe('TeacherDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra encabezado y estadísticas calculadas', async () => {
    render(<TeacherDashboard />)

    expect(await screen.findByText('Panel del Profesor')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Total Cursos')).toBeInTheDocument()
      expect(screen.getByText('Activos')).toBeInTheDocument()
      expect(screen.getByText('Pendientes')).toBeInTheDocument()
      expect(screen.getByText('Total Estudiantes')).toBeInTheDocument()
    })

  // Validamos presencia de las tarjetas de métricas (etiquetas)
  expect(screen.getByText('Total Cursos')).toBeInTheDocument()
  expect(screen.getByText('Activos')).toBeInTheDocument()
  expect(screen.getByText('Pendientes')).toBeInTheDocument()
  expect(screen.getByText('Total Estudiantes')).toBeInTheDocument()
  })

  it('lista cursos y permite ver detalles', async () => {
    render(<TeacherDashboard />)

    // Filas de cursos del profesor
    const row1 = await screen.findByText('Curso 1')
    expect(row1).toBeInTheDocument()
    expect(await screen.findByText('Curso 2')).toBeInTheDocument()

    // Chip Gratis/Pago
    expect(await screen.findByText('Gratis')).toBeInTheDocument()
    expect(await screen.findByText('Pago')).toBeInTheDocument()

    // Ver detalles del primero
    const detallesButtons = await screen.findAllByRole('button', { name: /Ver Detalles/i })
    await userEvent.click(detallesButtons[0])
    expect(mockGoToCourse).toHaveBeenCalledWith('c1')
  })

  it('botón crear curso navega a creación', async () => {
    render(<TeacherDashboard />)
    const btn = await screen.findByRole('button', { name: /Crear Nuevo Curso/i })
    await userEvent.click(btn)
    expect(mockGoToCreateCourse).toHaveBeenCalled()
  })

  it('botón editar navega a página de edición', async () => {
    render(<TeacherDashboard />)
    
    // Esperar a que cargue la lista
    await screen.findByText('Curso 1')
    
    // Buscar todos los botones de Editar
    const editButtons = await screen.findAllByRole('button', { name: /Editar/i })
    
    // Click en el primer botón Editar
    await userEvent.click(editButtons[0])
    
    // Verificar que se llamó a goTo con la ruta correcta
    expect(mockGoTo).toHaveBeenCalledWith('/courses/c1/edit')
  })

  it('botón eliminar muestra confirmación y elimina curso', async () => {
    // Mock de window.confirm y window.alert
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.mocked(courseService.deleteCourse).mockResolvedValue(true as any)

    render(<TeacherDashboard />)
    
    // Esperar a que cargue la lista
    await screen.findByText('Curso 1')
    
    // Buscar todos los botones de Eliminar
    const deleteButtons = await screen.findAllByRole('button', { name: /Eliminar/i })
    
    // Click en el primer botón Eliminar
    await userEvent.click(deleteButtons[0])
    
    // Verificar que se mostró confirmación
    expect(mockConfirm).toHaveBeenCalledWith('¿Estás seguro de eliminar el curso "Curso 1"? Esta acción no se puede deshacer.')
    
    // Verificar que se llamó a deleteCourse
    await waitFor(() => {
      expect(courseService.deleteCourse).toHaveBeenCalledWith('c1')
    })
    
    // Verificar que se mostró alerta de éxito
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Curso eliminado correctamente')
    })

    mockConfirm.mockRestore()
    mockAlert.mockRestore()
  })

  it('cancelar eliminación no elimina el curso', async () => {
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<TeacherDashboard />)
    
    // Esperar a que cargue la lista
    await screen.findByText('Curso 1')
    
    // Buscar botón de Eliminar
    const deleteButtons = await screen.findAllByRole('button', { name: /Eliminar/i })
    
    // Click en el botón
    await userEvent.click(deleteButtons[0])
    
    // Verificar que se mostró confirmación
    expect(mockConfirm).toHaveBeenCalled()
    
    // Verificar que NO se llamó a deleteCourse
    expect(courseService.deleteCourse).not.toHaveBeenCalled()

    mockConfirm.mockRestore()
  })
})
