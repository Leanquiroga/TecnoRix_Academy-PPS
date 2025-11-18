// Reglas y validaciones compartidas para quizzes
import { QuestionType } from '../types/quiz.types'

export const QUIZ_CONSTANTS = {
  MIN_TITLE_LENGTH: 3,
  MIN_QUESTION_LENGTH: 6,
  MIN_OPTIONS: 2,
  PASSING_SCORE_MIN: 0,
  PASSING_SCORE_MAX: 100,
}

export interface QuizOptionInput {
  option_text: string
  is_correct: boolean
}
export interface QuizQuestionInput {
  question_text: string
  type: QuestionType
  points: number
  options: QuizOptionInput[]
}

export function validateQuizMeta(title: string, passingScore: number): string | null {
  const t = title.trim()
  if (t.length < QUIZ_CONSTANTS.MIN_TITLE_LENGTH) {
    return `El título debe tener al menos ${QUIZ_CONSTANTS.MIN_TITLE_LENGTH} caracteres`
  }
  if (passingScore < QUIZ_CONSTANTS.PASSING_SCORE_MIN || passingScore > QUIZ_CONSTANTS.PASSING_SCORE_MAX) {
    return `La nota de aprobación debe estar entre ${QUIZ_CONSTANTS.PASSING_SCORE_MIN} y ${QUIZ_CONSTANTS.PASSING_SCORE_MAX}`
  }
  return null
}

export function validateQuestion(q: QuizQuestionInput, index: number): string | null {
  const qt = q.question_text.trim()
  if (qt.length < QUIZ_CONSTANTS.MIN_QUESTION_LENGTH) {
    return `La pregunta ${index + 1} debe tener al menos ${QUIZ_CONSTANTS.MIN_QUESTION_LENGTH} caracteres`
  }
  if (!q.options || q.options.length < QUIZ_CONSTANTS.MIN_OPTIONS) {
    return `La pregunta ${index + 1} debe tener al menos ${QUIZ_CONSTANTS.MIN_OPTIONS} opciones`
  }
  const correctCount = q.options.filter(o => o.is_correct).length
  if (correctCount === 0) {
    return `La pregunta ${index + 1} debe tener al menos una opción correcta`
  }
  if ((q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE) && correctCount > 1) {
    return `La pregunta ${index + 1} solo puede tener una opción correcta`
  }
  for (let j = 0; j < q.options.length; j++) {
    if (!q.options[j].option_text.trim()) {
      return `La opción ${j + 1} de la pregunta ${index + 1} no puede estar vacía`
    }
  }
  return null
}

export function validateQuestions(questions: QuizQuestionInput[]): string | null {
  if (!questions.length) {
    return 'El quiz debe tener al menos una pregunta'
  }
  for (let i = 0; i < questions.length; i++) {
    const error = validateQuestion(questions[i], i)
    if (error) return error
  }
  return null
}

export function buildCreatePayload(meta: {
  courseId: string
  title: string
  description: string
  passingScore: number
  timeLimit: number | ''
  maxAttempts: number | ''
}, questions: QuizQuestionInput[]) {
  return {
    course_id: meta.courseId,
    title: meta.title,
    description: meta.description,
    passing_score: meta.passingScore,
    time_limit_minutes: meta.timeLimit === '' ? undefined : Number(meta.timeLimit),
    max_attempts: meta.maxAttempts === '' ? undefined : Number(meta.maxAttempts),
    questions: questions.map((q, idx) => ({
      question_text: q.question_text,
      type: q.type,
      points: q.points,
      order_index: idx + 1,
      options: q.options.map((o, j) => ({ option_text: o.option_text, is_correct: o.is_correct, order_index: j + 1 })),
    })),
  }
}

// Helper para asegurar una sola opción correcta en tipos de selección única
export function enforceSingleCorrect(options: QuizOptionInput[], setIndex: number): QuizOptionInput[] {
  return options.map((opt, idx) => ({ ...opt, is_correct: idx === setIndex }))
}
