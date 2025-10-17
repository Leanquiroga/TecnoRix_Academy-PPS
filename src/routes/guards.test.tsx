import { describe, it, expect, beforeEach } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { PrivateRoute, RoleRoute } from './guards'
import { useAuthStore } from '../store/auth.store'

function App({ text }: { text: string }) { return <div>{text}</div> }
function Login() { return <div>Login Page</div> }

describe('Route Guards', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, loading: false, error: undefined })
  })

  it('PrivateRoute redirige si no autenticado', () => {
    const router = createMemoryRouter([
      { path: '/login', element: <Login /> },
      { path: '/private', element: (
        <PrivateRoute>
          <App text="Privado" />
        </PrivateRoute>
      ) },
    ], { initialEntries: ['/private'] })

    render(<RouterProvider router={router} />)
    expect(screen.getByText(/login page/i)).toBeInTheDocument()
  })

  it('PrivateRoute permite acceso si autenticado', () => {
    useAuthStore.setState({ isAuthenticated: true, user: { id: '1', email: 'a@a.com', name: 'A', role: 'student', status: 'active', created_at: '', updated_at: '' }, token: 't' })
    const router = createMemoryRouter([
      { path: '/private', element: (
        <PrivateRoute>
          <App text="Privado" />
        </PrivateRoute>
      ) },
    ], { initialEntries: ['/private'] })
    render(<RouterProvider router={router} />)
    expect(screen.getByText('Privado')).toBeInTheDocument()
  })

  it('RoleRoute redirige si rol no permitido', () => {
    useAuthStore.setState({ isAuthenticated: true, user: { id: '1', email: 'a@a.com', name: 'A', role: 'student', status: 'active', created_at: '', updated_at: '' }, token: 't' })
    const router = createMemoryRouter([
      { path: '/', element: <App text="Home" /> },
      { path: '/admin', element: (
        <RoleRoute roles={['admin']}>
          <App text="Admin" />
        </RoleRoute>
      ) },
    ], { initialEntries: ['/admin'] })
    render(<RouterProvider router={router} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('RoleRoute permite acceso si rol permitido', () => {
    useAuthStore.setState({ isAuthenticated: true, user: { id: '1', email: 'a@a.com', name: 'A', role: 'admin', status: 'active', created_at: '', updated_at: '' }, token: 't' })
    const router = createMemoryRouter([
      { path: '/admin', element: (
        <RoleRoute roles={['admin']}>
          <App text="Admin" />
        </RoleRoute>
      ) },
    ], { initialEntries: ['/admin'] })
    render(<RouterProvider router={router} />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })
})
