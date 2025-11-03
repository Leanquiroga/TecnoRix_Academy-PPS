import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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
    user: { id: 'user-1', name: 'Autor Uno', email: 'autor1@example.com', role: 'student' },
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
  replies_count: 1,
}

const mockReplies: ForumReplyWithAuthor[] = [
  {
    id: 'reply-1',
    post_id: 'post-1',
    user_id: 'user-2',
    message: 'Primera respuesta',
    created_at: '2025-10-30T11:00:00Z',
    updated_at: '2025-10-30T11:00:00Z',
    author: { id: 'user-2', name: 'María López', email: 'maria@example.com' },
  },
]

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

describe('ForumPostDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza el post y sus respuestas', async () => {
    vi.spyOn(ForumAPI.default, 'getPost').mockResolvedValue(mockPost)
    vi.spyOn(ForumAPI.default, 'listReplies').mockResolvedValue(mockReplies)

    renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Post principal')).toBeInTheDocument()
    })

    expect(screen.getByText('Contenido del post principal')).toBeInTheDocument()
    expect(screen.getByText(/Primera respuesta/)).toBeInTheDocument()
    expect(screen.getByText(/Respuestas \(1\)/)).toBeInTheDocument()
  })

  it('permite enviar una respuesta y limpia el formulario', async () => {
    vi.spyOn(ForumAPI.default, 'getPost').mockResolvedValue(mockPost)
    vi.spyOn(ForumAPI.default, 'listReplies').mockResolvedValue([])
    vi.spyOn(ForumAPI.default, 'createReply').mockResolvedValue({
      id: 'reply-new',
      post_id: 'post-1',
      user_id: 'user-1',
      message: 'Mi nueva respuesta',
      created_at: '2025-10-30T12:00:00Z',
      updated_at: '2025-10-30T12:00:00Z',
      author: { id: 'user-1', name: 'Autor Uno', email: 'autor1@example.com' },
    })

    renderDetail()

    await waitFor(() => {
      expect(screen.getByText(/Agregar respuesta/i)).toBeInTheDocument()
    })

    const input = screen.getByLabelText('Tu respuesta') as HTMLTextAreaElement
    const submit = screen.getByRole('button', { name: /responder/i })

    fireEvent.change(input, { target: { value: '  Mi nueva respuesta  ' } })
    expect(submit).toBeEnabled()

    fireEvent.click(submit)

    // Debe limpiar el campo y mostrar la nueva respuesta
    await waitFor(() => {
      expect(input.value).toBe('')
      expect(screen.getByText('Mi nueva respuesta')).toBeInTheDocument()
    })
  })

  it('enfoca el formulario cuando la URL incluye #reply', async () => {
    vi.spyOn(ForumAPI.default, 'getPost').mockResolvedValue(mockPost)
    vi.spyOn(ForumAPI.default, 'listReplies').mockResolvedValue(mockReplies)

    renderDetail('/courses/course-1/forum/post-1#reply')

    // Espera a que el formulario esté presente y verifique el foco en el textarea
    const input = await screen.findByLabelText('Tu respuesta') as HTMLTextAreaElement
    await waitFor(() => {
      expect(input).toHaveFocus()
    })
  })

  it('permite eliminar un post propio y navega al foro', async () => {
    vi.spyOn(ForumAPI.default, 'getPost').mockResolvedValue(mockPost)
    vi.spyOn(ForumAPI.default, 'listReplies').mockResolvedValue(mockReplies)
    const delSpy = vi.spyOn(ForumAPI.default, 'deletePost').mockResolvedValue()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderDetail('/courses/course-1/forum/post-1')

    // Esperar render del post
    await waitFor(() => {
      expect(screen.getByText('Post principal')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Eliminar post/i }))

    await waitFor(() => {
      expect(delSpy).toHaveBeenCalledWith('post-1')
    })

    // Debe navegar al listado del foro
    await waitFor(() => {
      expect(screen.getByText('Foro del curso')).toBeInTheDocument()
    })

    confirmSpy.mockRestore()
  })

  it('permite eliminar una respuesta propia y la remueve del listado', async () => {
    // Respuesta del propio usuario
    const ownReply: ForumReplyWithAuthor = {
      id: 'reply-own',
      post_id: 'post-1',
      user_id: 'user-1',
      message: 'Mi respuesta',
      created_at: '2025-10-30T12:30:00Z',
      updated_at: '2025-10-30T12:30:00Z',
      author: { id: 'user-1', name: 'Autor Uno', email: 'autor1@example.com' },
    }
    vi.spyOn(ForumAPI.default, 'getPost').mockResolvedValue(mockPost)
    vi.spyOn(ForumAPI.default, 'listReplies').mockResolvedValue([ownReply])
    const delReplySpy = vi.spyOn(ForumAPI.default, 'deleteReply').mockResolvedValue()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderDetail('/courses/course-1/forum/post-1')

    await waitFor(() => {
      expect(screen.getByText('Mi respuesta')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Eliminar respuesta/i }))

    await waitFor(() => {
      expect(delReplySpy).toHaveBeenCalledWith('reply-own')
    })

    await waitFor(() => {
      expect(screen.queryByText('Mi respuesta')).not.toBeInTheDocument()
    })

    confirmSpy.mockRestore()
  })
})
