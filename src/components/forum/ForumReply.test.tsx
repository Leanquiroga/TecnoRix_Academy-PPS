import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForumReply } from './ForumReply'
import type { ForumReplyWithAuthor } from '../../types/forum'

const mockReply: ForumReplyWithAuthor = {
  id: 'reply-1',
  post_id: 'post-1',
  user_id: 'user-2',
  message: 'Esta es una respuesta',
  created_at: '2025-10-30T11:00:00Z',
  updated_at: '2025-10-30T11:00:00Z',
  author: { id: 'user-2', name: 'María López', email: 'maria@example.com' },
}

describe('ForumReply', () => {
  it('renderiza mensaje y autor', () => {
    render(<ForumReply reply={mockReply} />)

    expect(screen.getByText('Esta es una respuesta')).toBeInTheDocument()
    expect(screen.getByText(/Por .*María/i)).toBeInTheDocument()
  })
})
