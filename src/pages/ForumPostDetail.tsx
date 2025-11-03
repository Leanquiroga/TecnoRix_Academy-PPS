import { useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  TextField,
} from '@mui/material'
import { Breadcrumbs } from '../components/navigation/Breadcrumbs'
import { useForumStore } from '../store/forum.store'
import { useNavigation } from '../hooks/useNavigation'
import { useNotify } from '../hooks/useNotify'
import { ForumReplyItem, type ReplyNode } from '../components/forum/ForumReplyItem'
import { useAuthStore } from '../store/auth.store'
import { useEnrollmentStore } from '../store/enrollment.store'

export default function ForumPostDetail() {
  const { id: courseId, postId } = useParams<{ id: string; postId: string }>()
  const location = useLocation()
  const { fetchPost, fetchReplies, createReply, currentPost, replies, loading, error, clear } = useForumStore()
  const { goToCourseForum } = useNavigation()
  const notify = useNotify()
  const { user } = useAuthStore()
  const { myCourses, fetchMyCourses } = useEnrollmentStore()
  const [replyMessage, setReplyMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null)
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (!postId) return
    fetchPost(postId)
    fetchReplies(postId)
    return () => clear()
  }, [postId, fetchPost, fetchReplies, clear])

  // Si la URL incluye #reply, enfocar y desplazar al formulario una vez que el post esté cargado
  useEffect(() => {
    if (currentPost && location.hash === '#reply') {
      // Esperar al siguiente frame para asegurar que el TextField esté en el DOM
      setTimeout(() => {
        const el = document.getElementById('reply')
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        replyInputRef.current?.focus()
      }, 0)
    }
  }, [currentPost, location.hash])

  // Validar acceso: estudiantes deben estar inscritos; teacher/admin acceso directo
  const requestedEnrollmentsRef = useRef(false)
  useEffect(() => {
    const verifyAccess = async () => {
      if (!courseId) return
      if (!user) { setAllowed(false); return }
      if (user.role === 'teacher' || user.role === 'admin') { setAllowed(true); return }
      try {
        if (myCourses.length === 0 && !requestedEnrollmentsRef.current) {
          requestedEnrollmentsRef.current = true
          await fetchMyCourses()
        }
        const enrolled = myCourses.some((e) => e.course_id === courseId)
        setAllowed(enrolled)
      } catch {
        setAllowed(false)
      }
    }
    void verifyAccess()
  }, [courseId, user, myCourses, fetchMyCourses])

  const onSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postId || !replyMessage.trim()) return
    try {
      setSubmitting(true)
      await createReply(postId, { message: replyMessage.trim() })
      setReplyMessage('')
      notify({ title: 'Respuesta publicada', message: 'Tu respuesta se publicó correctamente', severity: 'success' })
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      const msg = error?.response?.data?.error || 'No se pudo publicar la respuesta'
      notify({ title: 'Error', message: msg, severity: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const onDeletePost = async () => {
    if (!currentPost) return
    if (!courseId) return
    const confirmed = window.confirm('¿Eliminar este post? Esta acción no se puede deshacer.')
    if (!confirmed) return
    try {
      await useForumStore.getState().deletePost(currentPost.id)
      notify({ title: 'Post eliminado', message: 'El post fue eliminado correctamente', severity: 'success' })
      goToCourseForum(courseId)
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      const msg = error?.response?.data?.error || 'No se pudo eliminar el post'
      notify({ title: 'Error', message: msg, severity: 'error' })
    }
  }

  const customBreadcrumbs = [
    { label: 'Cursos', path: '/courses' },
    courseId ? { label: 'Detalle', path: `/courses/${courseId}` } : { label: 'Detalle' },
    courseId ? { label: 'Foro', path: `/courses/${courseId}/forum` } : { label: 'Foro' },
    { label: 'Post' },
  ]

  // Construir árbol de respuestas a partir de la lista plana
  const buildReplyTree = (all: typeof replies): ReplyNode[] => {
    const map = new Map<string, ReplyNode>()
    const roots: ReplyNode[] = []
    all.forEach((r) => {
      map.set(r.id, { reply: r, children: [] })
    })
    all.forEach((r) => {
      const parentId = r.parent_reply_id || null
      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children.push(map.get(r.id)!)
      } else {
        roots.push(map.get(r.id)!)
      }
    })
    return roots
  }

  const replyTree = buildReplyTree(replies)

  const handleReplyToReply = async (parentReplyId: string, message: string) => {
    if (!postId) return
    try {
      setSubmitting(true)
      await createReply(postId, { message, parent_reply_id: parentReplyId })
      notify({ title: 'Respuesta publicada', message: 'Tu respuesta se publicó correctamente', severity: 'success' })
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      const msg = error?.response?.data?.error || 'No se pudo publicar la respuesta'
      notify({ title: 'Error', message: msg, severity: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Breadcrumbs customItems={customBreadcrumbs} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Discusión</Typography>
        <Button variant="text" onClick={() => courseId && goToCourseForum(courseId)}>
          Volver al foro
        </Button>
      </Stack>

      {/* Restricción de acceso */}
      {allowed === false && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No tienes acceso a este foro. Debes estar inscrito en el curso.
        </Alert>
      )}

      {/* Estado de carga / error */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Post principal */}
      {currentPost && !loading && (
        <>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {currentPost.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {currentPost.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Por {currentPost.author?.name ?? 'Usuario'} • {new Date(currentPost.created_at).toLocaleString()}
              </Typography>
              {user?.id === currentPost.user_id && (
                <Box sx={{ mt: 1 }}>
                  <Button size="small" color="error" variant="text" onClick={onDeletePost} aria-label="Eliminar post">
                    Eliminar post
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          <Divider sx={{ my: 3 }} />

          {/* Formulario de respuesta */}
          <Paper id="reply" sx={{ p: 2, mb: 3 }} component="form" onSubmit={onSubmitReply}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Agregar respuesta
            </Typography>
            <TextField
              label="Tu respuesta"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              sx={{ mb: 2 }}
              inputRef={replyInputRef}
              autoFocus={location.hash === '#reply'}
            />
            <Button type="submit" variant="contained" disabled={submitting || !replyMessage.trim()}>
              Responder
            </Button>
          </Paper>

          {/* Lista de respuestas */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            Respuestas ({replies.length})
          </Typography>
          {replies.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper' }}>
              <Typography variant="body2" color="text.secondary">
                No hay respuestas aún. ¡Sé el primero en responder!
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {replyTree.map((node) => (
                <Paper key={node.reply.id} sx={{ p: 2 }}>
                  {/* Mantener compatibilidad visual con ForumReply simple en el nivel 0 */}
                  <ForumReplyItem
                    node={node}
                    level={0}
                    currentUserId={user?.id ?? null}
                    onDelete={async (rid) => {
                      const confirmed = window.confirm('¿Eliminar esta respuesta?')
                      if (!confirmed) return
                      try {
                        await useForumStore.getState().deleteReply(rid)
                        notify({ title: 'Respuesta eliminada', message: 'La respuesta fue eliminada', severity: 'success' })
                      } catch (err) {
                        const error = err as { response?: { data?: { error?: string } } }
                        const msg = error?.response?.data?.error || 'No se pudo eliminar la respuesta'
                        notify({ title: 'Error', message: msg, severity: 'error' })
                      }
                    }}
                    onReply={handleReplyToReply}
                    allowReply={allowed !== false}
                  />
                </Paper>
              ))}
            </Stack>
          )}
        </>
      )}
    </Container>
  )
}
