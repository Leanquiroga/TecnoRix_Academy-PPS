/**
 * Controlador para endpoints de quizzes y evaluaciones
 */

import type { Response } from 'express'
import type { AuthRequest } from '../types/common.types'
import type {
  CreateQuizInput,
  UpdateQuizInput,
  SubmitQuizInput,
} from '../types/quiz.types'
import { supabaseAdmin } from '../config/supabase'

/**
 * POST /api/courses/:courseId/quizzes
 * Crear un nuevo quiz (solo profesores/admin)
 */
export async function createQuizController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { courseId } = req.params
    const userId = req.user?.userId
    const role = req.user?.role

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Verificar que sea profesor o admin
    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({ error: 'Solo profesores pueden crear quizzes' })
    }

    const input: CreateQuizInput = {
      ...req.body,
      course_id: courseId,
    }

    // Validaciones
    if (!input.title || input.title.length < 3) {
      return res.status(400).json({ error: 'El título debe tener al menos 3 caracteres' })
    }

    if (input.passing_score === undefined || input.passing_score < 0 || input.passing_score > 100) {
      return res.status(400).json({ error: 'La nota de aprobación debe estar entre 0 y 100' })
    }

    if (!input.questions || input.questions.length === 0) {
      return res.status(400).json({ error: 'El quiz debe tener al menos una pregunta' })
    }

    // Validar todas las preguntas ANTES de crear el quiz
    for (let i = 0; i < input.questions.length; i++) {
      const questionInput = input.questions[i]

      // Validar pregunta
      if (!questionInput.question_text || questionInput.question_text.trim().length <= 5) {
        return res.status(400).json({ 
          error: `La pregunta ${i + 1} debe tener al menos 5 caracteres` 
        })
      }

      if (!questionInput.options || questionInput.options.length < 2) {
        return res.status(400).json({ 
          error: `La pregunta ${i + 1} debe tener al menos 2 opciones` 
        })
      }

      // Validar que haya al menos una respuesta correcta
      const correctOptions = questionInput.options.filter(opt => opt.is_correct)
      if (correctOptions.length === 0) {
        return res.status(400).json({ 
          error: `La pregunta ${i + 1} debe tener al menos una opción correcta` 
        })
      }

      // Para multiple_choice y true_false, solo debe haber una respuesta correcta
      if (
        (questionInput.type === 'multiple_choice' || questionInput.type === 'true_false') &&
        correctOptions.length > 1
      ) {
        return res.status(400).json({ 
          error: `La pregunta ${i + 1} de tipo ${questionInput.type} solo puede tener una opción correcta` 
        })
      }
    }

    // Verificar que el curso existe y pertenece al profesor
    if (role === 'teacher') {
      const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id, teacher_id')
        .eq('id', courseId)
        .single()

      if (courseError || !course) {
        return res.status(404).json({ error: 'Curso no encontrado' })
      }

      if (course.teacher_id !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para crear quizzes en este curso' })
      }
    }

    // Crear el quiz
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        course_id: courseId,
        title: input.title,
        description: input.description || null,
        passing_score: input.passing_score,
        time_limit_minutes: input.time_limit_minutes || null,
        max_attempts: input.max_attempts || null,
        order_index: input.order_index ?? 0,
      })
      .select()
      .single()

    if (quizError || !quiz) {
      console.error('Error al crear quiz:', quizError)
      return res.status(500).json({ error: 'Error al crear el quiz' })
    }

    // Crear las preguntas y opciones
    const questions = []
    for (let i = 0; i < input.questions.length; i++) {
      const questionInput = input.questions[i]

      // Crear pregunta (las validaciones ya se hicieron arriba)
      const { data: question, error: questionError } = await supabaseAdmin
        .from('questions')
        .insert({
          quiz_id: quiz.id,
          question_text: questionInput.question_text,
          type: questionInput.type,
          points: questionInput.points || 1,
          order_index: questionInput.order_index ?? i,
          explanation: questionInput.explanation || null,
        })
        .select()
        .single()

      if (questionError || !question) {
        console.error('Error al crear pregunta:', questionError)
        return res.status(500).json({ error: 'Error al crear las preguntas' })
      }

      // Crear opciones
      const options = []
      for (let j = 0; j < questionInput.options.length; j++) {
        const optionInput = questionInput.options[j]

        const { data: option, error: optionError } = await supabaseAdmin
          .from('question_options')
          .insert({
            question_id: question.id,
            option_text: optionInput.option_text,
            is_correct: optionInput.is_correct,
            order_index: optionInput.order_index ?? j,
          })
          .select()
          .single()

        if (optionError || !option) {
          console.error('Error al crear opción:', optionError)
          return res.status(500).json({ error: 'Error al crear las opciones' })
        }

        options.push(option)
      }

      questions.push({ ...question, options })
    }

    return res.status(201).json({
      success: true,
      data: { ...quiz, questions },
      message: 'Quiz creado exitosamente',
    })
  } catch (error: any) {
    console.error('Error al crear quiz:', error)
    return res.status(500).json({
      error: 'Error al crear el quiz',
      details: error.message,
    })
  }
}

/**
 * GET /api/courses/:courseId/quizzes
 * Listar quizzes de un curso
 */
export async function listQuizzesController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { courseId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Usar supabaseAdmin para bypass RLS (los usuarios inscritos pueden ver quizzes)
    const { data: quizzes, error } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error al listar quizzes:', error)
      return res.status(500).json({ error: 'Error al obtener los quizzes' })
    }

    return res.json({
      success: true,
      data: quizzes || [],
    })
  } catch (error: any) {
    console.error('Error al listar quizzes:', error)
    return res.status(500).json({
      error: 'Error al obtener los quizzes',
      details: error.message,
    })
  }
}

/**
 * GET /api/quizzes/:quizId
 * Obtener un quiz específico con sus preguntas
 */
export async function getQuizController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { quizId } = req.params
    const userId = req.user?.userId
    const role = req.user?.role

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Obtener el quiz
    const { data: quiz, error: quizError } = await supabaseAdmin.from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single()

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz no encontrado' })
    }

    // Obtener las preguntas
    const { data: questions, error: questionsError } = await supabaseAdmin.from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('Error al obtener preguntas:', questionsError)
      return res.status(500).json({ error: 'Error al obtener las preguntas' })
    }

    // Obtener opciones para cada pregunta
    const questionsWithOptions = await Promise.all(
      (questions || []).map(async (question) => {
        const { data: options, error: optionsError } = await supabaseAdmin.from('question_options')
          .select('*')
          .eq('question_id', question.id)
          .order('order_index', { ascending: true })

        if (optionsError) {
          console.error('Error al obtener opciones:', optionsError)
          return { ...question, options: [] }
        }

        // Para estudiantes, ocultar la respuesta correcta
        const filteredOptions = role === 'student'
          ? options?.map(opt => ({
              id: opt.id,
              question_id: opt.question_id,
              option_text: opt.option_text,
              order_index: opt.order_index,
              created_at: opt.created_at,
              updated_at: opt.updated_at,
            }))
          : options

        return { ...question, options: filteredOptions || [] }
      })
    )

    return res.json({
      success: true,
      data: { ...quiz, questions: questionsWithOptions },
    })
  } catch (error: any) {
    console.error('Error al obtener quiz:', error)
    return res.status(500).json({
      error: 'Error al obtener el quiz',
      details: error.message,
    })
  }
}

/**
 * PUT /api/quizzes/:quizId
 * Actualizar un quiz (solo profesores/admin)
 */
export async function updateQuizController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { quizId } = req.params
    const userId = req.user?.userId
    const role = req.user?.role

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({ error: 'Solo profesores pueden actualizar quizzes' })
    }

    const input: UpdateQuizInput = req.body

    // Obtener el quiz actual
    const { data: quiz, error: quizError } = await supabaseAdmin.from('quizzes')
      .select('*, courses!inner(teacher_id)')
      .eq('id', quizId)
      .single()

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz no encontrado' })
    }

    // Verificar permisos
    if (role === 'teacher' && quiz.courses.teacher_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar este quiz' })
    }

    // Validaciones
    if (input.title !== undefined && input.title.length < 3) {
      return res.status(400).json({ error: 'El título debe tener al menos 3 caracteres' })
    }

    if (input.passing_score !== undefined && (input.passing_score < 0 || input.passing_score > 100)) {
      return res.status(400).json({ error: 'La nota de aprobación debe estar entre 0 y 100' })
    }

    // Actualizar
    const { data: updatedQuiz, error: updateError } = await supabaseAdmin.from('quizzes')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quizId)
      .select()
      .single()

    if (updateError || !updatedQuiz) {
      console.error('Error al actualizar quiz:', updateError)
      return res.status(500).json({ error: 'Error al actualizar el quiz' })
    }

    return res.json({
      success: true,
      data: updatedQuiz,
      message: 'Quiz actualizado exitosamente',
    })
  } catch (error: any) {
    console.error('Error al actualizar quiz:', error)
    return res.status(500).json({
      error: 'Error al actualizar el quiz',
      details: error.message,
    })
  }
}

/**
 * DELETE /api/quizzes/:quizId
 * Eliminar un quiz (soft delete)
 */
export async function deleteQuizController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { quizId } = req.params
    const userId = req.user?.userId
    const role = req.user?.role

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({ error: 'Solo profesores pueden eliminar quizzes' })
    }

    // Obtener el quiz
    const { data: quiz, error: quizError } = await supabaseAdmin.from('quizzes')
      .select('*, courses!inner(teacher_id)')
      .eq('id', quizId)
      .single()

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz no encontrado' })
    }

    // Verificar permisos
    if (role === 'teacher' && quiz.courses.teacher_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este quiz' })
    }

    // Eliminar quiz (las preguntas y opciones se eliminarán por CASCADE)
    const { error: deleteError } = await supabaseAdmin
      .from('quizzes')
      .delete()
      .eq('id', quizId)

    if (deleteError) {
      console.error('Error al eliminar quiz:', deleteError)
      return res.status(500).json({ error: 'Error al eliminar el quiz' })
    }

    return res.json({
      success: true,
      message: 'Quiz eliminado exitosamente',
    })
  } catch (error: any) {
    console.error('Error al eliminar quiz:', error)
    return res.status(500).json({
      error: 'Error al eliminar el quiz',
      details: error.message,
    })
  }
}

/**
 * POST /api/quizzes/:quizId/start
 * Iniciar un nuevo intento de quiz
 */
export async function startQuizAttemptController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { quizId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Obtener el quiz
    const { data: quiz, error: quizError } = await supabaseAdmin.from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single()

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz no encontrado' })
    }

    // Verificar inscripción en el curso
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin.from('enrollments')
      .select('id')
      .eq('course_id', quiz.course_id)
      .eq('student_id', userId)
      .single()

    if (enrollmentError || !enrollment) {
      return res.status(403).json({ error: 'Debes estar inscrito en el curso para tomar el quiz' })
    }

    // Verificar número de intentos previos
    const { data: previousAttempts, error: attemptsError } = await supabaseAdmin.from('quiz_attempts')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('student_id', userId)

    if (attemptsError) {
      console.error('Error al verificar intentos:', attemptsError)
      return res.status(500).json({ error: 'Error al verificar intentos previos' })
    }

    const attemptNumber = (previousAttempts?.length || 0) + 1

    // Verificar límite de intentos
    if (quiz.max_attempts && attemptNumber > quiz.max_attempts) {
      return res.status(403).json({ 
        error: `Has alcanzado el número máximo de intentos (${quiz.max_attempts})` 
      })
    }

    // Crear el intento
    const { data: attempt, error: attemptError } = await supabaseAdmin.from('quiz_attempts')
      .insert({
        student_id: userId,
        quiz_id: quizId,
        attempt_number: attemptNumber,
        score: 0,
        total_points: 0,
        percentage: 0,
        passed: false,
        submitted_at: null, // Forzar NULL explícitamente
      })
      .select()
      .single()

    if (attemptError || !attempt) {
      console.error('Error al crear intento:', attemptError)
      return res.status(500).json({ error: 'Error al iniciar el intento' })
    }

    // Obtener el quiz con preguntas (sin respuestas correctas)
    const { data: questions, error: questionsError } = await supabaseAdmin.from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('Error al obtener preguntas:', questionsError)
      return res.status(500).json({ error: 'Error al obtener las preguntas' })
    }

    const questionsWithOptions = await Promise.all(
      (questions || []).map(async (question) => {
        const { data: options } = await supabaseAdmin.from('question_options')
          .select('id, question_id, option_text, order_index, created_at, updated_at')
          .eq('question_id', question.id)
          .order('order_index', { ascending: true })

        return { ...question, options: options || [] }
      })
    )

    return res.status(201).json({
      success: true,
      data: {
        attempt,
        quiz: { ...quiz, questions: questionsWithOptions },
      },
      message: 'Intento iniciado exitosamente',
    })
  } catch (error: any) {
    console.error('Error al iniciar intento:', error)
    return res.status(500).json({
      error: 'Error al iniciar el intento',
      details: error.message,
    })
  }
}

/**
 * POST /api/quiz-attempts/:attemptId/submit
 * Enviar respuestas y finalizar intento
 */
export async function submitQuizController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { attemptId } = req.params
    const userId = req.user?.userId
    const input: SubmitQuizInput = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    if (!input.answers || input.answers.length === 0) {
      return res.status(400).json({ error: 'Debes responder al menos una pregunta' })
    }

    // Obtener el intento
    const { data: attempt, error: attemptError } = await supabaseAdmin.from('quiz_attempts')
      .select('*')
      .eq('id', attemptId)
      .single()

    if (attemptError || !attempt) {
      return res.status(404).json({ error: 'Intento no encontrado' })
    }

    // Verificar que el intento pertenece al usuario
    if (attempt.student_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para enviar este intento' })
    }

    // Verificar que no ha sido enviado antes
    if (attempt.submitted_at) {
      return res.status(400).json({ error: 'Este intento ya ha sido enviado' })
    }

    // Obtener el quiz y preguntas
    const { data: quiz, error: quizError } = await supabaseAdmin.from('quizzes')
      .select('*')
      .eq('id', attempt.quiz_id)
      .single()

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz no encontrado' })
    }

    const { data: questions, error: questionsError } = await supabaseAdmin.from('questions')
      .select('id, points')
      .eq('quiz_id', quiz.id)

    if (questionsError || !questions) {
      return res.status(500).json({ error: 'Error al obtener las preguntas' })
    }

    // Calcular puntos totales
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

    // Guardar respuestas y calcular puntaje
    let earnedPoints = 0

    for (const answer of input.answers) {
      if (!answer.selected_option_id) {
        // Respuesta no contestada
        await supabaseAdmin.from('student_answers').insert({
          attempt_id: attemptId,
          question_id: answer.question_id,
          selected_option_id: null,
          is_correct: false,
          points_earned: 0,
        })
        continue
      }

      // Obtener la opción seleccionada
      const { data: option, error: optionError } = await supabaseAdmin.from('question_options')
        .select('is_correct, question_id')
        .eq('id', answer.selected_option_id)
        .single()

      if (optionError || !option) {
        continue
      }

      // Obtener puntos de la pregunta
      const question = questions.find(q => q.id === option.question_id)
      const points = option.is_correct && question ? question.points : 0

      if (option.is_correct) {
        earnedPoints += points
      }

      // Guardar respuesta
      await supabaseAdmin.from('student_answers').insert({
        attempt_id: attemptId,
        question_id: answer.question_id,
        selected_option_id: answer.selected_option_id,
        is_correct: option.is_correct,
        points_earned: points,
      })
    }

  // Calcular tiempo tomado (si no existe started_at en el esquema, dejar null)
  const submittedAt = new Date()
  const timeTakenMinutes = null

    // Calcular porcentaje y si aprobó
    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
    const passed = percentage >= quiz.passing_score

    // Actualizar intento
    const { data: updatedAttempt, error: updateError } = await supabaseAdmin.from('quiz_attempts')
      .update({
        score: earnedPoints,
        total_points: totalPoints,
        percentage: Math.round(percentage * 100) / 100,
        passed,
        submitted_at: submittedAt.toISOString(),
        time_taken_minutes: timeTakenMinutes,
      })
      .eq('id', attemptId)
      .select()
      .single()

    if (updateError || !updatedAttempt) {
      console.error('Error al actualizar intento:', updateError)
      return res.status(500).json({ error: 'Error al guardar el resultado' })
    }

    // Obtener detalles completos del intento
    const { data: attemptDetails } = await getQuizAttemptDetails(attemptId)

    return res.json({
      success: true,
      data: attemptDetails || updatedAttempt,
      passed,
      message: passed 
        ? `¡Felicitaciones! Aprobaste con ${percentage.toFixed(1)}%` 
        : `No aprobaste. Obtuviste ${percentage.toFixed(1)}%. Necesitas ${quiz.passing_score}% para aprobar.`,
    })
  } catch (error: any) {
    console.error('Error al enviar quiz:', error)
    return res.status(500).json({
      error: 'Error al enviar el quiz',
      details: error.message,
    })
  }
}

/**
 * GET /api/quizzes/:quizId/attempts
 * Obtener intentos de un quiz (del estudiante actual o todos si es profesor)
 */
export async function getQuizAttemptsController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { quizId } = req.params
    const userId = req.user?.userId
    const role = req.user?.role

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Obtener el quiz
    const { data: quiz, error: quizError } = await supabaseAdmin.from('quizzes')
      .select('*, courses!inner(teacher_id)')
      .eq('id', quizId)
      .single()

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz no encontrado' })
    }

    // Si es profesor o admin, puede ver todos los intentos
    let query = supabaseAdmin.from('quiz_attempts')
      .select(`
        *,
        profiles:student_id (
          id,
          name,
          email
        )
      `)
      .eq('quiz_id', quizId)
      .order('submitted_at', { ascending: false })

    // Si es estudiante, solo ver sus propios intentos
    if (role === 'student') {
      query = query.eq('student_id', userId)
    }

    const { data: attempts, error: attemptsError } = await query

    if (attemptsError) {
      console.error('Error al obtener intentos:', attemptsError)
      return res.status(500).json({ error: 'Error al obtener los intentos' })
    }

    return res.json({
      success: true,
      data: attempts || [],
    })
  } catch (error: any) {
    console.error('Error al obtener intentos:', error)
    return res.status(500).json({
      error: 'Error al obtener los intentos',
      details: error.message,
    })
  }
}

/**
 * GET /api/quiz-attempts/:attemptId
 * Obtener detalles de un intento específico
 */
export async function getQuizAttemptController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { attemptId } = req.params
    const userId = req.user?.userId
    const role = req.user?.role

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const { data: attemptDetails, error } = await getQuizAttemptDetails(attemptId)

    if (error || !attemptDetails) {
      return res.status(404).json({ error: 'Intento no encontrado' })
    }

    // Verificar permisos
    if (role === 'student' && attemptDetails.student_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver este intento' })
    }

    return res.json({
      success: true,
      data: attemptDetails,
    })
  } catch (error: any) {
    console.error('Error al obtener intento:', error)
    return res.status(500).json({
      error: 'Error al obtener el intento',
      details: error.message,
    })
  }
}

/**
 * GET /api/quizzes/:quizId/statistics
 * Obtener estadísticas de un quiz (solo profesores/admin)
 */
export async function getQuizStatisticsController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { quizId } = req.params
    const userId = req.user?.userId
    const role = req.user?.role

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({ error: 'Solo profesores pueden ver estadísticas' })
    }

    // Obtener el quiz
    const { data: quiz, error: quizError } = await supabaseAdmin.from('quizzes')
      .select('*, courses!inner(teacher_id)')
      .eq('id', quizId)
      .single()

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz no encontrado' })
    }

    // Verificar permisos
    if (role === 'teacher' && quiz.courses.teacher_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver estas estadísticas' })
    }

    // Obtener intentos completados
    const { data: attempts, error: attemptsError } = await supabaseAdmin.from('quiz_attempts')
      .select('score, total_points, percentage, passed, time_taken_minutes')
      .eq('quiz_id', quizId)
      .not('submitted_at', 'is', null)

    if (attemptsError) {
      console.error('Error al obtener intentos:', attemptsError)
      return res.status(500).json({ error: 'Error al obtener estadísticas' })
    }

    if (!attempts || attempts.length === 0) {
      return res.json({
        success: true,
        data: {
          quiz_id: quizId,
          quiz_title: quiz.title,
          total_attempts: 0,
          average_score: 0,
          pass_rate: 0,
          highest_score: 0,
          lowest_score: 0,
          average_time_minutes: 0,
        },
      })
    }

    // Calcular estadísticas
    const totalAttempts = attempts.length
    const passedAttempts = attempts.filter(a => a.passed).length
    const scores = attempts.map(a => a.percentage || 0)
    const times = attempts.filter(a => a.time_taken_minutes).map(a => a.time_taken_minutes!)

    const statistics = {
      quiz_id: quizId,
      quiz_title: quiz.title,
      total_attempts: totalAttempts,
      average_score: scores.reduce((a, b) => a + b, 0) / totalAttempts,
      pass_rate: (passedAttempts / totalAttempts) * 100,
      highest_score: Math.max(...scores),
      lowest_score: Math.min(...scores),
      average_time_minutes: times.length > 0 
        ? times.reduce((a, b) => a + b, 0) / times.length 
        : 0,
    }

    return res.json({
      success: true,
      data: statistics,
    })
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error)
    return res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error.message,
    })
  }
}

/**
 * Función auxiliar para obtener detalles completos de un intento
 */
async function getQuizAttemptDetails(attemptId: string) {
  try {
    const { data: attempt, error: attemptError } = await supabaseAdmin.from('quiz_attempts')
      .select(`
        *,
        profiles:student_id (
          id,
          name,
          email
        ),
        quizzes (
          id,
          title,
          passing_score
        )
      `)
      .eq('id', attemptId)
      .single()

    if (attemptError || !attempt) {
      return { data: null, error: attemptError }
    }

    // Obtener respuestas
    const { data: answers, error: answersError } = await supabaseAdmin.from('student_answers')
      .select(`
        *,
        questions (
          id,
          question_text,
          type,
          points,
          explanation
        ),
        question_options:selected_option_id (
          id,
          option_text,
          is_correct
        )
      `)
      .eq('attempt_id', attemptId)

    if (answersError) {
      return { data: null, error: answersError }
    }

    return {
      data: {
        ...attempt,
        answers: answers || [],
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error }
  }
}


