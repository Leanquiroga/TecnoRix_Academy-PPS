import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForumPost } from './ForumPost'
import type { ForumPostWithAuthor } from '../../types/forum'

const mockPost: ForumPostWithAuthor = {
  id: 'post-1',
  course_id: 'course-1',
  user_id: 'user-1',
  title: 'Título del post',
  message: 'Contenido del post',
  created_at: '2025-10-30T10:00:00Z',
  updated_at: '2025-10-30T10:00:00Z',
  author: { id: 'user-1', name: 'Juan Pérez', email: 'juan@example.com' },
  replies_count: 2,
}

describe('ForumPost', () => {
  it('renderiza título, mensaje, autor y cantidad de respuestas', () => {
    render(<ForumPost post={mockPost} />)

    expect(screen.getByText('Título del post')).toBeInTheDocument()
    expect(screen.getByText('Contenido del post')).toBeInTheDocument()
    // Comprueba que aparece el autor y el conteo de respuestas en la línea de metadata
    expect(screen.getByText(/2 respuestas/i)).toBeInTheDocument()
    expect(screen.getByText(/Por .*Juan/i)).toBeInTheDocument()
  })

  it('llama a onClick cuando se hace click (clickeable)', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<ForumPost post={mockPost} onClick={onClick} />)

    await user.click(screen.getByText('Título del post'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
