import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

const mockGoBack = vi.fn()
vi.mock('../../hooks/useNavigation', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  })
}))

import { BackButton } from './BackButton'

describe('BackButton', () => {
  beforeEach(() => {
    mockGoBack.mockClear()
  })

  it('renderiza con label por defecto', () => {
    render(<BackButton />)
    expect(screen.getByRole('button', { name: /Volver/i })).toBeInTheDocument()
  })

  it('renderiza con label personalizado', () => {
    render(<BackButton label="Regresar" />)
    expect(screen.getByRole('button', { name: /Regresar/i })).toBeInTheDocument()
  })

  it('llama a goBack cuando se hace click sin onBack personalizado', async () => {
    render(<BackButton />)
    const btn = screen.getByRole('button', { name: /Volver/i })
    await userEvent.click(btn)
    expect(mockGoBack).toHaveBeenCalledTimes(1)
  })

  it('llama a onBack personalizado en lugar de goBack', async () => {
    const customBack = vi.fn()
    render(<BackButton onBack={customBack} />)
    const btn = screen.getByRole('button', { name: /Volver/i })
    await userEvent.click(btn)
    expect(customBack).toHaveBeenCalledTimes(1)
    expect(mockGoBack).not.toHaveBeenCalled()
  })

  it('acepta props adicionales de Button', () => {
    render(<BackButton color="secondary" size="large" />)
    const btn = screen.getByRole('button', { name: /Volver/i })
    expect(btn).toBeInTheDocument()
  })
})
