import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { CoursePublic, CourseLevel } from '../types/course';
import { listPublicCourses } from '../api/course.service';
import { CourseCard } from '../components/CourseCard';

export const CoursesList = () => {
  const [courses, setCourses] = useState<CoursePublic[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CoursePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<CourseLevel | 'all'>('all');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [courses, searchTerm, levelFilter]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listPublicCourses();
      setCourses(data);
    } catch (err) {
      setError('Error al cargar los cursos. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...courses];

    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(term) ||
          course.description.toLowerCase().includes(term)
      );
    }

    // Filtro de nivel
    if (levelFilter !== 'all') {
      filtered = filtered.filter((course) => course.level === levelFilter);
    }

    setFilteredCourses(filtered);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Cursos Disponibles
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filtros y búsqueda */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Buscar cursos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Nivel</InputLabel>
          <Select
            value={levelFilter}
            label="Nivel"
            onChange={(e) => setLevelFilter(e.target.value as CourseLevel | 'all')}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="beginner">Principiante</MenuItem>
            <MenuItem value="intermediate">Intermedio</MenuItem>
            <MenuItem value="advanced">Avanzado</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Lista de cursos */}
      {filteredCourses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {courses.length === 0
              ? 'No hay cursos disponibles en este momento.'
              : 'No se encontraron cursos con los filtros seleccionados.'}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </Box>
      )}
    </Container>
  );
};
