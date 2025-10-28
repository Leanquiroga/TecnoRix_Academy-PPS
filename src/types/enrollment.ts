import type { CoursePublic } from './course'

export type EnrollmentStatus = 'active' | 'pending_payment' | 'completed' | 'cancelled'

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  status: EnrollmentStatus
  enrolled_at: string
  progress: number
  completed_at?: string | null
}

export interface EnrollmentWithCourse extends Enrollment {
  course: (CoursePublic & {
    thumbnail_url?: string | null
    duration_hours?: number | null
    teacher?: { id: string; name?: string | null } | null
  })
}

export interface EnrollmentWithStudent extends Enrollment {
  student: {
    id: string
    name?: string | null
    email?: string | null
    avatar_url?: string | null
  }
}

export interface StudentStats {
  total_courses: number
  active_courses: number
  completed_courses: number
  average_progress: number
}

export interface EnrollResponse {
  message?: string
  enrollment: Enrollment
  requires_payment?: boolean
}

export interface UpdateProgressResponse {
  message: string
  enrollment: Enrollment
}
