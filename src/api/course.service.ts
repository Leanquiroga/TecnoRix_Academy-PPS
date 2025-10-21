import http from './http'
import type { ApiResponse } from '../types/common'
import type { Course, CourseCreateInput, CoursePublic, CourseMaterial } from '../types/course'

export async function listPublicCourses() {
  const { data } = await http.get<ApiResponse<CoursePublic[]>>('/courses')
  if (!data.success) throw new Error(data.error || 'Error al listar cursos')
  return data.data as CoursePublic[]
}

export async function getCoursePublicById(id: string) {
  const { data } = await http.get<ApiResponse<CoursePublic>>(`/courses/${id}`)
  if (!data.success) throw new Error(data.error || 'Curso no encontrado')
  return data.data as CoursePublic
}

export async function getCourseMaterials(id: string) {
  const { data } = await http.get<ApiResponse<CourseMaterial[]>>(`/courses/${id}/materials`)
  if (!data.success) throw new Error(data.error || 'Error al obtener materiales')
  return data.data as CourseMaterial[]
}

export async function createCourse(payload: CourseCreateInput) {
  const { data } = await http.post<ApiResponse<Course>>('/courses', payload)
  if (!data.success) throw new Error(data.error || 'Error al crear curso')
  return data.data as Course
}

export async function updateCourse(id: string, payload: Partial<CourseCreateInput>) {
  const { data } = await http.put<ApiResponse<Course>>(`/courses/${id}`, payload)
  if (!data.success) throw new Error(data.error || 'Error al actualizar curso')
  return data.data as Course
}

export async function deleteCourse(id: string) {
  const { data } = await http.delete<ApiResponse<{}>>(`/courses/${id}`)
  if (!data.success) throw new Error(data.error || 'Error al eliminar curso')
  return true
}

// Admin endpoints
export async function listPendingCourses() {
  const { data } = await http.get<ApiResponse<Course[]>>('/admin/courses/pending')
  if (!data.success) throw new Error(data.error || 'Error al listar pendientes')
  return data.data as Course[]
}

export async function approveCourse(id: string) {
  const { data } = await http.put<ApiResponse<Course>>(`/admin/courses/${id}/approve`)
  if (!data.success) throw new Error(data.error || 'Error al aprobar curso')
  return data.data as Course
}

export async function rejectCourse(id: string, reason: string) {
  const { data } = await http.put<ApiResponse<Course>>(`/admin/courses/${id}/reject`, { reason })
  if (!data.success) throw new Error(data.error || 'Error al rechazar curso')
  return data.data as Course
}
