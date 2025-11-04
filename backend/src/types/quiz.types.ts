/**
 * Tipos para el sistema de evaluaciones y quizzes
 */

/**
 * Tipos de preguntas soportadas
 */
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  MULTIPLE_ANSWER = 'multiple_answer',
}

/**
 * Interfaz de Quiz
 */
export interface Quiz {
  id: string
  course_id: string
  title: string
  description?: string | null
  passing_score: number
  time_limit_minutes?: number | null
  max_attempts?: number | null
  order_index: number
  created_at: Date
  updated_at: Date
  deleted_at?: Date | null
}

/**
 * Interfaz de Pregunta
 */
export interface Question {
  id: string
  quiz_id: string
  question_text: string
  type: QuestionType
  points: number
  order_index: number
  explanation?: string | null
  created_at: Date
  updated_at: Date
  deleted_at?: Date | null
}

/**
 * Interfaz de Opción de Pregunta
 */
export interface QuestionOption {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  order_index: number
  created_at: Date
  updated_at: Date
}

/**
 * Interfaz de Intento de Quiz
 */
export interface QuizAttempt {
  id: string
  student_id: string
  quiz_id: string
  score?: number | null
  total_points?: number | null
  percentage?: number | null
  passed?: boolean | null
  attempt_number: number
  started_at: Date
  submitted_at?: Date | null
  time_taken_minutes?: number | null
  created_at: Date
  updated_at: Date
}

/**
 * Interfaz de Respuesta del Estudiante
 */
export interface StudentAnswer {
  id: string
  attempt_id: string
  question_id: string
  selected_option_id?: string | null
  is_correct?: boolean | null
  points_earned?: number | null
  created_at: Date
  updated_at: Date
}

/**
 * Quiz con preguntas y opciones incluidas
 */
export interface QuizWithQuestions extends Quiz {
  questions: QuestionWithOptions[]
}

/**
 * Pregunta con opciones incluidas
 */
export interface QuestionWithOptions extends Question {
  options: QuestionOption[]
}

/**
 * Intento de quiz con respuestas y datos del estudiante
 */
export interface QuizAttemptWithDetails extends QuizAttempt {
  student: {
    id: string
    name: string
    email: string
  }
  quiz: {
    id: string
    title: string
    passing_score: number
  }
  answers: StudentAnswerWithDetails[]
}

/**
 * Respuesta del estudiante con detalles de pregunta y opción
 */
export interface StudentAnswerWithDetails extends StudentAnswer {
  question: {
    id: string
    question_text: string
    type: QuestionType
    points: number
    explanation?: string | null
  }
  selected_option?: {
    id: string
    option_text: string
    is_correct: boolean
  } | null
}

/**
 * DTO para crear un quiz
 */
export interface CreateQuizInput {
  course_id: string
  title: string
  description?: string
  passing_score: number
  time_limit_minutes?: number
  max_attempts?: number
  order_index?: number
  questions: CreateQuestionInput[]
}

/**
 * DTO para crear una pregunta
 */
export interface CreateQuestionInput {
  question_text: string
  type: QuestionType
  points: number
  order_index?: number
  explanation?: string
  options: CreateQuestionOptionInput[]
}

/**
 * DTO para crear una opción de pregunta
 */
export interface CreateQuestionOptionInput {
  option_text: string
  is_correct: boolean
  order_index?: number
}

/**
 * DTO para actualizar un quiz
 */
export interface UpdateQuizInput {
  title?: string
  description?: string
  passing_score?: number
  time_limit_minutes?: number
  max_attempts?: number
  order_index?: number
}

/**
 * DTO para actualizar una pregunta
 */
export interface UpdateQuestionInput {
  question_text?: string
  type?: QuestionType
  points?: number
  order_index?: number
  explanation?: string
}

/**
 * DTO para actualizar una opción de pregunta
 */
export interface UpdateQuestionOptionInput {
  option_text?: string
  is_correct?: boolean
  order_index?: number
}

/**
 * DTO para iniciar un intento de quiz
 */
export interface StartQuizAttemptInput {
  quiz_id: string
}

/**
 * DTO para enviar respuestas de un quiz
 */
export interface SubmitQuizInput {
  attempt_id: string
  answers: SubmitAnswerInput[]
}

/**
 * DTO para una respuesta individual
 */
export interface SubmitAnswerInput {
  question_id: string
  selected_option_id?: string
}

/**
 * Estadísticas de un quiz
 */
export interface QuizStatistics {
  quiz_id: string
  quiz_title: string
  total_attempts: number
  average_score: number
  pass_rate: number
  highest_score: number
  lowest_score: number
  average_time_minutes: number
}

/**
 * Estadísticas por pregunta
 */
export interface QuestionStatistics {
  question_id: string
  question_text: string
  total_answers: number
  correct_answers: number
  incorrect_answers: number
  accuracy_rate: number
}

/**
 * Respuesta del API al crear un quiz
 */
export interface CreateQuizResponse {
  quiz: QuizWithQuestions
  message: string
}

/**
 * Respuesta del API al iniciar un intento
 */
export interface StartQuizAttemptResponse {
  attempt: QuizAttempt
  quiz: QuizWithQuestions
  message: string
}

/**
 * Respuesta del API al enviar un quiz
 */
export interface SubmitQuizResponse {
  attempt: QuizAttemptWithDetails
  passed: boolean
  message: string
}
