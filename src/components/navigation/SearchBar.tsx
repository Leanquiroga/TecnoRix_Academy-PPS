import { useState } from 'react'
import {
  TextField,
  InputAdornment,
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material'
import { Search } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { listPublicCourses } from '../../api/course.service'
import type { CoursePublic } from '../../types/course'

interface SearchBarProps {
  /**
   * Placeholder del input
   */
  placeholder?: string
  /**
   * Ancho del input (por defecto 300px en md+)
   */
  width?: string | number
}

/**
 * Barra de búsqueda global para cursos
 * Muestra resultados en tiempo real mientras el usuario escribe
 */
export function SearchBar({ placeholder = 'Buscar cursos...', width = 300 }: SearchBarProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CoursePublic[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleSearch = async (searchText: string) => {
    setQuery(searchText)
    
    if (searchText.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    try {
      setLoading(true)
      const courses = await listPublicCourses()
      const filtered = courses.filter((c) =>
        c.title.toLowerCase().includes(searchText.toLowerCase()) ||
        c.description.toLowerCase().includes(searchText.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchText.toLowerCase())
      ).slice(0, 5) // Limitar a 5 resultados
      setResults(filtered)
      setShowResults(true)
    } catch (err) {
      console.error('Error al buscar:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCourse = (courseId: string) => {
    navigate(`/courses/${courseId}`)
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <Box sx={{ position: 'relative', width: { xs: '100%', md: width } }}>
      <TextField
        fullWidth
        size="small"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        onFocus={() => query.length >= 2 && setShowResults(true)}
        placeholder={placeholder}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? <CircularProgress size={20} /> : <Search />}
            </InputAdornment>
          ),
        }}
      />

      {showResults && results.length > 0 && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1300,
          }}
        >
          <List disablePadding>
            {results.map((course) => (
              <ListItem key={course.id} disablePadding>
                <ListItemButton onClick={() => handleSelectCourse(course.id)}>
                  <ListItemText
                    primary={course.title}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        {course.category && (
                          <Chip label={course.category} size="small" variant="outlined" />
                        )}
                        {course.level && (
                          <Chip label={course.level} size="small" variant="outlined" />
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {showResults && results.length === 0 && query.length >= 2 && !loading && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            p: 2,
            zIndex: 1300,
          }}
        >
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No se encontraron cursos
          </Typography>
        </Paper>
      )}
    </Box>
  )
}

export default SearchBar
