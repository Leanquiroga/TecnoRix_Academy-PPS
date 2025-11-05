import React from 'react'
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Checkbox, Box } from '@mui/material'
import type { QuestionWithOptions, QuestionWithOptionsPublic } from '../../types/quiz.types'
import { QuestionType } from '../../types/quiz.types'

interface Props {
  question: QuestionWithOptions | QuestionWithOptionsPublic
  value?: string | string[]
  onChange: (value: string | string[]) => void
}

const QuizQuestion: React.FC<Props> = ({ question, value, onChange }) => {
  // Logs de depuración eliminados

  const isMultiple = question.type === QuestionType.MULTIPLE_ANSWER

  if (isMultiple) {
    const selected: string[] = Array.isArray(value) ? value : []
    return (
      <FormControl component="fieldset" sx={{ width: '100%' }}>
        <FormLabel component="legend">{question.question_text}</FormLabel>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
          {question.options.map(opt => (
            <FormControlLabel
              key={opt.id}
              control={
                <Checkbox
                  checked={selected.includes(opt.id)}
                  onChange={(e) => {
                    const checked = e.target.checked
                    const next = checked
                      ? [...selected, opt.id]
                      : selected.filter(id => id !== opt.id)
                    onChange(next)
                  }}
                />
              }
              label={opt.option_text}
            />
          ))}
        </Box>
      </FormControl>
    )
  }

  // Single choice (incluye True/False)
  return (
    <FormControl component="fieldset" sx={{ width: '100%' }}>
      <FormLabel component="legend">{question.question_text}</FormLabel>
      <RadioGroup
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        sx={{ mt: 1 }}
      >
        {question.options.map(opt => (
          <FormControlLabel key={opt.id} value={opt.id} control={<Radio />} label={opt.option_text} />
        ))}
      </RadioGroup>
    </FormControl>
  )
}

export default QuizQuestion
