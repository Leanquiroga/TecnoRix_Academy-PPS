/**
 * Tipos para el sistema de inscripciones (Enrollments)
 */

/**
 * Estados posibles de una inscripción
 */
export type EnrollmentStatus = 'active' | 'pending_payment' | 'completed' | 'cancelled'

/**
 * Interfaz de inscripción
 */
export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  status: EnrollmentStatus
  progress: number // 0.00 - 100.00
  final_grade?: number // 0.00 - 100.00
  certificate_url?: string
  enrolled_at: Date
  completed_at?: Date
  created_by?: string
  updated_by?: string
}

/**
 * DTO para crear una nueva inscripción
 */
export interface CreateEnrollmentDTO {
  course_id: string
  // student_id se obtiene del token JWT
}

/**
 * DTO para actualizar progreso de inscripción
 */
export interface UpdateProgressDTO {
  progress: number // 0.00 - 100.00
}

/**
 * DTO para actualizar estado de inscripción
 */
export interface UpdateEnrollmentStatusDTO {
  status: EnrollmentStatus
  final_grade?: number
}

/**
 * Inscripción con información del curso
 */
export interface EnrollmentWithCourse extends Enrollment {
  course: {
    id: string
    title: string
    description: string
    thumbnail_url?: string
    teacher_id: string
    teacher_name?: string
    level?: string
    duration_hours?: number
    category?: string
  }
}

/**
 * Inscripción con información del estudiante
 */
export interface EnrollmentWithStudent extends Enrollment {
  student: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
}

/**
 * Estadísticas de progreso del estudiante
 */
export interface StudentProgressStats {
  total_courses: number
  active_courses: number
  completed_courses: number
  average_progress: number
  total_hours_completed?: number
}

/**
 * Estadísticas de inscripciones para el profesor
 */
export interface TeacherEnrollmentStats {
  total_students: number
  active_students: number
  completed_students: number
  average_completion_rate: number
  course_id: string
}
