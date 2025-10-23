import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Navbar } from './Navbar'
import type { User } from '../../types/auth'

// Mock de los hooks
vi.mock('../../hooks/useAuth')
vi.mock('../../hooks/useNavigation')

import { useAuth } from '../../hooks/useAuth'
import { useNavigation } from '../../hooks/useNavigation'

const mockGoTo = vi.fn()
const mockLogout = vi.fn()

const mockUser: User = {
  id: '1',
  name: 'Juan Pérez',
  email: 'juan@test.com',
  role: 'student',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigation).mockReturnValue({
      goTo: mockGoTo,
    } as any)
  })

  it('renderiza el logo de Tecnorix Academy', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
    } as any)

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )

    expect(screen.getByText('Tecnorix Academy')).toBeInTheDocument()
  })

  it('muestra botón de login para usuario no autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
    } as any)

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )

    expect(screen.getByLabelText(/iniciar sesión/i)).toBeInTheDocument()
  })

  it('navega a login al hacer click en botón', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
    } as any)

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )

    const loginButton = screen.getByLabelText(/iniciar sesión/i)
    fireEvent.click(loginButton)

    expect(mockGoTo).toHaveBeenCalledWith('/login')
  })

  it('muestra avatar del usuario autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: mockLogout,
    } as any)

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )

    const avatar = screen.getByText('J')
    expect(avatar).toBeInTheDocument()
  })

  it('muestra icono de notificaciones para usuario autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: mockLogout,
    } as any)

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )

    expect(screen.getByLabelText(/notificaciones/i)).toBeInTheDocument()
  })

  it('muestra botón de menú cuando showMenuButton es true', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    } as any)

    const mockOnMenuToggle = vi.fn()

    render(
      <BrowserRouter>
        <Navbar onMenuToggle={mockOnMenuToggle} showMenuButton={true} />
      </BrowserRouter>
    )

    expect(screen.getByLabelText(/abrir menú/i)).toBeInTheDocument()
  })

  it('llama a onMenuToggle al hacer click en botón de menú', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    } as any)

    const mockOnMenuToggle = vi.fn()

    render(
      <BrowserRouter>
        <Navbar onMenuToggle={mockOnMenuToggle} showMenuButton={true} />
      </BrowserRouter>
    )

    const menuButton = screen.getByLabelText(/abrir menú/i)
    fireEvent.click(menuButton)

    expect(mockOnMenuToggle).toHaveBeenCalled()
  })

  it('navega a home al hacer click en el logo', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
    } as any)

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )

    const logo = screen.getByText('Tecnorix Academy')
    fireEvent.click(logo)

    expect(mockGoTo).toHaveBeenCalledWith('/')
  })
})
