import { create } from 'zustand'
import type { Course, CoursePublic, CourseMaterial, CourseCreateInput } from '../types/course'
import * as CourseAPI from '../api/course.service'

interface CourseState {
  // Estado
  courses: CoursePublic[]
  currentCourse: CoursePublic | null
  materials: CourseMaterial[]
  pendingCourses: Course[]
  loading: boolean
  error: string | null

  // Acciones públicas
  fetchPublicCourses: () => Promise<void>
  fetchCourseById: (id: string) => Promise<void>
  fetchCourseMaterials: (id: string) => Promise<void>
  clearCurrentCourse: () => void

  // Acciones de teacher
  createCourse: (payload: CourseCreateInput) => Promise<Course>
  updateCourse: (id: string, payload: Partial<CourseCreateInput>) => Promise<Course>
  deleteCourse: (id: string) => Promise<void>

  // Acciones de admin
  fetchPendingCourses: () => Promise<void>
  approveCourse: (id: string) => Promise<void>
  rejectCourse: (id: string, reason?: string) => Promise<void>

  // Utilidades
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const useCourseStore = create<CourseState>((set, get) => ({
  // Estado inicial
  courses: [],
  currentCourse: null,
  materials: [],
  pendingCourses: [],
  loading: false,
  error: null,

  // Acciones públicas
  fetchPublicCourses: async () => {
    try {
      set({ loading: true, error: null })
      const data = await CourseAPI.listPublicCourses()
      set({ courses: data, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar cursos'
      set({ error: message, loading: false })
      throw err
    }
  },

  fetchCourseById: async (id: string) => {
    try {
      set({ loading: true, error: null })
      const data = await CourseAPI.getCoursePublicById(id)
      set({ currentCourse: data, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar curso'
      set({ error: message, loading: false, currentCourse: null })
      throw err
    }
  },

  fetchCourseMaterials: async (id: string) => {
    try {
      set({ loading: true, error: null })
      const data = await CourseAPI.getCourseMaterials(id)
      set({ materials: data, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar materiales'
      set({ error: message, loading: false })
      throw err
    }
  },

  clearCurrentCourse: () => {
    set({ currentCourse: null, materials: [] })
  },

  // Acciones de teacher
  createCourse: async (payload: CourseCreateInput) => {
    try {
      set({ loading: true, error: null })
      const course = await CourseAPI.createCourse(payload)
      set({ loading: false })
      return course
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear curso'
      set({ error: message, loading: false })
      throw err
    }
  },

  updateCourse: async (id: string, payload: Partial<CourseCreateInput>) => {
    try {
      set({ loading: true, error: null })
      const course = await CourseAPI.updateCourse(id, payload)
      
      // Actualizar currentCourse si es el mismo
      if (get().currentCourse?.id === id) {
        set({ currentCourse: course as unknown as CoursePublic })
      }
      
      set({ loading: false })
      return course
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar curso'
      set({ error: message, loading: false })
      throw err
    }
  },

  deleteCourse: async (id: string) => {
    try {
      set({ loading: true, error: null })
      await CourseAPI.deleteCourse(id)
      
      // Remover de la lista si existe
      const courses = get().courses.filter(c => c.id !== id)
      set({ courses, loading: false })
      
      // Limpiar currentCourse si es el mismo
      if (get().currentCourse?.id === id) {
        set({ currentCourse: null })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar curso'
      set({ error: message, loading: false })
      throw err
    }
  },

  // Acciones de admin
  fetchPendingCourses: async () => {
    try {
      set({ loading: true, error: null })
      const data = await CourseAPI.listPendingCourses()
      set({ pendingCourses: data, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar cursos pendientes'
      set({ error: message, loading: false })
      throw err
    }
  },

  approveCourse: async (id: string) => {
    try {
      set({ loading: true, error: null })
      await CourseAPI.approveCourse(id)
      
      // Remover de pendientes
      const pendingCourses = get().pendingCourses.filter(c => c.id !== id)
      set({ pendingCourses, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al aprobar curso'
      set({ error: message, loading: false })
      throw err
    }
  },

  rejectCourse: async (id: string, reason?: string) => {
    try {
      set({ loading: true, error: null })
      await CourseAPI.rejectCourse(id, reason || '')
      
      // Remover de pendientes
      const pendingCourses = get().pendingCourses.filter(c => c.id !== id)
      set({ pendingCourses, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al rechazar curso'
      set({ error: message, loading: false })
      throw err
    }
  },

  // Utilidades
  clearError: () => set({ error: null }),
  setLoading: (loading: boolean) => set({ loading }),
}))
