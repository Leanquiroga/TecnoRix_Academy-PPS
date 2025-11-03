import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Container, Typography, Button, Stack, List, Divider, Alert, CircularProgress } from '@mui/material'
import { Breadcrumbs } from '../components/navigation/Breadcrumbs'
import { useForumStore } from '../store/forum.store'
import { useNavigation } from '../hooks/useNavigation'
import { useNotify } from '../hooks/useNotify'
import { ForumPost } from '../components/forum/ForumPost'
import { ForumPostForm } from '../components/forum/ForumPostForm'
import { useEnrollmentStore } from '../store/enrollment.store'
import { useAuthStore } from '../store/auth.store'

export default function CourseForum() {
  const { id } = useParams<{ id: string }>()
  const { fetchPosts, createPost, posts, loading, error, clear, deletePost } = useForumStore()
  const { goToCourse, goToForumPost, goToForumPostReply } = useNavigation()
  const notify = useNotify()
  const { myCourses, fetchMyCourses } = useEnrollmentStore()
  const { user } = useAuthStore()
  const [submitting, setSubmitting] = useState(false)
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (!id) return
    fetchPosts(id)
    return () => clear()
  }, [id, fetchPosts, clear])

  // Validar acceso básico en frontend: estudiantes deben estar inscritos; teacher/admin acceso directo
  useEffect(() => {
    const verifyAccess = async () => {
      if (!id) return
      if (!user) { setAllowed(false); return }
      if (user.role === 'teacher' || user.role === 'admin') { setAllowed(true); return }
      // Estudiante: verificar inscripción
      try {
        if (myCourses.length === 0) {
          await fetchMyCourses()
        }
        const enrolled = myCourses.some((e) => e.course_id === id)
        setAllowed(enrolled)
      } catch {
        setAllowed(false)
      }
    }
    verifyAccess()
  }, [id, user, myCourses, fetchMyCourses])

  const onSubmit = async ({ title, message }: { title: string; message: string }) => {
    if (!id) return
    try {
      setSubmitting(true)
      await createPost(id, { title, message })
      notify({ title: 'Post creado', message: 'Tu post se publicó correctamente', severity: 'success' })
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      const msg = error?.response?.data?.error || 'No se pudo crear el post'
      notify({ title: 'Error', message: msg, severity: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const customBreadcrumbs = [
    { label: 'Cursos', path: '/courses' },
    id ? { label: 'Detalle', path: `/courses/${id}` } : { label: 'Detalle' },
    { label: 'Foro' },
  ]

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Breadcrumbs customItems={customBreadcrumbs} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Foro del Curso</Typography>
        <Button variant="text" onClick={() => id && goToCourse(id)}>Volver al curso</Button>
      </Stack>

      {/* Formulario de nuevo post */}
      <ForumPostForm onSubmit={onSubmit} submitting={submitting} />

      {/* Estado de carga / error */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* Lista de posts */}
      {posts.length === 0 && !loading ? (
        <Box sx={{ p: 3, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper' }}>
          <Typography variant="body1" color="text.secondary">No hay posts aún. ¡Sé el primero en publicar!</Typography>
        </Box>
      ) : (
        <List>
          {posts.map((p, idx) => (
            <Box key={p.id}>
              <ForumPost post={p} onClick={() => id && goToForumPost(id, p.id)} />
              <Box sx={{ mt: 1, mb: 1, display: 'flex', gap: 1 }}>
                <Button size="small" variant="text" onClick={() => id && goToForumPostReply(id, p.id)}>
                  Responder
                </Button>
                {user?.id === p.user_id && (
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    onClick={async () => {
                      const confirmed = window.confirm('¿Eliminar este post? Esta acción no se puede deshacer.')
                      if (!confirmed) return
                      try {
                        await deletePost(p.id)
                        notify({ title: 'Post eliminado', message: 'El post fue eliminado correctamente', severity: 'success' })
                      } catch (err) {
                        const error = err as { response?: { data?: { error?: string } } }
                        const msg = error?.response?.data?.error || 'No se pudo eliminar el post'
                        notify({ title: 'Error', message: msg, severity: 'error' })
                      }
                    }}
                    aria-label={`Eliminar post ${p.title}`}
                  >
                    Eliminar
                  </Button>
                )}
              </Box>
              {idx < posts.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))}
        </List>
      )}
    
      {/* Restricción de acceso */}
      {allowed === false && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          No tienes acceso a este foro. Debes estar inscrito en el curso.
        </Alert>
      )}
    </Container>
  )
}
