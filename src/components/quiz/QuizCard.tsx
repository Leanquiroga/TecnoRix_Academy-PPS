import React from 'react'
import { Card, CardContent, CardActions, Typography, Stack, Chip, Button, Tooltip } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import type { QuizWithQuestions } from '../../types/quiz.types'

interface Props {
  quiz: QuizWithQuestions
  showProgressLink?: boolean
  disabled?: boolean
  disabledText?: string
}

const QuizCard: React.FC<Props> = ({ quiz, showProgressLink = false, disabled = false, disabledText }) => {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6" noWrap title={quiz.title}>{quiz.title}</Typography>
          {quiz.description && (
            <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {quiz.description}
            </Typography>
          )}
          <Stack direction="row" spacing={1}>
            <Chip size="small" label={`Aprobación ${quiz.passing_score}%`} />
            {quiz.time_limit_minutes ? (
              <Chip size="small" label={`${quiz.time_limit_minutes} min`} color="warning" />
            ) : (
              <Chip size="small" label="Sin límite" variant="outlined" />
            )}
            {quiz.max_attempts && <Chip size="small" label={`Intentos ${quiz.max_attempts}`} />}
          </Stack>
        </Stack>
      </CardContent>
      <CardActions>
        {disabled ? (
          <Tooltip title={disabledText || ''} disableHoverListener={!disabledText}>
            <span>
              <Button size="small" variant="contained" disabled>
                Tomar Quiz
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Button size="small" variant="contained" component={RouterLink} to={`/quizzes/${quiz.id}`}>
            Tomar Quiz
          </Button>
        )}
        {showProgressLink && (
          <Button size="small" component={RouterLink} to={`/quizzes/${quiz.id}/progress`}>
            Mi progreso
          </Button>
        )}
      </CardActions>
    </Card>
  )
}

export default QuizCard
