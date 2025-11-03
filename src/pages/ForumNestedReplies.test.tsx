import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import ForumPostDetail from './ForumPostDetail'
import * as ForumAPI from '../api/forum.service'
import type { ForumPostWithAuthor, ForumReplyWithAuthor } from '../types/forum'

vi.mock('../api/forum.service')
vi.mock('../hooks/useNotify', () => ({
  useNotify: vi.fn(() => vi.fn()),
}))
vi.mock('../store/auth.store', () => ({
  useAuthStore: vi.fn(() => ({
    // Rol teacher para habilitar allowReply sin depender de inscripciones
    user: { id: 'user-1', name: 'Autor Uno', email: 'autor1@example.com', role: 'teacher' },
  })),
}))

const mockPost: ForumPostWithAuthor = {
  id: 'post-1',
  course_id: 'course-1',
  user_id: 'user-1',
  title: 'Post principal',
  message: 'Contenido del post principal',
  created_at: '2025-10-30T10:00:00Z',
  updated_at: '2025-10-30T10:00:00Z',
  author: { id: 'user-1', name: 'Autor Uno', email: 'autor1@example.com' },
  replies_count: 3,
}

function renderDetail(initialPath = '/courses/course-1/forum/post-1') {
  const router = createMemoryRouter(
    [
      { path: '/courses/:id/forum/:postId', element: <ForumPostDetail /> },
      { path: '/courses/:id/forum', element: <div>Foro del curso</div> },
    ],
    { initialEntries: [initialPath] }
  )
  return render(<RouterProvider router={router} />)
}

describe('ForumPostDetail - Respuestas anidadas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza respuestas anidadas (padre -> hija)', async () => {
    const parent: ForumReplyWithAuthor = {
      id: 'reply-1', post_id: 'post-1', user_id: 'user-2',
      message: 'Respuesta padre', created_at: '2025-10-30T11:00:00Z', updated_at: '2025-10-30T11:00:00Z',
      author: { id: 'user-2', name: 'María López', email: 'maria@example.com' },
    }
    const child: ForumReplyWithAuthor = {
      id: 'reply-2', post_id: 'post-1', user_id: 'user-3', parent_reply_id: 'reply-1',
      message: 'Respuesta hija', created_at: '2025-10-30T11:10:00Z', updated_at: '2025-10-30T11:10:00Z',
      author: { id: 'user-3', name: 'Pedro García', email: 'pedro@example.com' },
    }
    vi.spyOn(ForumAPI.default, 'getPost').mockResolvedValue(mockPost)
    vi.spyOn(ForumAPI.default, 'listReplies').mockResolvedValue([parent, child])

    renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Post principal')).toBeInTheDocument()
    })

    expect(screen.getByText('Respuesta padre')).toBeInTheDocument()
    expect(screen.getByText('Respuesta hija')).toBeInTheDocument()

    // Verificar data-testid de niveles
    expect(screen.getByTestId('reply-reply-1-level-0')).toBeInTheDocument()
    expect(screen.getByTestId('reply-reply-2-level-1')).toBeInTheDocument()
  })

  it('permite responder a una respuesta (crea hija con parent_reply_id)', async () => {
    const parent: ForumReplyWithAuthor = {
      id: 'reply-1', post_id: 'post-1', user_id: 'user-2',
      message: 'Respuesta padre', created_at: '2025-10-30T11:00:00Z', updated_at: '2025-10-30T11:00:00Z',
      author: { id: 'user-2', name: 'María López', email: 'maria@example.com' },
    }
    vi.spyOn(ForumAPI.default, 'getPost').mockResolvedValue(mockPost)
    vi.spyOn(ForumAPI.default, 'listReplies').mockResolvedValue([parent])
    const createSpy = vi.spyOn(ForumAPI.default, 'createReply').mockResolvedValue({
      id: 'reply-new', post_id: 'post-1', user_id: 'user-1', parent_reply_id: 'reply-1',
      message: 'Hija creada', created_at: '2025-10-30T11:20:00Z', updated_at: '2025-10-30T11:20:00Z',
      author: { id: 'user-1', name: 'Autor Uno', email: 'autor1@example.com' },
    })

    renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Respuesta padre')).toBeInTheDocument()
    })

  // Abrir formulario de respuesta en la respuesta padre, y operar dentro de ese contenedor
  const parentNode = screen.getByTestId('reply-reply-1-level-0')
  const parentScope = within(parentNode)
  fireEvent.click(parentScope.getByRole('button', { name: /Responder a esta respuesta/i }))

  const input = parentScope.getByLabelText('Tu respuesta') as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: '  Hija creada  ' } })
  fireEvent.click(parentScope.getByRole('button', { name: /^Responder$/i }))

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith('post-1', { message: 'Hija creada', parent_reply_id: 'reply-1' })
      expect(screen.getByText('Hija creada')).toBeInTheDocument()
      expect(screen.getByTestId('reply-reply-new-level-1')).toBeInTheDocument()
    })
  })
})
