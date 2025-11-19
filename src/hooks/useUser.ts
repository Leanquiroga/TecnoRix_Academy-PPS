import { useUserStore } from '../store/user.store'

/**
 * Hook de acceso al store de usuarios y aplicaciones de profesores.
 * Mantiene paridad con el patrón de `useCourse`.
 */
export function useUser() {
  const {
    // Estado usuarios
    users,
    usersPagination,
    // Estado aplicaciones
    applications,
    applicationsStatusFilter,
    applicationsPagination,
    // Flags
    loading,
    error,
    success,
    // Acciones usuarios
    fetchUsers,
    approveTeacher,
    changeUserRole,
    suspendUser,
    // Acciones aplicaciones
    setApplicationsStatusFilter,
    fetchTeacherApplications,
    approveTeacherApplication,
    rejectTeacherApplication,
    reviewCredential,
    // Utilidades
    clearError,
    clearSuccess,
    setLoading,
  } = useUserStore()

  return {
    users,
    usersPagination,
    applications,
    applicationsStatusFilter,
    applicationsPagination,
    loading,
    error,
    success,
    fetchUsers,
    approveTeacher,
    changeUserRole,
    suspendUser,
    setApplicationsStatusFilter,
    fetchTeacherApplications,
    approveTeacherApplication,
    rejectTeacherApplication,
    reviewCredential,
    clearError,
    clearSuccess,
    setLoading,
  }
}
