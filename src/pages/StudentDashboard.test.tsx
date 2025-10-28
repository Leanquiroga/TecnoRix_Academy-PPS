import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import React from 'react'

vi.mock('../api/enrollment.service', () => {
  return {
    enrollmentService: {
      getStudentStats: vi.fn().mockResolvedValue({
        total_courses: 2,
        active_courses: 1,
        completed_courses: 1,
        average_progress: 75,
      })
    }
  }
})

const mockGoToCourseView = vi.fn()
const mockGoToCourses = vi.fn()
const mockGoToMyCourses = vi.fn()
vi.mock('../hooks/useNavigation', () => ({
  useNavigation: () => ({
    goHome: vi.fn(),
    goBack: vi.fn(),
    goTo: vi.fn(),
    navigateByRole: vi.fn(),
    goToDashboard: vi.fn(),
    goToCourses: mockGoToCourses,
    goToCourse: vi.fn(),
    goToCourseView: mockGoToCourseView,
    goToCreateCourse: vi.fn(),
    goToEditCourse: vi.fn(),
    goToMyCourses: mockGoToMyCourses,
    goToProfile: vi.fn(),
    goToSettings: vi.fn(),
    goToAdmin: vi.fn(),
    goToLogin: vi.fn(),
    goToRegister: vi.fn(),
    goToNotFound: vi.fn(),
    goToTeacherDashboard: vi.fn(),
    goToStudentDashboard: vi.fn(),
    searchParams: new URLSearchParams(),
  })
}))

vi.mock('../store/enrollment.store', () => ({
  useEnrollmentStore: () => ({
    myCourses: [
      {
        id: 'e1',
        student_id: 's1',
        course_id: 'c1',
        status: 'active',
        enrolled_at: '2025-01-01',
        progress: 50,
        course: {
          id: 'c1',
          title: 'React Básico',
          description: 'Curso de introducción',
          price: 0,
          teacher_id: 't1',
          category: 'Web',
          level: 'beginner',
          thumbnail_url: null,
          instructor_name: 'Profe 1',
        }
      },
      {
        id: 'e2',
        student_id: 's1',
        course_id: 'c2',
        status: 'active',
        enrolled_at: '2025-01-02',
        progress: 100,
        course: {
          id: 'c2',
          title: 'TypeScript Avanzado',
          description: 'Tipos avanzados',
          price: 10,
          teacher_id: 't2',
          category: 'Web',
          level: 'advanced',
          thumbnail_url: null,
          instructor_name: 'Profe 2',
        }
      }
    ],
    loading: false,
    error: null,
    fetchMyCourses: vi.fn(),
  })
}))

import StudentDashboard from './StudentDashboard'

describe('StudentDashboard', () => {
  it('muestra el encabezado y estadísticas', async () => {
    render(<StudentDashboard />)

    expect(await screen.findByText('Mi Panel de Estudiante')).toBeInTheDocument()

    // Estadísticas
    await waitFor(() => {
      expect(screen.getByText('Total Cursos')).toBeInTheDocument()
      expect(screen.getByText('En Progreso')).toBeInTheDocument()
      expect(screen.getByText('Completados')).toBeInTheDocument()
      expect(screen.getByText('Progreso Promedio')).toBeInTheDocument()
    })
  })

  it('muestra cursos en progreso y permite continuar', async () => {
    render(<StudentDashboard />)

  // Curso con progreso < 100 debe aparecer
  expect(await screen.findByText('React Básico')).toBeInTheDocument()
  // Curso completado no debe listarse en "en progreso"
  expect(screen.queryByText('TypeScript Avanzado')).not.toBeInTheDocument()

    // Click en Continuar
    const continuarBtn = await screen.findByRole('button', { name: /Continuar/i })
    await userEvent.click(continuarBtn)
    expect(mockGoToCourseView).toHaveBeenCalledWith('c1')
  })

  it('muestra alerta informativa cuando no hay cursos en progreso', async () => {
    // Remock de módulos con todos los cursos completados
    vi.resetModules()
    vi.doMock('../api/enrollment.service', () => ({
      enrollmentService: {
        getStudentStats: vi.fn().mockResolvedValue({
          total_courses: 1,
          active_courses: 0,
          completed_courses: 1,
          average_progress: 100,
        })
      }
    }))
    vi.doMock('../hooks/useNavigation', () => ({
      useNavigation: () => ({
        goHome: vi.fn(), goBack: vi.fn(), goTo: vi.fn(), navigateByRole: vi.fn(), goToDashboard: vi.fn(),
        goToCourses: mockGoToCourses, goToCourse: vi.fn(), goToCourseView: mockGoToCourseView,
        goToCreateCourse: vi.fn(), goToEditCourse: vi.fn(), goToMyCourses: mockGoToMyCourses,
        goToProfile: vi.fn(), goToSettings: vi.fn(), goToAdmin: vi.fn(), goToLogin: vi.fn(), goToRegister: vi.fn(),
        goToNotFound: vi.fn(), goToTeacherDashboard: vi.fn(), goToStudentDashboard: vi.fn(), searchParams: new URLSearchParams(),
      })
    }))
    vi.doMock('../store/enrollment.store', () => ({
      useEnrollmentStore: () => ({
        myCourses: [
          {
            id: 'e2', student_id: 's1', course_id: 'c2', status: 'active', enrolled_at: '2025-01-02', progress: 100,
            course: { id: 'c2', title: 'TS', description: 'x', price: 10, teacher_id: 't2', category: 'Web', level: 'advanced', thumbnail_url: null, instructor_name: 'Profe 2' }
          }
        ],
        loading: false,
        error: null,
        fetchMyCourses: vi.fn(),
      })
    }))

    const { default: StudentDashboard2 } = await import('./StudentDashboard')
    render(<StudentDashboard2 />)

    expect(await screen.findByText(/No tienes cursos en progreso/i)).toBeInTheDocument()
  })

  it('muestra error cuando fallan las estadísticas', async () => {
    vi.resetModules()
    vi.doMock('../api/enrollment.service', () => ({
      enrollmentService: {
        getStudentStats: vi.fn().mockRejectedValue(new Error('Fallo')),
      }
    }))
    vi.doMock('../hooks/useNavigation', () => ({
      useNavigation: () => ({
        goHome: vi.fn(), goBack: vi.fn(), goTo: vi.fn(), navigateByRole: vi.fn(), goToDashboard: vi.fn(),
        goToCourses: mockGoToCourses, goToCourse: vi.fn(), goToCourseView: mockGoToCourseView,
        goToCreateCourse: vi.fn(), goToEditCourse: vi.fn(), goToMyCourses: mockGoToMyCourses,
        goToProfile: vi.fn(), goToSettings: vi.fn(), goToAdmin: vi.fn(), goToLogin: vi.fn(), goToRegister: vi.fn(),
        goToNotFound: vi.fn(), goToTeacherDashboard: vi.fn(), goToStudentDashboard: vi.fn(), searchParams: new URLSearchParams(),
      })
    }))
    vi.doMock('../store/enrollment.store', () => ({
      useEnrollmentStore: () => ({
        myCourses: [],
        loading: false,
        error: null,
        fetchMyCourses: vi.fn(),
      })
    }))

    const { default: StudentDashboardErr } = await import('./StudentDashboard')
    render(<StudentDashboardErr />)

    const alert = await screen.findByText(/Error al cargar estadísticas|Fallo/i)
    expect(alert).toBeInTheDocument()
  })
})
