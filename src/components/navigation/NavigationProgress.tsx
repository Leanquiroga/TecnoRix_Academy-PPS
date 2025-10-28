import { Box, Stepper, Step, StepLabel, Typography, Stack } from '@mui/material'

interface NavigationProgressProps {
  /**
   * Índice actual (0-based)
   */
  currentIndex: number
  /**
   * Total de items
   */
  total: number
  /**
   * Etiquetas personalizadas para cada step (opcional)
   */
  labels?: string[]
  /**
   * Variante del componente
   * - "stepper": Muestra stepper horizontal con líneas conectoras
   * - "text": Solo muestra "X de Y"
   */
  variant?: 'stepper' | 'text'
  /**
   * Orientación del stepper (solo aplica para variant="stepper")
   */
  orientation?: 'horizontal' | 'vertical'
}

/**
 * Componente de progreso de navegación
 * Muestra la posición actual en una secuencia de items
 */
export function NavigationProgress({
  currentIndex,
  total,
  labels,
  variant = 'text',
  orientation = 'horizontal',
}: NavigationProgressProps) {
  if (total === 0) {
    return null
  }

  if (variant === 'text') {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {currentIndex + 1} de {total}
        </Typography>
      </Stack>
    )
  }

  // variant === 'stepper'
  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={currentIndex} orientation={orientation}>
        {Array.from({ length: total }).map((_, index) => (
          <Step key={index} completed={index < currentIndex}>
            <StepLabel>
              {labels && labels[index] ? labels[index] : `Paso ${index + 1}`}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  )
}

export default NavigationProgress
