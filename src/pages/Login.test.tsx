import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import LoginPage from './Login'
import Home from './Home'
import * as AuthAPI from '../api/auth.service'
import { useAuthStore } from '../store/auth.store'

vi.mock('../api/auth.service')

function DummyDashboard() { return <div>Dashboard</div> }

function renderWithRouter(initialPath = '/login') {
  const router = createMemoryRouter([
    { path: '/', element: <Home /> },
    { path: '/login', element: <LoginPage /> },
    { path: '/dashboard', element: <DummyDashboard /> },
  ], { initialEntries: [initialPath] })
  return render(<RouterProvider router={router} />)
}

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, loading: false, error: undefined })
    vi.clearAllMocks()
  })

  it('valida campos requeridos', async () => {
    renderWithRouter()
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await screen.findByText(/requeridos/i)).toBeInTheDocument()
  })

  it('hace login exitoso', async () => {
    ;(AuthAPI.login as unknown as jest.Mock).mockResolvedValue({
      user: {
        id: '1', email: 'a@a.com', name: 'A', role: 'student', status: 'active', created_at: '', updated_at: ''
      },
      token: 'tkn'
    })

    renderWithRouter()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@a.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })
})
