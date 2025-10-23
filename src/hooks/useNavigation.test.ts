import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNavigation } from './useNavigation'

// Mock de react-router-dom
const mockNavigate = vi.fn()
const mockLocation = {
  pathname: '/test',
  search: '',
  hash: '',
  state: null,
  key: 'default',
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  }
})

describe('useNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Navegación básica', () => {
    it('goHome navega a la ruta home', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goHome()

      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('goBack navega al home cuando no hay historial', () => {
      // Por defecto window.history.length es 1 en tests
      const { result } = renderHook(() => useNavigation())

      result.current.goBack()

      // goBack revisa el historial, si es <= 1 navega a home
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('goTo navega a una ruta específica', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goTo('/custom-route')

      expect(mockNavigate).toHaveBeenCalledWith('/custom-route')
    })

    it('goToReplace navega reemplazando la ruta actual', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToReplace('/new-route')

      expect(mockNavigate).toHaveBeenCalledWith('/new-route', { replace: true })
    })
  })

  describe('Navegación por Dashboard', () => {
    it('goToDashboard sin rol navega al dashboard genérico', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToDashboard()

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('goToDashboard con rol admin navega a ruta de admin', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToDashboard('admin')

      expect(mockNavigate).toHaveBeenCalledWith('/admin')
    })

    it('goToDashboard con rol teacher navega a ruta de teacher', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToDashboard('teacher')

      expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard')
    })

    it('goToDashboard con rol student navega a ruta de student', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToDashboard('student')

      expect(mockNavigate).toHaveBeenCalledWith('/student/dashboard')
    })
  })

  describe('Navegación de cursos', () => {
    it('goToCourses navega a lista de cursos', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToCourses()

      expect(mockNavigate).toHaveBeenCalledWith('/courses')
    })

    it('goToCourse navega al detalle de un curso', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToCourse('123')

      expect(mockNavigate).toHaveBeenCalledWith('/courses/123')
    })

    it('goToCourseView navega a la vista del curso para estudiantes', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToCourseView('456')

      expect(mockNavigate).toHaveBeenCalledWith('/student/courses/456')
    })

    it('goToCreateCourse navega a crear curso', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToCreateCourse()

      expect(mockNavigate).toHaveBeenCalledWith('/courses/create')
    })

    it('goToEditCourse navega a editar curso específico', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToEditCourse('789')

      expect(mockNavigate).toHaveBeenCalledWith('/courses/789/edit')
    })

    it('goToMyCourses navega a mis cursos', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToMyCourses()

      expect(mockNavigate).toHaveBeenCalledWith('/student/my-courses')
    })
  })

  describe('Navegación de usuario', () => {
    it('goToProfile navega al perfil', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToProfile()

      expect(mockNavigate).toHaveBeenCalledWith('/profile')
    })

    it('goToSettings navega a configuración', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToSettings()

      expect(mockNavigate).toHaveBeenCalledWith('/settings')
    })
  })

  describe('Navegación de autenticación', () => {
    it('goToLogin navega al login', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToLogin()

      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('goToRegister navega al registro', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToRegister()

      expect(mockNavigate).toHaveBeenCalledWith('/register')
    })
  })

  describe('Navegación de foro', () => {
    it('goToCourseForum navega al foro de un curso', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToCourseForum('course123')

      expect(mockNavigate).toHaveBeenCalledWith('/courses/course123/forum')
    })

    it('goToForumPost navega a un post específico', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToForumPost('course123', 'post456')

      expect(mockNavigate).toHaveBeenCalledWith('/courses/course123/forum/post456')
    })
  })

  describe('Navegación de quizzes', () => {
    it('goToQuizzes navega a la lista de quizzes', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToQuizzes('course123')

      expect(mockNavigate).toHaveBeenCalledWith('/courses/course123/quizzes')
    })

    it('goToTakeQuiz navega a tomar un quiz', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToTakeQuiz('course123', 'quiz456')

      expect(mockNavigate).toHaveBeenCalledWith('/courses/course123/quizzes/quiz456/take')
    })

    it('goToQuizResults navega a resultados del quiz', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToQuizResults('course123', 'quiz456')

      expect(mockNavigate).toHaveBeenCalledWith('/courses/course123/quizzes/quiz456/results')
    })
  })

  describe('Navegación de pagos', () => {
    it('goToCheckout navega al checkout de un curso', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToCheckout('course123')

      expect(mockNavigate).toHaveBeenCalledWith('/payments/checkout/course123')
    })

    it('goToPaymentHistory navega al historial de pagos', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.goToPaymentHistory()

      expect(mockNavigate).toHaveBeenCalledWith('/payments/history')
    })
  })

  describe('Utilidades de navegación', () => {
    it('isRouteActive retorna true si la ruta coincide', () => {
      const { result } = renderHook(() => useNavigation())

      const isActive = result.current.isRouteActive('/test')

      expect(isActive).toBe(true)
    })

    it('isRouteActive retorna false si la ruta no coincide', () => {
      const { result } = renderHook(() => useNavigation())

      const isActive = result.current.isRouteActive('/other')

      expect(isActive).toBe(false)
    })

    it('isCurrentRoute retorna true para ruta exacta', () => {
      const { result } = renderHook(() => useNavigation())

      const isCurrent = result.current.isCurrentRoute('/test')

      expect(isCurrent).toBe(true)
    })

    it('isCurrentRoute retorna false para ruta diferente', () => {
      const { result } = renderHook(() => useNavigation())

      const isCurrent = result.current.isCurrentRoute('/other')

      expect(isCurrent).toBe(false)
    })

    it('currentPath retorna la ruta actual', () => {
      const { result } = renderHook(() => useNavigation())

      expect(result.current.currentPath).toBe('/test')
    })

    it('searchParams retorna los parámetros de query', () => {
      const { result } = renderHook(() => useNavigation())

      expect(result.current.searchParams).toBeInstanceOf(URLSearchParams)
    })
  })

  describe('Navegación por roles', () => {
    it('navigateByRole navega según el rol proporcionado', () => {
      const { result } = renderHook(() => useNavigation())

      result.current.navigateByRole('admin')

      expect(mockNavigate).toHaveBeenCalledWith('/admin')
    })
  })
})
