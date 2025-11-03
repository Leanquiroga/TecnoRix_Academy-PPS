import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { PrivateRoute } from '../routes/guards'
import CourseForum from './CourseForum'
import ForumPostDetail from './ForumPostDetail'
import { useAuthStore } from '../store/auth.store'
import { useEnrollmentStore } from '../store/enrollment.store'
import * as ForumAPI from '../api/forum.service'

vi.mock('../hooks/useNotify', () => ({
  useNotify: vi.fn(() => vi.fn()),
}))

vi.mock('../api/forum.service')

function renderWithRoutes(initialPath: string) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <div>Login Page</div> },
      {
        path: '/courses/:id/forum',
        element: (
          <PrivateRoute>
            <CourseForum />
          </PrivateRoute>
        ),
      },
      {
        path: '/courses/:id/forum/:postId',
        element: (
          <PrivateRoute>
            <ForumPostDetail />
          </PrivateRoute>
        ),
      },
    ],
    { initialEntries: [initialPath] }
  )
  return render(<RouterProvider router={router} />)
}

describe('Restricción de acceso al foro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset auth and enrollment stores
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, loading: false, error: undefined })
    useEnrollmentStore.setState({ myCourses: [], fetchMyCourses: vi.fn(async () => {}) } as any)
  })

  it('redirige a login si no autenticado (CourseForum)', () => {
    renderWithRoutes('/courses/course-1/forum')
    expect(screen.getByText(/login page/i)).toBeInTheDocument()
  })

  it('redirige a login si no autenticado (ForumPostDetail)', () => {
    renderWithRoutes('/courses/course-1/forum/post-1')
    expect(screen.getByText(/login page/i)).toBeInTheDocument()
  })

  it('muestra advertencia si estudiante no inscrito (CourseForum)', async () => {
    // Auth como estudiante
    useAuthStore.setState({ isAuthenticated: true, token: 't', user: { id: 'u1', email: 'u@u.com', name: 'U', role: 'student', status: 'active', created_at: '', updated_at: '' } })
    // Enrollment vacío y fetch que no agrega
    useEnrollmentStore.setState({ myCourses: [], fetchMyCourses: vi.fn(async () => {}) })
    // Evitar llamadas reales al API del foro
    vi.spyOn(ForumAPI.default, 'listPosts').mockResolvedValue([])

    renderWithRoutes('/courses/course-xyz/forum')

    await waitFor(() => {
      expect(screen.getByText(/No tienes acceso a este foro/i)).toBeInTheDocument()
    })
  })

  it('muestra advertencia si estudiante no inscrito (ForumPostDetail)', async () => {
    useAuthStore.setState({ isAuthenticated: true, token: 't', user: { id: 'u1', email: 'u@u.com', name: 'U', role: 'student', status: 'active', created_at: '', updated_at: '' } })
    useEnrollmentStore.setState({ myCourses: [], fetchMyCourses: vi.fn(async () => {}) })
    // Mock de datos mínimos para que el detalle renderice
    vi.spyOn(ForumAPI.default, 'getPost').mockResolvedValue({
      id: 'post-1', course_id: 'course-xyz', user_id: 'u2', title: 'T', message: 'M', created_at: '', updated_at: '',
      author: { id: 'u2', name: 'Autor', email: 'a@a.com' }, replies_count: 0,
    })
    vi.spyOn(ForumAPI.default, 'listReplies').mockResolvedValue([])

    renderWithRoutes('/courses/course-xyz/forum/post-1')

    await waitFor(() => {
      expect(screen.getByText(/No tienes acceso a este foro/i)).toBeInTheDocument()
    })
  })

  it('permite acceso sin advertencia a teacher', async () => {
    useAuthStore.setState({ isAuthenticated: true, token: 't', user: { id: 't1', email: 't@t.com', name: 'T', role: 'teacher', status: 'active', created_at: '', updated_at: '' } })
    vi.spyOn(ForumAPI.default, 'listPosts').mockResolvedValue([])

    renderWithRoutes('/courses/course-1/forum')

    // No debe mostrar alerta de restricción
    await waitFor(() => {
      expect(screen.queryByText(/No tienes acceso a este foro/i)).not.toBeInTheDocument()
    })
  })

  it('permite acceso sin advertencia a estudiante inscrito', async () => {
    useAuthStore.setState({ isAuthenticated: true, token: 't', user: { id: 's1', email: 's@s.com', name: 'S', role: 'student', status: 'active', created_at: '', updated_at: '' } })
    // Simular inscripción al curso
    useEnrollmentStore.setState({ myCourses: [{ id: 'enr-1', student_id: 's1', course_id: 'course-1', status: 'active', enrolled_at: '', progress: 0, course: { id: 'course-1', title: 'C1', description: '', teacher_id: 't1', status: 'approved', price: 0, created_at: '' } } as any] })
    vi.spyOn(ForumAPI.default, 'listPosts').mockResolvedValue([])

    renderWithRoutes('/courses/course-1/forum')

    await waitFor(() => {
      expect(screen.queryByText(/No tienes acceso a este foro/i)).not.toBeInTheDocument()
    })
  })
})
