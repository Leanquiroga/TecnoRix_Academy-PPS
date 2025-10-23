import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCourseStore } from './course.store'
import * as CourseAPI from '../api/course.service'

// Mock del API
vi.mock('../api/course.service')

describe('course.store', () => {
  beforeEach(() => {
    // Resetear el store antes de cada test
    const { clearError, clearCurrentCourse } = useCourseStore.getState()
    clearError()
    clearCurrentCourse()
    vi.clearAllMocks()
  })

  describe('Estado inicial', () => {
    it('debe tener el estado inicial correcto', () => {
      const state = useCourseStore.getState()
      expect(state.courses).toEqual([])
      expect(state.currentCourse).toBeNull()
      expect(state.materials).toEqual([])
      expect(state.pendingCourses).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('fetchPublicCourses', () => {
    it('debe cargar cursos públicos exitosamente', async () => {
      const mockCourses = [
        { id: '1', title: 'Curso 1', description: 'Desc 1' },
        { id: '2', title: 'Curso 2', description: 'Desc 2' },
      ]

      vi.mocked(CourseAPI.listPublicCourses).mockResolvedValue(mockCourses as any)

      const { fetchPublicCourses } = useCourseStore.getState()
      await fetchPublicCourses()

      const state = useCourseStore.getState()
      expect(state.courses).toEqual(mockCourses)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('debe manejar errores al cargar cursos', async () => {
      const errorMessage = 'Error de red'
      vi.mocked(CourseAPI.listPublicCourses).mockRejectedValue(new Error(errorMessage))

      const { fetchPublicCourses } = useCourseStore.getState()
      
      await expect(fetchPublicCourses()).rejects.toThrow(errorMessage)

      const state = useCourseStore.getState()
      expect(state.error).toBe(errorMessage)
      expect(state.loading).toBe(false)
    })
  })

  describe('fetchCourseById', () => {
    it('debe cargar un curso por ID', async () => {
      const mockCourse = { id: '1', title: 'Curso Test', description: 'Descripción' }
      vi.mocked(CourseAPI.getCoursePublicById).mockResolvedValue(mockCourse as any)

      const { fetchCourseById } = useCourseStore.getState()
      await fetchCourseById('1')

      const state = useCourseStore.getState()
      expect(state.currentCourse).toEqual(mockCourse)
      expect(state.loading).toBe(false)
    })
  })

  describe('clearCurrentCourse', () => {
    it('debe limpiar el curso actual y materiales', () => {
      const { clearCurrentCourse } = useCourseStore.getState()
      
      // Simular que hay un curso actual
      useCourseStore.setState({ 
        currentCourse: { id: '1', title: 'Test' } as any,
        materials: [{ id: '1', title: 'Material 1' } as any]
      })

      clearCurrentCourse()

      const state = useCourseStore.getState()
      expect(state.currentCourse).toBeNull()
      expect(state.materials).toEqual([])
    })
  })

  describe('createCourse', () => {
    it('debe crear un curso exitosamente', async () => {
      const mockCourse = { 
        id: '1', 
        title: 'Nuevo Curso',
        description: 'Descripción',
        status: 'pending_approval'
      }
      const payload = { 
        title: 'Nuevo Curso', 
        description: 'Descripción' 
      }

      vi.mocked(CourseAPI.createCourse).mockResolvedValue(mockCourse as any)

      const { createCourse } = useCourseStore.getState()
      const result = await createCourse(payload as any)

      expect(result).toEqual(mockCourse)
      expect(CourseAPI.createCourse).toHaveBeenCalledWith(payload)
    })
  })

  describe('deleteCourse', () => {
    it('debe eliminar un curso y actualizar el estado', async () => {
      vi.mocked(CourseAPI.deleteCourse).mockResolvedValue(true)

      // Agregar cursos al estado
      useCourseStore.setState({ 
        courses: [
          { id: '1', title: 'Curso 1' } as any,
          { id: '2', title: 'Curso 2' } as any,
        ]
      })

      const { deleteCourse } = useCourseStore.getState()
      await deleteCourse('1')

      const state = useCourseStore.getState()
      expect(state.courses).toHaveLength(1)
      expect(state.courses[0].id).toBe('2')
    })
  })

  describe('fetchPendingCourses', () => {
    it('debe cargar cursos pendientes (admin)', async () => {
      const mockPending = [
        { id: '1', title: 'Pendiente 1', status: 'pending_approval' },
        { id: '2', title: 'Pendiente 2', status: 'pending_approval' },
      ]

      vi.mocked(CourseAPI.listPendingCourses).mockResolvedValue(mockPending as any)

      const { fetchPendingCourses } = useCourseStore.getState()
      await fetchPendingCourses()

      const state = useCourseStore.getState()
      expect(state.pendingCourses).toEqual(mockPending)
    })
  })

  describe('approveCourse', () => {
    it('debe aprobar un curso y removerlo de pendientes', async () => {
      vi.mocked(CourseAPI.approveCourse).mockResolvedValue({} as any)

      // Agregar cursos pendientes
      useCourseStore.setState({
        pendingCourses: [
          { id: '1', title: 'Pendiente 1' } as any,
          { id: '2', title: 'Pendiente 2' } as any,
        ]
      })

      const { approveCourse } = useCourseStore.getState()
      await approveCourse('1')

      const state = useCourseStore.getState()
      expect(state.pendingCourses).toHaveLength(1)
      expect(state.pendingCourses[0].id).toBe('2')
    })
  })

  describe('Utilidades', () => {
    it('clearError debe limpiar el error', () => {
      useCourseStore.setState({ error: 'Algún error' })
      
      const { clearError } = useCourseStore.getState()
      clearError()

      expect(useCourseStore.getState().error).toBeNull()
    })

    it('setLoading debe actualizar el estado de carga', () => {
      const { setLoading } = useCourseStore.getState()
      
      setLoading(true)
      expect(useCourseStore.getState().loading).toBe(true)
      
      setLoading(false)
      expect(useCourseStore.getState().loading).toBe(false)
    })
  })
})
