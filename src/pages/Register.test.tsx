import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import RegisterPage from './Register'
import * as AuthAPI from '../api/auth.service'
import { useAuthStore } from '../store/auth.store'

vi.mock('../api/auth.service')

function DummyDashboard() { return <div>Dashboard</div> }

function renderWithRouter(initialPath = '/register') {
  const router = createMemoryRouter([
    { path: '/register', element: <RegisterPage /> },
    { path: '/dashboard', element: <DummyDashboard /> },
  ], { initialEntries: [initialPath] })
  return render(<RouterProvider router={router} />)
}

describe('RegisterPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, loading: false, error: undefined })
    vi.clearAllMocks()
  })

  it('valida campos requeridos', async () => {
    renderWithRouter()
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }))
    expect(await screen.findByText(/todos los campos son requeridos/i)).toBeInTheDocument()
  })

  it('registra y autentica', async () => {
    ;(AuthAPI.register as unknown as jest.Mock).mockResolvedValue({
      user: { id: '1', email: 'a@a.com', name: 'A', role: 'student', status: 'active', created_at: '', updated_at: '' },
      token: 'tkn2'
    })
    renderWithRouter()
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'A' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@a.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }))
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true))
  })
})
