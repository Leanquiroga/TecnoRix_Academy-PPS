import { useState } from 'react'
import { Box, Stack, Typography, Button, TextField } from '@mui/material'
import type { ForumReplyWithAuthor } from '../../types/forum'

export interface ReplyNode {
  reply: ForumReplyWithAuthor
  children: ReplyNode[]
}

interface Props {
  node: ReplyNode
  level?: number
  currentUserId?: string | null
  onDelete?: (replyId: string) => Promise<void> | void
  onReply?: (parentReplyId: string, message: string) => Promise<void> | void
  allowReply?: boolean
}

export function ForumReplyItem({ node, level = 0, currentUserId, onDelete, onReply, allowReply = true }: Props) {
  const { reply, children } = node
  const canDelete = currentUserId === reply.user_id
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !onReply) return
    await onReply(reply.id, message.trim())
    setMessage('')
    setShowForm(false)
  }

  return (
    <Box data-testid={`reply-${reply.id}-level-${level}`} sx={{ pl: level * 2 }}>
      <Stack spacing={0.5}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{reply.message}</Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Por {reply.author?.name ?? 'Usuario'} • {new Date(reply.created_at).toLocaleString()}
          </Typography>
          {allowReply && (
            <Button size="small" variant="text" onClick={() => setShowForm((v) => !v)} aria-label="Responder a esta respuesta">
              Responder
            </Button>
          )}
          {canDelete && (
            <Button size="small" color="error" variant="text" onClick={() => onDelete?.(reply.id)} aria-label="Eliminar respuesta">
              Eliminar
            </Button>
          )}
        </Stack>

        {showForm && allowReply && (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              label="Tu respuesta"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button type="submit" variant="contained" size="small" disabled={!message.trim()}>
                Responder
              </Button>
              <Button variant="text" size="small" onClick={() => { setShowForm(false); setMessage('') }}>
                Cancelar
              </Button>
            </Stack>
          </Box>
        )}
      </Stack>

      {/* Hijos */}
      {children.length > 0 && (
        <Stack spacing={2} sx={{ mt: 1 }}>
          {children.map((child) => (
            <ForumReplyItem
              key={child.reply.id}
              node={child}
              level={level + 1}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onReply={onReply}
              allowReply={allowReply}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}

export default ForumReplyItem
