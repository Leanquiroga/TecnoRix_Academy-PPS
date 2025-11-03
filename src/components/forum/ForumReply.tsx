import { Stack, Typography, Button } from '@mui/material'
import type { ForumReplyWithAuthor } from '../../types/forum'

interface Props {
  reply: ForumReplyWithAuthor
  canDelete?: boolean
  onDelete?: () => void
}

export function ForumReply({ reply, canDelete, onDelete }: Props) {
  return (
    <Stack spacing={0.5} sx={{ pl: 2 }}>
      <Typography variant="body2">{reply.message}</Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="caption" color="text.secondary">
          Por {reply.author?.name ?? 'Usuario'} • {new Date(reply.created_at).toLocaleString()}
        </Typography>
        {canDelete && (
          <Button size="small" color="error" variant="text" onClick={onDelete} aria-label="Eliminar respuesta">
            Eliminar
          </Button>
        )}
      </Stack>
    </Stack>
  )
}

export default ForumReply
