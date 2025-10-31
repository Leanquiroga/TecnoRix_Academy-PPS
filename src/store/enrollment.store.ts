import { create } from 'zustand'
import enrollmentAPI from '../api/enrollment.service'
import type { EnrollmentWithCourse, EnrollmentStatus, UpdateProgressResponse } from '../types/enrollment'

type MyCoursesFilter = EnrollmentStatus | 'all'

interface EnrollmentState {
  myCourses: EnrollmentWithCourse[]
  loading: boolean
  error: string | null
  filter: MyCoursesFilter
  // actions
  setFilter: (filter: MyCoursesFilter) => void
  fetchMyCourses: (status?: EnrollmentStatus) => Promise<void>
  enroll: (courseId: string) => Promise<{ requires_payment?: boolean }>
  updateProgress: (enrollmentId: string, progress: number) => Promise<UpdateProgressResponse>
}

export const useEnrollmentStore = create<EnrollmentState>((set, get) => ({
  myCourses: [],
  loading: false,
  error: null,
  filter: 'all',

  setFilter: (filter) => set({ filter }),

  fetchMyCourses: async (status) => {
    set({ loading: true, error: null })
    try {
      const data = await enrollmentAPI.getMyCourses(status)
      set({ myCourses: data })
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      const msg = error?.response?.data?.error || 'Error al obtener tus cursos'
      set({ error: msg })
    } finally {
      set({ loading: false })
    }
  },

  enroll: async (courseId) => {
    const res = await enrollmentAPI.enroll(courseId)
    // Refrescar lista para reflejar nueva inscripción cuando sea gratuita
    try {
      await get().fetchMyCourses()
    } catch {
      // Ignorar error silenciosamente al refrescar
    }
    return { requires_payment: res.requires_payment }
  },

  updateProgress: async (enrollmentId, progress) => {
    const res = await enrollmentAPI.updateProgress(enrollmentId, progress)
    // Actualizar estado local rápidamente
    set((state) => ({
      myCourses: state.myCourses.map((e) =>
        e.id === enrollmentId
          ? { ...e, progress: res.enrollment.progress, status: res.enrollment.status }
          : e
      ),
    }))
    return res
  },
}))

export default useEnrollmentStore
