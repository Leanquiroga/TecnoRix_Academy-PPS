import { useEffect, useState } from 'react'
import { Box, Container, Typography, CircularProgress, Alert, Button } from '@mui/material'
import { listPublicCourses } from '../../api/course.service'
import type { CoursePublic } from '../../types/course'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routes.config'
import { CourseCard } from '../CourseCard'

export function FeaturedCourses() {
  const [courses, setCourses] = useState<CoursePublic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function fetchCourses() {
      try {
        const data = await listPublicCourses()
        if (!active) return
        setCourses(data.slice(0, 4))
      } catch (e: any) {
        setError(e.message || 'Error al cargar cursos')
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
    return () => { active = false }
  }, [])

  return (
    <Box component="section" sx={{ py: { xs: 6, md: 8 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h2"
          sx={{ textAlign: 'center', fontWeight: 'bold', mb: 4 }}
        >
          Cursos Más Populares
        </Typography>

        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && courses.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Aún no hay cursos disponibles.
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }
          }}
        >
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </Box>

        <Box textAlign="center" mt={4}>
          <Button
            component={Link}
            to={ROUTES.COURSES}
            variant="outlined"
          >
            Ver todos los cursos
          </Button>
        </Box>
      </Container>
    </Box>
  )
}

export default FeaturedCourses
