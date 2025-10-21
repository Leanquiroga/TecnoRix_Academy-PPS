import { Card, CardContent, CardActions, Typography, Button, Chip, Stack, Box } from '@mui/material';
import type { CoursePublic } from '../types/course';
import { useNavigate } from 'react-router-dom';

interface CourseCardProps {
  course: CoursePublic;
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/courses/${course.id}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Principiante';
      case 'intermediate':
        return 'Intermedio';
      case 'advanced':
        return 'Avanzado';
      default:
        return level;
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              {course.title}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {course.description}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {course.level && (
              <Chip 
                label={getLevelLabel(course.level)} 
                color={getLevelColor(course.level)}
                size="small"
              />
            )}
            {course.price !== null && (
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatPrice(course.price)}
              </Typography>
            )}
            {course.price === null && (
              <Chip label="Gratis" color="success" size="small" />
            )}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Instructor: {course.instructor_name || 'No especificado'}
          </Typography>
        </Stack>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button 
          variant="contained" 
          fullWidth 
          onClick={handleViewDetails}
        >
          Ver Detalles
        </Button>
      </CardActions>
    </Card>
  );
};
