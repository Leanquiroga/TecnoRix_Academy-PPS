import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import type { User } from '../../types/auth'

// Mock de los hooks
vi.mock('../../hooks/useAuth')
vi.mock('../../hooks/useNavigation')

import { useAuth } from '../../hooks/useAuth'
import { useNavigation } from '../../hooks/useNavigation'

const mockGoTo = vi.fn()
const mockIsRouteActive = vi.fn()

const mockUserStudent: User = {
  id: '1',
  name: 'Estudiante Test',
  email: 'student@test.com',
  role: 'student',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockUserTeacher: User = {
  id: '2',
  name: 'Profesor Test',
  email: 'teacher@test.com',
  role: 'teacher',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsRouteActive.mockReturnValue(false)
    
    vi.mocked(useNavigation).mockReturnValue({
      goTo: mockGoTo,
      isRouteActive: mockIsRouteActive,
    } as any)
  })

  describe('Renderizado básico', () => {
    it('renderiza sidebar para estudiante', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUserStudent,
        isAuthenticated: true,
      } as any)

      render(
        <BrowserRouter>
          <Sidebar variant="permanent" open={true} />
        </BrowserRouter>
      )

      // Debe mostrar opciones de estudiante
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Explorar Cursos')).toBeInTheDocument()
    })

    it('renderiza sidebar para profesor', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUserTeacher,
        isAuthenticated: true,
      } as any)

      render(
        <BrowserRouter>
          <Sidebar variant="permanent" open={true} />
        </BrowserRouter>
      )

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Mis Cursos')).toBeInTheDocument()
    })

    it('muestra botón de toggle en modo permanent', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUserStudent,
        isAuthenticated: true,
      } as any)

      const mockOnToggle = vi.fn()

      render(
        <BrowserRouter>
          <Sidebar variant="permanent" open={true} onToggle={mockOnToggle} />
        </BrowserRouter>
      )

      const toggleButton = screen.getByRole('button', { name: '' })
      expect(toggleButton).toBeInTheDocument()
    })
  })

  describe('Navegación', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUserStudent,
        isAuthenticated: true,
      } as any)
    })

    it('navega al hacer click en un item del menú', () => {
      render(
        <BrowserRouter>
          <Sidebar variant="permanent" open={true} />
        </BrowserRouter>
      )

      const dashboardItem = screen.getByText('Dashboard')
      fireEvent.click(dashboardItem)

      expect(mockGoTo).toHaveBeenCalled()
    })
  })

  describe('Toggle collapse', () => {
    it('llama a onToggle al hacer click en botón de toggle', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUserStudent,
        isAuthenticated: true,
      } as any)

      const mockOnToggle = vi.fn()

      render(
        <BrowserRouter>
          <Sidebar variant="permanent" open={true} onToggle={mockOnToggle} />
        </BrowserRouter>
      )

      const toggleButton = screen.getByRole('button', { name: '' })
      fireEvent.click(toggleButton)

      expect(mockOnToggle).toHaveBeenCalled()
    })
  })

  describe('Mobile drawer', () => {
    it('renderiza como drawer temporal en mobile', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUserStudent,
        isAuthenticated: true,
      } as any)

      const mockOnClose = vi.fn()

      render(
        <BrowserRouter>
          <Sidebar variant="temporary" open={true} onClose={mockOnClose} />
        </BrowserRouter>
      )

      // Verificar que el drawer existe con la clase correcta
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  describe('Sidebar colapsado', () => {
    it('renderiza en modo colapsado', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUserStudent,
        isAuthenticated: true,
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Sidebar variant="permanent" open={true} collapsed={true} />
        </BrowserRouter>
      )

      // En modo colapsado, el drawer sigue existiendo
      expect(container.querySelector('.MuiDrawer-root')).toBeInTheDocument()
    })
  })

  describe('Usuario info en footer (collapsed)', () => {
    it('muestra avatar del usuario cuando está colapsado', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUserStudent,
        isAuthenticated: true,
      } as any)

      render(
        <BrowserRouter>
          <Sidebar variant="permanent" open={true} collapsed={true} />
        </BrowserRouter>
      )

      // Debe mostrar inicial del nombre
      expect(screen.getByText('E')).toBeInTheDocument()
    })
  })
})
