import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ForumPostForm } from './ForumPostForm'

function setup(onSubmit = vi.fn()) {
  render(<ForumPostForm onSubmit={onSubmit} />)
  const titleInput = screen.getByLabelText('Título') as HTMLInputElement
  const messageInput = screen.getByLabelText('Mensaje') as HTMLTextAreaElement
  const submitButton = screen.getByRole('button', { name: /publicar/i }) as HTMLButtonElement
  return { titleInput, messageInput, submitButton, onSubmit }
}

describe('ForumPostForm', () => {
  it('deshabilita el botón si faltan campos', () => {
    const { submitButton } = setup()
    expect(submitButton).toBeDisabled()
  })

  it('habilita el botón cuando título y mensaje están completos', () => {
    const { titleInput, messageInput, submitButton } = setup()

    fireEvent.change(titleInput, { target: { value: '  Nuevo título  ' } })
    fireEvent.change(messageInput, { target: { value: '  Contenido del mensaje  ' } })

    expect(submitButton).toBeEnabled()
  })

  it('envía datos recortados y limpia el formulario', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { titleInput, messageInput, submitButton } = setup(onSubmit)

    fireEvent.change(titleInput, { target: { value: '  Nuevo título  ' } })
    fireEvent.change(messageInput, { target: { value: '  Contenido del mensaje  ' } })

    fireEvent.click(submitButton)

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Nuevo título', message: 'Contenido del mensaje' })

    // Campos deben limpiarse luego del submit (esperar a que React procese el estado)
    await waitFor(() => {
      expect(titleInput.value).toBe('')
      expect(messageInput.value).toBe('')
      expect(submitButton).toBeDisabled()
    })
  })

  it('permanece deshabilitado cuando submitting=true', () => {
    render(<ForumPostForm onSubmit={vi.fn()} submitting />)

    const titleInput = screen.getByLabelText('Título') as HTMLInputElement
    const messageInput = screen.getByLabelText('Mensaje') as HTMLTextAreaElement
    const submitButton = screen.getByRole('button', { name: /publicar/i }) as HTMLButtonElement

    fireEvent.change(titleInput, { target: { value: 'Título' } })
    fireEvent.change(messageInput, { target: { value: 'Mensaje' } })

    expect(submitButton).toBeDisabled()
  })
})
