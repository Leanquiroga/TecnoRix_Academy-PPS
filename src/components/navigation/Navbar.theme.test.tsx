import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { createAppTheme } from '../../theme/theme'
import { useThemeStore } from '../../store/theme.store'
import Navbar from './Navbar'

// Mocks mínimos para dependencias del Navbar
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'student', status: 'active' },
    logout: vi.fn(),
  }),
}))

vi.mock('../../hooks/useNavigation', () => ({
  useNavigation: () => ({
    goToDashboard: vi.fn(),
    goTo: vi.fn(),
  }),
}))

describe('Navbar theme toggle', () => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const mode = useThemeStore(s => s.mode)
    const theme = createAppTheme(mode)
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>
  }

  it('cambia de Modo Oscuro a Modo Claro al hacer toggle', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <Navbar />
      </Wrapper>
    )

    // Abrir menú de usuario
    await user.click(screen.getByLabelText(/menú de usuario/i))

    // Inicialmente en modo light => label debe ser "Modo Oscuro"
    const toDark = await screen.findByText(/modo oscuro/i)
    expect(toDark).toBeInTheDocument()

    // Click para cambiar a dark
    await user.click(toDark)
    expect(useThemeStore.getState().mode).toBe('dark')

    // Reabrir menú para ver nuevo label
    await user.click(screen.getByLabelText(/menú de usuario/i))
    const toLight = await screen.findByText(/modo claro/i)
    expect(toLight).toBeInTheDocument()

    // Volver a light
    await user.click(toLight)
    expect(useThemeStore.getState().mode).toBe('light')
  })
})
