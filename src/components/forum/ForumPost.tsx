import { Card, CardContent, Stack, Typography, CardActionArea } from '@mui/material'
import type { ForumPostWithAuthor } from '../../types/forum'

interface Props {
  post: ForumPostWithAuthor
  onClick?: () => void
}

export function ForumPost({ post, onClick }: Props) {
  const content = (
    <CardContent>
      <Stack spacing={1}>
        <Typography variant="h6">{post.title}</Typography>
        <Typography variant="body2" color="text.secondary">{post.message}</Typography>
        <Typography variant="caption" color="text.secondary">
          Por {post.author?.name ?? 'Usuario'} • {new Date(post.created_at).toLocaleString()} • {post.replies_count ?? 0} respuestas
        </Typography>
      </Stack>
    </CardContent>
  )

  return (
    <Card variant="outlined">
      {onClick ? (
        <CardActionArea onClick={onClick}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  )
}

export default ForumPost
