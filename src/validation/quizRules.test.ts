import { describe, it, expect } from 'vitest'
import {
  QUIZ_CONSTANTS,
  validateQuizMeta,
  validateQuestion,
  validateQuestions,
  buildCreatePayload,
  enforceSingleCorrect,
} from './quizRules'
import { QuestionType } from '../types/quiz.types'

describe('quizRules - validateQuizMeta', () => {
  it('debe rechazar título menor a 3 caracteres', () => {
    const error = validateQuizMeta('Ab', 70)
    expect(error).toContain('al menos 3 caracteres')
  })

  it('debe aceptar título de 3 caracteres', () => {
    const error = validateQuizMeta('Abc', 70)
    expect(error).toBeNull()
  })

  it('debe rechazar passing_score menor a 0', () => {
    const error = validateQuizMeta('Test Quiz', -1)
    expect(error).toContain('entre 0 y 100')
  })

  it('debe rechazar passing_score mayor a 100', () => {
    const error = validateQuizMeta('Test Quiz', 101)
    expect(error).toContain('entre 0 y 100')
  })

  it('debe aceptar passing_score entre 0 y 100', () => {
    expect(validateQuizMeta('Test Quiz', 0)).toBeNull()
    expect(validateQuizMeta('Test Quiz', 50)).toBeNull()
    expect(validateQuizMeta('Test Quiz', 100)).toBeNull()
  })

  it('debe recortar espacios del título antes de validar', () => {
    const error = validateQuizMeta('  Ab  ', 70)
    expect(error).toContain('al menos 3 caracteres')
  })
})

describe('quizRules - validateQuestion', () => {
  it('debe rechazar pregunta menor a 6 caracteres', () => {
    const question = {
      question_text: '¿Qué?',
      type: QuestionType.MULTIPLE_CHOICE,
      points: 10,
      options: [
        { option_text: 'A', is_correct: true },
        { option_text: 'B', is_correct: false },
      ],
    }
    const error = validateQuestion(question, 0)
    expect(error).toContain('al menos 6 caracteres')
  })

  it('debe aceptar pregunta de 6 o más caracteres', () => {
    const question = {
      question_text: '¿Válido?',
      type: QuestionType.MULTIPLE_CHOICE,
      points: 10,
      options: [
        { option_text: 'A', is_correct: true },
        { option_text: 'B', is_correct: false },
      ],
    }
    const error = validateQuestion(question, 0)
    expect(error).toBeNull()
  })

  it('debe rechazar pregunta con menos de 2 opciones', () => {
    const question = {
      question_text: '¿Pregunta válida?',
      type: QuestionType.MULTIPLE_CHOICE,
      points: 10,
      options: [{ option_text: 'Solo una', is_correct: true }],
    }
    const error = validateQuestion(question, 0)
    expect(error).toContain('al menos 2 opciones')
  })

  it('debe rechazar pregunta sin opciones correctas', () => {
    const question = {
      question_text: '¿Pregunta válida?',
      type: QuestionType.MULTIPLE_CHOICE,
      points: 10,
      options: [
        { option_text: 'A', is_correct: false },
        { option_text: 'B', is_correct: false },
      ],
    }
    const error = validateQuestion(question, 0)
    expect(error).toContain('al menos una opción correcta')
  })

  it('debe rechazar multiple_choice con más de una correcta', () => {
    const question = {
      question_text: '¿Pregunta válida?',
      type: QuestionType.MULTIPLE_CHOICE,
      points: 10,
      options: [
        { option_text: 'A', is_correct: true },
        { option_text: 'B', is_correct: true },
      ],
    }
    const error = validateQuestion(question, 0)
    expect(error).toContain('solo puede tener una opción correcta')
  })

  it('debe rechazar true_false con más de una correcta', () => {
    const question = {
      question_text: '¿Pregunta válida?',
      type: QuestionType.TRUE_FALSE,
      points: 10,
      options: [
        { option_text: 'Verdadero', is_correct: true },
        { option_text: 'Falso', is_correct: true },
      ],
    }
    const error = validateQuestion(question, 0)
    expect(error).toContain('solo puede tener una opción correcta')
  })

  it('debe aceptar multiple_answer con múltiples correctas', () => {
    const question = {
      question_text: '¿Pregunta válida?',
      type: QuestionType.MULTIPLE_ANSWER,
      points: 10,
      options: [
        { option_text: 'A', is_correct: true },
        { option_text: 'B', is_correct: true },
        { option_text: 'C', is_correct: false },
      ],
    }
    const error = validateQuestion(question, 0)
    expect(error).toBeNull()
  })

  it('debe rechazar opciones vacías', () => {
    const question = {
      question_text: '¿Pregunta válida?',
      type: QuestionType.MULTIPLE_CHOICE,
      points: 10,
      options: [
        { option_text: '', is_correct: true },
        { option_text: 'B', is_correct: false },
      ],
    }
    const error = validateQuestion(question, 0)
    expect(error).toContain('no puede estar vacía')
  })
})

describe('quizRules - validateQuestions', () => {
  it('debe rechazar lista vacía de preguntas', () => {
    const error = validateQuestions([])
    expect(error).toContain('al menos una pregunta')
  })

  it('debe validar todas las preguntas y retornar primer error', () => {
    const questions = [
      {
        question_text: '¿Primera pregunta válida?',
        type: QuestionType.MULTIPLE_CHOICE,
        points: 10,
        options: [
          { option_text: 'A', is_correct: true },
          { option_text: 'B', is_correct: false },
        ],
      },
      {
        question_text: 'Inv',
        type: QuestionType.MULTIPLE_CHOICE,
        points: 10,
        options: [
          { option_text: 'A', is_correct: true },
          { option_text: 'B', is_correct: false },
        ],
      },
    ]
    const error = validateQuestions(questions)
    expect(error).toContain('pregunta 2')
    expect(error).toContain('al menos 6 caracteres')
  })

  it('debe retornar null si todas las preguntas son válidas', () => {
    const questions = [
      {
        question_text: '¿Primera pregunta válida?',
        type: QuestionType.MULTIPLE_CHOICE,
        points: 10,
        options: [
          { option_text: 'A', is_correct: true },
          { option_text: 'B', is_correct: false },
        ],
      },
      {
        question_text: '¿Segunda pregunta válida?',
        type: QuestionType.TRUE_FALSE,
        points: 5,
        options: [
          { option_text: 'Verdadero', is_correct: true },
          { option_text: 'Falso', is_correct: false },
        ],
      },
    ]
    const error = validateQuestions(questions)
    expect(error).toBeNull()
  })
})

describe('quizRules - buildCreatePayload', () => {
  it('debe construir payload con todos los campos', () => {
    const meta = {
      courseId: 'course-123',
      title: 'Quiz Test',
      description: 'Descripción del quiz',
      passingScore: 75,
      timeLimit: 30,
      maxAttempts: 3,
    }
    const questions = [
      {
        question_text: '¿Pregunta 1?',
        type: QuestionType.MULTIPLE_CHOICE,
        points: 10,
        options: [
          { option_text: 'A', is_correct: true },
          { option_text: 'B', is_correct: false },
        ],
      },
    ]

    const payload = buildCreatePayload(meta, questions)

    expect(payload.course_id).toBe('course-123')
    expect(payload.title).toBe('Quiz Test')
    expect(payload.description).toBe('Descripción del quiz')
    expect(payload.passing_score).toBe(75)
    expect(payload.time_limit_minutes).toBe(30)
    expect(payload.max_attempts).toBe(3)
    expect(payload.questions).toHaveLength(1)
    expect(payload.questions[0].order_index).toBe(1)
    expect(payload.questions[0].options[0].order_index).toBe(1)
  })

  it('debe manejar valores vacíos como undefined', () => {
    const meta = {
      courseId: 'course-123',
      title: 'Quiz Test',
      description: '',
      passingScore: 70,
      timeLimit: '' as any,
      maxAttempts: '' as any,
    }
    const questions = [
      {
        question_text: '¿Pregunta 1?',
        type: QuestionType.TRUE_FALSE,
        points: 5,
        options: [
          { option_text: 'Sí', is_correct: true },
          { option_text: 'No', is_correct: false },
        ],
      },
    ]

    const payload = buildCreatePayload(meta, questions)

    expect(payload.time_limit_minutes).toBeUndefined()
    expect(payload.max_attempts).toBeUndefined()
  })

  it('debe asignar order_index automáticamente', () => {
    const meta = {
      courseId: 'course-123',
      title: 'Quiz Test',
      description: '',
      passingScore: 70,
      timeLimit: '' as number | '',
      maxAttempts: '' as number | '',
    }
    const questions = [
      {
        question_text: '¿Pregunta 1?',
        type: QuestionType.MULTIPLE_CHOICE,
        points: 10,
        options: [
          { option_text: 'A', is_correct: true },
          { option_text: 'B', is_correct: false },
          { option_text: 'C', is_correct: false },
        ],
      },
      {
        question_text: '¿Pregunta 2?',
        type: QuestionType.TRUE_FALSE,
        points: 5,
        options: [
          { option_text: 'Verdadero', is_correct: false },
          { option_text: 'Falso', is_correct: true },
        ],
      },
    ]

    const payload = buildCreatePayload(meta, questions as any)

    expect(payload.questions[0].order_index).toBe(1)
    expect(payload.questions[1].order_index).toBe(2)
    expect(payload.questions[0].options[0].order_index).toBe(1)
    expect(payload.questions[0].options[1].order_index).toBe(2)
    expect(payload.questions[0].options[2].order_index).toBe(3)
  })
})

describe('quizRules - enforceSingleCorrect', () => {
  it('debe marcar solo la opción seleccionada como correcta', () => {
    const options = [
      { option_text: 'A', is_correct: false },
      { option_text: 'B', is_correct: true },
      { option_text: 'C', is_correct: false },
    ]

    const result = enforceSingleCorrect(options, 0)

    expect(result[0].is_correct).toBe(true)
    expect(result[1].is_correct).toBe(false)
    expect(result[2].is_correct).toBe(false)
  })

  it('debe desmarcar otras opciones previamente correctas', () => {
    const options = [
      { option_text: 'A', is_correct: true },
      { option_text: 'B', is_correct: true },
      { option_text: 'C', is_correct: false },
    ]

    const result = enforceSingleCorrect(options, 2)

    expect(result[0].is_correct).toBe(false)
    expect(result[1].is_correct).toBe(false)
    expect(result[2].is_correct).toBe(true)
  })

  it('debe mantener el texto de las opciones intacto', () => {
    const options = [
      { option_text: 'Opción A', is_correct: false },
      { option_text: 'Opción B', is_correct: true },
    ]

    const result = enforceSingleCorrect(options, 0)

    expect(result[0].option_text).toBe('Opción A')
    expect(result[1].option_text).toBe('Opción B')
  })
})

describe('quizRules - QUIZ_CONSTANTS', () => {
  it('debe exportar constantes correctas', () => {
    expect(QUIZ_CONSTANTS.MIN_TITLE_LENGTH).toBe(3)
    expect(QUIZ_CONSTANTS.MIN_QUESTION_LENGTH).toBe(6)
    expect(QUIZ_CONSTANTS.MIN_OPTIONS).toBe(2)
    expect(QUIZ_CONSTANTS.PASSING_SCORE_MIN).toBe(0)
    expect(QUIZ_CONSTANTS.PASSING_SCORE_MAX).toBe(100)
  })
})
