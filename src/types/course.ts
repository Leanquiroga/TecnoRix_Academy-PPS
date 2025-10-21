export type CourseStatus = 'pending_approval' | 'approved' | 'rejected' | 'draft'

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Course {
  id: string
  title: string
  description: string
  teacher_id: string
  status: CourseStatus
  price: number
  thumbnail_url?: string | null
  category?: string | null
  duration_hours?: number | null
  level?: CourseLevel | null
  language?: string | null
  tags?: string[] | null
  metadata?: Record<string, any> | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface CourseCreateInput {
  title: string
  description: string
  price?: number
  thumbnail_url?: string
  category?: string
  duration_hours?: number
  level?: CourseLevel
  language?: string
  tags?: string[]
  metadata?: Record<string, any>
  materials?: CourseMaterialInput[]
}

export interface CoursePublic {
  id: string
  title: string
  description: string
  price: number | null
  thumbnail_url?: string | null
  category?: string | null
  level?: CourseLevel | null
  teacher_id: string
  instructor_name?: string | null
}

export type CourseMaterialType = 'pdf' | 'video' | 'link'

export interface CourseMaterial {
  id: string
  course_id: string
  title: string
  type: CourseMaterialType
  url: string
  order: number
  created_at: string
  updated_at: string
}

export interface CourseMaterialInput {
  title: string
  type: CourseMaterialType
  url: string
  order?: number
}
