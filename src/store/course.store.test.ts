import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCourseStore } from './course.store'
import * as CourseAPI from '../api/course.service'
import type { CoursePublic, CourseMaterial, Course } from '../types/course'

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
      const mockCourses: CoursePublic[] = [
        { 
          id: '1', 
          title: 'Curso 1', 
          description: 'Desc 1', 
          price: 0, 
          teacher_id: 't1',
          instructor_name: 'Teacher 1'
        },
        { 
          id: '2', 
          title: 'Curso 2', 
          description: 'Desc 2', 
          price: 1000, 
          teacher_id: 't2',
          instructor_name: 'Teacher 2'
        },
      ]

      vi.mocked(CourseAPI.listPublicCourses).mockResolvedValue(mockCourses)

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
      const mockCourse: CoursePublic = { 
        id: '1', 
        title: 'Curso Test', 
        description: 'Descripción',
        price: 5000,
        teacher_id: 't1',
        instructor_name: 'Teacher Test'
      }
      vi.mocked(CourseAPI.getCoursePublicById).mockResolvedValue(mockCourse)

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
        currentCourse: { 
          id: '1', 
          title: 'Test',
          description: 'Test desc',
          price: 0,
          teacher_id: 't1',
          instructor_name: 'Test'
        } as CoursePublic,
        materials: [{ 
          id: '1', 
          title: 'Material 1',
          course_id: '1',
          type: 'video',
          url: 'http://test.com',
          order: 1,
          created_at: '',
          updated_at: ''
        } as CourseMaterial]
      })

      clearCurrentCourse()

      const state = useCourseStore.getState()
      expect(state.currentCourse).toBeNull()
      expect(state.materials).toEqual([])
    })
  })

  describe('createCourse', () => {
    it('debe crear un curso exitosamente', async () => {
      const mockCourse: Course = { 
        id: '1', 
        title: 'Nuevo Curso',
        description: 'Descripción',
        price: 0,
        teacher_id: 't1',
        status: 'pending_approval' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      const payload = { 
        title: 'Nuevo Curso', 
        description: 'Descripción',
        price: 0
      }

      vi.mocked(CourseAPI.createCourse).mockResolvedValue(mockCourse)

      const { createCourse } = useCourseStore.getState()
      const result = await createCourse(payload)

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
          { 
            id: '1', 
            title: 'Curso 1',
            description: 'Desc 1',
            price: 0,
            teacher_id: 't1',
            instructor_name: 'Teacher 1'
          } as CoursePublic,
          { 
            id: '2', 
            title: 'Curso 2',
            description: 'Desc 2',
            price: 1000,
            teacher_id: 't2',
            instructor_name: 'Teacher 2'
          } as CoursePublic,
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
      const mockPending: Course[] = [
        { 
          id: '1', 
          title: 'Pendiente 1', 
          description: 'Desc 1',
          price: 0,
          teacher_id: 't1',
          status: 'pending_approval' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: '2', 
          title: 'Pendiente 2', 
          description: 'Desc 2',
          price: 1000,
          teacher_id: 't2',
          status: 'pending_approval' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
      ]

      vi.mocked(CourseAPI.listPendingCourses).mockResolvedValue(mockPending)

      const { fetchPendingCourses } = useCourseStore.getState()
      await fetchPendingCourses()

      const state = useCourseStore.getState()
      expect(state.pendingCourses).toEqual(mockPending)
    })
  })

  describe('approveCourse', () => {
    it('debe aprobar un curso y removerlo de pendientes', async () => {
      const approvedCourse: Course = {
        id: '1',
        title: 'Aprobado',
        description: 'Desc',
        price: 0,
        teacher_id: 't1',
        status: 'approved' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      vi.mocked(CourseAPI.approveCourse).mockResolvedValue(approvedCourse)

      // Agregar cursos pendientes
      useCourseStore.setState({
        pendingCourses: [
          { 
            id: '1', 
            title: 'Pendiente 1',
            description: 'Desc 1',
            price: 0,
            teacher_id: 't1',
            status: 'pending_approval' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Course,
          { 
            id: '2', 
            title: 'Pendiente 2',
            description: 'Desc 2',
            price: 1000,
            teacher_id: 't2',
            status: 'pending_approval' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Course,
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
