/**
 * Tipos para el sistema de evaluaciones y quizzes (Frontend)
 */

/**
 * Tipos de preguntas soportadas
 */
export const QuestionType = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  MULTIPLE_ANSWER: 'multiple_answer',
} as const

export type QuestionType = typeof QuestionType[keyof typeof QuestionType]

/**
 * Labels para los tipos de preguntas
 */
export const QuestionTypeLabels: Record<string, string> = {
  [QuestionType.MULTIPLE_CHOICE]: 'Opción Múltiple',
  [QuestionType.TRUE_FALSE]: 'Verdadero/Falso',
  [QuestionType.MULTIPLE_ANSWER]: 'Respuesta Múltiple',
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
  created_at: string
  updated_at: string
  deleted_at?: string | null
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
  created_at: string
  updated_at: string
  deleted_at?: string | null
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
  created_at: string
  updated_at: string
}

/**
 * Opción de pregunta sin revelar la respuesta correcta (para estudiantes durante el intento)
 */
export interface QuestionOptionPublic {
  id: string
  question_id: string
  option_text: string
  order_index: number
  created_at: string
  updated_at: string
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
  started_at: string
  submitted_at?: string | null
  time_taken_minutes?: number | null
  created_at: string
  updated_at: string
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
  created_at: string
  updated_at: string
}

/**
 * Quiz con preguntas y opciones incluidas
 */
export interface QuizWithQuestions extends Quiz {
  questions: QuestionWithOptions[]
}

/**
 * Quiz con preguntas y opciones públicas (sin respuestas correctas)
 */
export interface QuizWithQuestionsPublic extends Quiz {
  questions: QuestionWithOptionsPublic[]
}

/**
 * Pregunta con opciones incluidas
 */
export interface QuestionWithOptions extends Question {
  options: QuestionOption[]
}

/**
 * Pregunta con opciones públicas (sin respuestas correctas)
 */
export interface QuestionWithOptionsPublic extends Question {
  options: QuestionOptionPublic[]
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
  correct_option?: {
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
 * DTO para enviar respuestas de un quiz
 */
export interface SubmitQuizInput {
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
 * Respuesta del API al crear un quiz
 */
export interface CreateQuizResponse {
  success: boolean
  data: QuizWithQuestions
  message: string
}

/**
 * Respuesta del API al iniciar un intento
 */
export interface StartQuizAttemptResponse {
  success: boolean
  data: {
    attempt: QuizAttempt
    quiz: QuizWithQuestionsPublic  // Sin respuestas correctas durante el intento
  }
  message: string
}

/**
 * Respuesta del API al enviar un quiz
 */
export interface SubmitQuizResponse {
  success: boolean
  data: QuizAttemptWithDetails
  passed: boolean
  message: string
}

/**
 * Respuesta del API al listar quizzes
 */
export interface ListQuizzesResponse {
  success: boolean
  data: QuizWithQuestions[]
  message?: string
}

/**
 * Respuesta del API al obtener un quiz
 */
export interface GetQuizResponse {
  success: boolean
  data: QuizWithQuestions
  message?: string
}

/**
 * Respuesta del API al obtener intentos
 */
export interface GetAttemptsResponse {
  success: boolean
  data: QuizAttempt[]
  message?: string
}

/**
 * Respuesta del API al obtener detalles de un intento
 */
export interface GetAttemptDetailsResponse {
  success: boolean
  data: QuizAttemptWithDetails
  message?: string
}

/**
 * Respuesta del API al obtener estadísticas
 */
export interface GetStatisticsResponse {
  success: boolean
  data: QuizStatistics
  message?: string
}

/**
 * Estado de un quiz para el estudiante
 */
export interface QuizStudentStatus {
  quiz: QuizWithQuestions
  attempts_count: number
  best_score?: number
  last_attempt?: QuizAttempt
  can_attempt: boolean
  max_attempts_reached: boolean
}

/**
 * Respuestas temporales del usuario (antes de enviar)
 */
export interface TempQuizAnswers {
  [questionId: string]: string | string[] // option_id o array de option_ids
}
