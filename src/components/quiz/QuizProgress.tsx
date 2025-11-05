import React from 'react'
import { LinearProgress, Box, Typography } from '@mui/material'

interface Props {
  current: number
  total: number
}

const QuizProgress: React.FC<Props> = ({ current, total }) => {
  const percent = Math.round(((current + 1) / Math.max(total, 1)) * 100)
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Pregunta {current + 1} de {total}
      </Typography>
      <LinearProgress variant="determinate" value={percent} />
    </Box>
  )
}

export default QuizProgress
