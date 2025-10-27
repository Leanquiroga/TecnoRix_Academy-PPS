import { Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import type { AuthRequest } from '../types/common.types'
import type {
  CreateEnrollmentDTO,
  UpdateProgressDTO,
} from '../types/enrollment.types'

/**
 * Controlador de Inscripciones
 */
export class EnrollmentController {
  /**
   * POST /api/enrollments
   * Inscribir a un estudiante en un curso
   */
  static async enrollStudent(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { course_id }: CreateEnrollmentDTO = req.body
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' })
      }

      if (!course_id) {
        return res.status(400).json({ error: 'El ID del curso es requerido' })
      }

      // Verificar que el curso existe y está aprobado
      const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id, title, status, price')
        .eq('id', course_id)
        .single()

      if (courseError || !course) {
        return res.status(404).json({ error: 'Curso no encontrado' })
      }

      if (course.status !== 'approved') {
        return res.status(400).json({ error: 'El curso no está disponible para inscripción' })
      }

      // Verificar que el estudiante no esté ya inscrito
      const { data: existingEnrollment } = await supabaseAdmin
        .from('enrollments')
        .select('id, status')
        .eq('student_id', userId)
        .eq('course_id', course_id)
        .single()

      if (existingEnrollment) {
        if (existingEnrollment.status === 'cancelled') {
          // Reactivar inscripción cancelada
          const { data: reactivated, error: reactivateError } = await supabaseAdmin
            .from('enrollments')
            .update({
              status: course.price > 0 ? 'pending_payment' : 'active',
              updated_by: userId,
            })
            .eq('id', existingEnrollment.id)
            .select()
            .single()

          if (reactivateError) {
            throw reactivateError
          }

          return res.status(200).json({
            message: 'Inscripción reactivada exitosamente',
            enrollment: reactivated,
          })
        }

        return res.status(400).json({ error: 'Ya estás inscrito en este curso' })
      }

      // Crear nueva inscripción
      const enrollmentData = {
        student_id: userId,
        course_id,
        status: course.price > 0 ? 'pending_payment' : 'active',
        progress: 0,
        created_by: userId,
      }

      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .insert(enrollmentData)
        .select()
        .single()

      if (enrollmentError) {
        throw enrollmentError
      }

      return res.status(201).json({
        message: 'Inscripción creada exitosamente',
        enrollment,
        requires_payment: course.price > 0,
      })
    } catch (error) {
      console.error('Error al crear inscripción:', error)
      return res.status(500).json({ error: 'Error al inscribirse en el curso' })
    }
  }

  /**
   * GET /api/enrollments/my-courses
   * Obtener cursos del estudiante autenticado
   */
  static async getMyCourses(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId
      const { status } = req.query

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' })
      }

      let query = supabaseAdmin
        .from('enrollments')
        .select(`
          *,
          course:courses (
            id,
            title,
            description,
            thumbnail_url,
            teacher_id,
            level,
            duration_hours,
            category,
            teacher:users!courses_teacher_id_fkey (
              id,
              name
            )
          )
        `)
        .eq('student_id', userId)
        .order('enrolled_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data: enrollments, error } = await query

      if (error) {
        throw error
      }

      return res.json(enrollments || [])
    } catch (error) {
      console.error('Error al obtener cursos del estudiante:', error)
      return res.status(500).json({ error: 'Error al obtener tus cursos' })
    }
  }

  /**
   * GET /api/courses/:courseId/students
   * Obtener estudiantes inscritos en un curso (solo para teacher del curso)
   */
  static async getCourseStudents(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { courseId } = req.params
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' })
      }

      // Verificar que el usuario es el profesor del curso
      const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('teacher_id')
        .eq('id', courseId)
        .single()

      if (courseError || !course) {
        return res.status(404).json({ error: 'Curso no encontrado' })
      }

      if (course.teacher_id !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para ver los estudiantes de este curso' })
      }

      // Obtener estudiantes inscritos
      const { data: enrollments, error } = await supabaseAdmin
        .from('enrollments')
        .select(`
          *,
          student:users!enrollments_student_id_fkey (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('course_id', courseId)
        .order('enrolled_at', { ascending: false })

      if (error) {
        throw error
      }

      return res.json(enrollments || [])
    } catch (error) {
      console.error('Error al obtener estudiantes del curso:', error)
      return res.status(500).json({ error: 'Error al obtener estudiantes' })
    }
  }

  /**
   * PUT /api/enrollments/:id/progress
   * Actualizar progreso de una inscripción
   */
  static async updateProgress(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const { progress }: UpdateProgressDTO = req.body
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' })
      }

      if (progress < 0 || progress > 100) {
        return res.status(400).json({ error: 'El progreso debe estar entre 0 y 100' })
      }

      // Verificar que la inscripción pertenece al usuario
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select('student_id, status')
        .eq('id', id)
        .single()

      if (enrollmentError || !enrollment) {
        return res.status(404).json({ error: 'Inscripción no encontrada' })
      }

      if (enrollment.student_id !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para actualizar esta inscripción' })
      }

      // Actualizar progreso
      const updateData: any = {
        progress,
        updated_by: userId,
      }

      // Si el progreso es 100%, marcar como completado
      if (progress >= 100 && enrollment.status === 'active') {
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
      }

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('enrollments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      return res.json({
        message: 'Progreso actualizado exitosamente',
        enrollment: updated,
      })
    } catch (error) {
      console.error('Error al actualizar progreso:', error)
      return res.status(500).json({ error: 'Error al actualizar progreso' })
    }
  }

  /**
   * GET /api/enrollments/:id
   * Obtener detalles de una inscripción específica
   */
  static async getEnrollment(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' })
      }

      const { data: enrollment, error } = await supabaseAdmin
        .from('enrollments')
        .select(`
          *,
          course:courses (
            id,
            title,
            description,
            thumbnail_url,
            teacher_id,
            level,
            duration_hours,
            category
          )
        `)
        .eq('id', id)
        .single()

      if (error || !enrollment) {
        return res.status(404).json({ error: 'Inscripción no encontrada' })
      }

      // Verificar permisos (estudiante o profesor del curso)
      if (enrollment.student_id !== userId && enrollment.course.teacher_id !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para ver esta inscripción' })
      }

      return res.json(enrollment)
    } catch (error) {
      console.error('Error al obtener inscripción:', error)
      return res.status(500).json({ error: 'Error al obtener inscripción' })
    }
  }

  /**
   * DELETE /api/enrollments/:id
   * Cancelar una inscripción
   */
  static async cancelEnrollment(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' })
      }

      // Verificar que la inscripción pertenece al usuario
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select('student_id, status')
        .eq('id', id)
        .single()

      if (enrollmentError || !enrollment) {
        return res.status(404).json({ error: 'Inscripción no encontrada' })
      }

      if (enrollment.student_id !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para cancelar esta inscripción' })
      }

      if (enrollment.status === 'completed') {
        return res.status(400).json({ error: 'No puedes cancelar un curso completado' })
      }

      // Si ya está cancelada, devolver la inscripción sin hacer cambios (idempotente)
      if (enrollment.status === 'cancelled') {
        const { data: current } = await supabaseAdmin
          .from('enrollments')
          .select('*')
          .eq('id', id)
          .single()

        return res.json({
          message: 'La inscripción ya estaba cancelada',
          enrollment: current,
        })
      }

      // Actualizar estado a cancelado
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('enrollments')
        .update({
          status: 'cancelled',
          updated_by: userId,
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      return res.json({
        message: 'Inscripción cancelada exitosamente',
        enrollment: updated,
      })
    } catch (error) {
      console.error('Error al cancelar inscripción:', error)
      return res.status(500).json({ error: 'Error al cancelar inscripción' })
    }
  }

  /**
   * GET /api/enrollments/stats/student
   * Obtener estadísticas del estudiante
   */
  static async getStudentStats(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' })
      }

      const { data: enrollments, error } = await supabaseAdmin
        .from('enrollments')
        .select('status, progress')
        .eq('student_id', userId)

      if (error) {
        throw error
      }

      type EnrollmentStats = { status: string; progress: number }

      const stats = {
        total_courses: enrollments?.length || 0,
        active_courses: enrollments?.filter((e: EnrollmentStats) => e.status === 'active').length || 0,
        completed_courses: enrollments?.filter((e: EnrollmentStats) => e.status === 'completed').length || 0,
        average_progress:
          enrollments && enrollments.length > 0
            ? enrollments.reduce((sum: number, e: EnrollmentStats) => sum + e.progress, 0) / enrollments.length
            : 0,
      }

      return res.json(stats)
    } catch (error) {
      console.error('Error al obtener estadísticas del estudiante:', error)
      return res.status(500).json({ error: 'Error al obtener estadísticas' })
    }
  }
}
