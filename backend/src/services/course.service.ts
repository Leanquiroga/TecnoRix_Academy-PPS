export async function listPendingCourses(): Promise<Course[]> {
  console.log('[CourseService] listPendingCourses')
  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Course[]
}

export async function approveCourse(courseId: string): Promise<Course> {
  console.log('[CourseService] approveCourse', courseId)
  const { data, error } = await supabaseAdmin
    .from('courses')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', courseId)
    .eq('status', 'pending_approval')
    .select('*')
    .single()
  if (error) throw error
  if (!data) throw new Error('Curso no encontrado o no está pendiente')
  return data as Course
}

export async function rejectCourse(courseId: string, reason?: string): Promise<Course> {
  console.log('[CourseService] rejectCourse', courseId)
  const { data, error } = await supabaseAdmin
    .from('courses')
    .update({ status: 'rejected', updated_at: new Date().toISOString(), metadata: { rejection_reason: reason || null } })
    .eq('id', courseId)
    .eq('status', 'pending_approval')
    .select('*')
    .single()
  if (error) throw error
  if (!data) throw new Error('Curso no encontrado o no está pendiente')
  return data as Course
}
import { supabaseAdmin } from '../config/supabase'
import { UserRole, UserStatus } from '../types/auth.types'
import type { Course, CourseCreateInput, CoursePublic, CourseStatus, CourseMaterialInput } from '../types/course.types'

export async function ensureTeacherApproved(userId: string) {
  console.log('[CourseService] ensureTeacherApproved', userId)
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, role, status')
    .eq('id', userId)
    .single()
  if (error) throw error
  if (!user) throw new Error('Usuario no encontrado')
  if (user.role !== UserRole.TEACHER) throw new Error('Solo los profesores pueden crear cursos')
  if (user.status !== UserStatus.ACTIVE) throw new Error('El profesor debe estar aprobado y activo para crear cursos')
  return true
}

export async function createCourse(teacherId: string, input: CourseCreateInput): Promise<Course> {
  console.log('[CourseService] createCourse', teacherId, input?.title)
  await ensureTeacherApproved(teacherId)

  const payload = {
    title: input.title,
    description: input.description,
    teacher_id: teacherId,
    status: 'pending_approval' as CourseStatus,
    price: input.price ?? 0,
    thumbnail_url: input.thumbnail_url ?? null,
    category: input.category ?? null,
    duration_hours: input.duration_hours ?? null,
    level: input.level ?? null,
    language: input.language ?? 'es',
    tags: input.tags ?? null,
    metadata: input.metadata ?? {},
  }

  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  const course = data as Course

  // Insertar materiales si vienen en la creación
  if (input.materials && input.materials.length > 0) {
    await addCourseMaterials(course.id, input.materials)
  }

  return course
}

export async function listPublicCourses(): Promise<CoursePublic[]> {
  console.log('[CourseService] listPublicCourses')
  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('id, title, description, price, thumbnail_url, category, teacher_id')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as CoursePublic[]
}

export async function addCourseMaterials(courseId: string, materials: CourseMaterialInput[]) {
  console.log('[CourseService] addCourseMaterials', courseId, 'materials:', materials?.length)
  if (!materials || materials.length === 0) return
  const payload = materials.map((m, idx) => ({
    course_id: courseId,
    title: m.title,
    type: m.type,
    url: m.url,
    order_index: m.order ?? idx + 1,
  }))
  console.log('[CourseService] inserting materials payload:', JSON.stringify(payload, null, 2))
  const { error } = await supabaseAdmin.from('course_materials').insert(payload)
  if (error) {
    console.error('[CourseService] Error inserting materials:', error)
    throw error
  }
  console.log('[CourseService] Materials inserted successfully')
}

export async function getCoursePublicById(id: string) {
  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle()
  if (error) throw error
  return course
}

export async function getCourseMaterials(courseId: string) {
  console.log('[CourseService] getCourseMaterials', courseId)
  const { data, error } = await supabaseAdmin
    .from('course_materials')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function updateCourse(courseId: string, teacherId: string, input: Partial<CourseCreateInput>) {
  // Validar ownership
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('courses')
    .select('id, teacher_id')
    .eq('id', courseId)
    .maybeSingle()
  if (fetchErr) throw fetchErr
  if (!existing) throw new Error('Curso no encontrado')
  if (existing.teacher_id !== teacherId) throw new Error('No autorizado para editar este curso')

  const updatePayload: Partial<Record<'title' | 'description' | 'price' | 'thumbnail_url' | 'category' | 'duration_hours' | 'level' | 'language' | 'tags' | 'metadata' | 'updated_at', any>> = {}
  const allowed = ['title', 'description', 'price', 'thumbnail_url', 'category', 'duration_hours', 'level', 'language', 'tags', 'metadata'] as const
  for (const key of allowed) {
    if (input && typeof (input as any)[key] !== 'undefined') {
      updatePayload[key] = (input as any)[key]
    }
  }
  updatePayload.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('courses')
    .update(updatePayload)
    .eq('id', courseId)
    .select('*')
    .single()
  if (error) throw error

  // Si llegan materials, hacer upsert simple: borrar y reinsertar (versión simple para MVP)
  if (input?.materials) {
    const { error: delErr } = await supabaseAdmin.from('course_materials').delete().eq('course_id', courseId)
    if (delErr) throw delErr
    await addCourseMaterials(courseId, input.materials)
  }

  return data
}

export async function deleteCourse(courseId: string, teacherId: string) {
  // Validar ownership
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('courses')
    .select('id, teacher_id')
    .eq('id', courseId)
    .maybeSingle()
  if (fetchErr) throw fetchErr
  if (!existing) throw new Error('Curso no encontrado')
  if (existing.teacher_id !== teacherId) throw new Error('No autorizado para eliminar este curso')

  // Borrar materiales primero
  const { error: delMatErr } = await supabaseAdmin.from('course_materials').delete().eq('course_id', courseId)
  if (delMatErr) throw delMatErr

  const { error } = await supabaseAdmin.from('courses').delete().eq('id', courseId)
  if (error) throw error
  return { success: true }
}
