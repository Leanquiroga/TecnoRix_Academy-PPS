import { useCourseStore } from '../store/course.store'

/**
 * Hook para acceder al store de cursos
 * Proporciona acceso a todos los estados y acciones de gestión de cursos
 */
export function useCourse() {
  const {
    // Estado
    courses,
    currentCourse,
    materials,
    pendingCourses,
    loading,
    error,

    // Acciones públicas
    fetchPublicCourses,
    fetchCourseById,
    fetchCourseMaterials,
    clearCurrentCourse,

    // Acciones de teacher
    createCourse,
    updateCourse,
    deleteCourse,

    // Acciones de admin
    fetchPendingCourses,
    approveCourse,
    rejectCourse,

    // Utilidades
    clearError,
    setLoading,
  } = useCourseStore()

  return {
    // Estado
    courses,
    currentCourse,
    materials,
    pendingCourses,
    loading,
    error,

    // Acciones públicas
    fetchPublicCourses,
    fetchCourseById,
    fetchCourseMaterials,
    clearCurrentCourse,

    // Acciones de teacher
    createCourse,
    updateCourse,
    deleteCourse,

    // Acciones de admin
    fetchPendingCourses,
    approveCourse,
    rejectCourse,

    // Utilidades
    clearError,
    setLoading,
  }
}
