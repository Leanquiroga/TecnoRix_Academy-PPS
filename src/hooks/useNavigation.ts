import { useNavigate, useLocation } from 'react-router-dom'
import { useCallback } from 'react'
import { ROUTES, getDefaultRouteByRole } from '../routes/routes.config'
import type { Role } from '../types/auth'

/**
 * Hook personalizado para navegación programática
 * Centraliza toda la lógica de navegación de la aplicación
 */
export function useNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  /**
   * Navegar al home
   */
  const goHome = useCallback(() => {
    navigate(ROUTES.HOME)
  }, [navigate])

  /**
   * Navegar al dashboard según el rol
   */
  const goToDashboard = useCallback(
    (role?: Role) => {
      if (role) {
        navigate(getDefaultRouteByRole(role))
      } else {
        navigate(ROUTES.DASHBOARD)
      }
    },
    [navigate]
  )

  /**
   * Navegar a la lista de cursos
   */
  const goToCourses = useCallback(() => {
    navigate(ROUTES.COURSES)
  }, [navigate])

  /**
   * Navegar al detalle de un curso
   */
  const goToCourse = useCallback(
    (courseId: string) => {
      navigate(ROUTES.COURSE.DETAIL(courseId))
    },
    [navigate]
  )

  /**
   * Navegar a la vista de un curso (estudiante)
   */
  const goToCourseView = useCallback(
    (courseId: string) => {
      navigate(ROUTES.STUDENT.COURSE_VIEW(courseId))
    },
    [navigate]
  )

  /**
   * Navegar a crear curso (teacher)
   */
  const goToCreateCourse = useCallback(() => {
    navigate(ROUTES.TEACHER.COURSE_CREATE)
  }, [navigate])

  /**
   * Navegar a editar curso (teacher)
   */
  const goToEditCourse = useCallback(
    (courseId: string) => {
      navigate(ROUTES.COURSE.EDIT(courseId))
    },
    [navigate]
  )

  /**
   * Navegar a mis cursos
   */
  const goToMyCourses = useCallback(() => {
    navigate(ROUTES.STUDENT.MY_COURSES)
  }, [navigate])

  /**
   * Navegar al perfil
   */
  const goToProfile = useCallback(() => {
    navigate(ROUTES.PROFILE)
  }, [navigate])

  /**
   * Navegar a configuración
   */
  const goToSettings = useCallback(() => {
    navigate(ROUTES.SETTINGS)
  }, [navigate])

  /**
   * Navegar al foro de un curso
   */
  const goToCourseForum = useCallback(
    (courseId: string) => {
      navigate(ROUTES.FORUM.COURSE(courseId))
    },
    [navigate]
  )

  /**
   * Navegar a un post específico del foro
   */
  const goToForumPost = useCallback(
    (courseId: string, postId: string) => {
      navigate(ROUTES.FORUM.POST(courseId, postId))
    },
    [navigate]
  )

  /**
   * Navegar a la lista de quizzes de un curso
   */
  const goToQuizzes = useCallback(
    (courseId: string) => {
      navigate(ROUTES.QUIZ.LIST(courseId))
    },
    [navigate]
  )

  /**
   * Navegar a tomar un quiz
   */
  const goToTakeQuiz = useCallback(
    (courseId: string, quizId: string) => {
      navigate(ROUTES.QUIZ.TAKE(courseId, quizId))
    },
    [navigate]
  )

  /**
   * Navegar a resultados de un quiz
   */
  const goToQuizResults = useCallback(
    (courseId: string, quizId: string) => {
      navigate(ROUTES.QUIZ.RESULTS(courseId, quizId))
    },
    [navigate]
  )

  /**
   * Navegar al checkout de un curso
   */
  const goToCheckout = useCallback(
    (courseId: string) => {
      navigate(ROUTES.PAYMENT.CHECKOUT(courseId))
    },
    [navigate]
  )

  /**
   * Navegar a historial de pagos
   */
  const goToPaymentHistory = useCallback(() => {
    navigate(ROUTES.PAYMENT.HISTORY)
  }, [navigate])

  /**
   * Navegar atrás
   */
  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(ROUTES.HOME)
    }
  }, [navigate])

  /**
   * Navegar a login
   */
  const goToLogin = useCallback(() => {
    navigate(ROUTES.LOGIN)
  }, [navigate])

  /**
   * Navegar a register
   */
  const goToRegister = useCallback(() => {
    navigate(ROUTES.REGISTER)
  }, [navigate])

  /**
   * Navegar a una ruta específica
   */
  const goTo = useCallback(
    (path: string) => {
      navigate(path)
    },
    [navigate]
  )

  /**
   * Navegar con replace (no agrega a historial)
   */
  const goToReplace = useCallback(
    (path: string) => {
      navigate(path, { replace: true })
    },
    [navigate]
  )

  /**
   * Navegar según el rol del usuario
   */
  const navigateByRole = useCallback(
    (role: Role) => {
      const defaultRoute = getDefaultRouteByRole(role)
      navigate(defaultRoute)
    },
    [navigate]
  )

  /**
   * Verificar si estamos en una ruta específica
   */
  const isCurrentRoute = useCallback(
    (path: string) => {
      return location.pathname === path
    },
    [location]
  )

  /**
   * Verificar si estamos en una ruta que comienza con un path
   */
  const isRouteActive = useCallback(
    (pathPrefix: string) => {
      return location.pathname.startsWith(pathPrefix)
    },
    [location]
  )

  /**
   * Obtener la ruta actual
   */
  const currentPath = location.pathname

  /**
   * Obtener parámetros de query string
   */
  const searchParams = new URLSearchParams(location.search)

  return {
    // Navegación básica
    goHome,
    goBack,
    goTo,
    goToReplace,
    navigateByRole,

    // Dashboard y perfil
    goToDashboard,
    goToProfile,
    goToSettings,

    // Cursos
    goToCourses,
    goToCourse,
    goToCourseView,
    goToCreateCourse,
    goToEditCourse,
    goToMyCourses,

    // Foros
    goToCourseForum,
    goToForumPost,

    // Quizzes
    goToQuizzes,
    goToTakeQuiz,
    goToQuizResults,

    // Pagos
    goToCheckout,
    goToPaymentHistory,

    // Auth
    goToLogin,
    goToRegister,

    // Utilidades
    isCurrentRoute,
    isRouteActive,
    currentPath,
    searchParams,
  }
}

export default useNavigation
