import http from './http'
import type {
  EnrollmentWithCourse,
  EnrollmentWithStudent,
  StudentStats,
  EnrollResponse,
  UpdateProgressResponse,
} from '../types/enrollment'

export const enrollmentService = {
  async enroll(courseId: string) {
    const { data } = await http.post<EnrollResponse>('/enrollments', { course_id: courseId })
    return data
  },

  async getMyCourses(status?: string) {
    const params = status ? { status } : undefined
    const { data } = await http.get<EnrollmentWithCourse[]>('/enrollments/my-courses', { params })
    return data
  },

  async getEnrollment(id: string) {
    const { data } = await http.get<EnrollmentWithCourse>(`/enrollments/${id}`)
    return data
  },

  async updateProgress(id: string, progress: number) {
    const { data } = await http.put<UpdateProgressResponse>(`/enrollments/${id}/progress`, { progress })
    return data
  },

  async getCourseStudents(courseId: string) {
    const { data } = await http.get<EnrollmentWithStudent[]>(`/courses/${courseId}/students`)
    return data
  },

  async getStudentStats() {
    const { data } = await http.get<StudentStats>('/enrollments/stats/student')
    return data
  },
}

export default enrollmentService
