import type { Role } from '../types/auth'

/**
 * Tipo para definir una ruta de la aplicación
 */
export interface RouteConfig {
  path: string
  label: string
  requiresAuth?: boolean
  allowedRoles?: Role[]
  icon?: string
  showInMenu?: boolean
  children?: RouteConfig[]
}

/**
 * Constantes de rutas - Evita hardcodear strings en el código
 */
export const ROUTES = {
  // Rutas públicas
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  COURSES: '/courses',
  COURSE_DETAIL: (id: string) => `/courses/${id}`,

  // Rutas privadas generales
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',

  // Rutas de Admin
  ADMIN: {
    ROOT: '/admin',
    USERS: '/admin/users',
    USERS_PENDING: '/admin/users/pending',
    COURSES: '/admin/courses',
    COURSES_PENDING: '/admin/courses/pending',
    COURSE_APPROVAL: '/admin/courses/approval',
    PAYMENTS: '/admin/payments',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
    BACKUPS: '/admin/backups',
  },

  // Rutas de Teacher
  TEACHER: {
    ROOT: '/teacher',
    DASHBOARD: '/teacher/dashboard',
    COURSES: '/teacher/courses',
    COURSE_CREATE: '/courses/create',
    COURSE_EDIT: (id: string) => `/courses/${id}/edit`,
    STUDENTS: '/teacher/students',
    STUDENTS_BY_COURSE: (courseId: string) => `/teacher/courses/${courseId}/students`,
    STATISTICS: '/teacher/statistics',
  },

  // Rutas de Student
  STUDENT: {
    ROOT: '/student',
    DASHBOARD: '/student/dashboard',
    MY_COURSES: '/student/my-courses',
    COURSE_VIEW: (id: string) => `/student/courses/${id}`,
    PROGRESS: '/student/progress',
    PAYMENTS: '/student/payments',
    CERTIFICATES: '/student/certificates',
  },

  // Rutas de Cursos (compartidas)
  COURSE: {
    LIST: '/courses',
    DETAIL: (id: string) => `/courses/${id}`,
    CREATE: '/courses/create',
    EDIT: (id: string) => `/courses/${id}/edit`,
    VIEW: (id: string) => `/student/courses/${id}`,
    FORUM: (id: string) => `/courses/${id}/forum`,
    MATERIALS: (id: string) => `/courses/${id}/materials`,
  },

  // Rutas de Forum
  FORUM: {
    COURSE: (courseId: string) => `/courses/${courseId}/forum`,
    POST: (courseId: string, postId: string) => `/courses/${courseId}/forum/${postId}`,
  },

  // Rutas de Quizzes
  QUIZ: {
    LIST: (courseId: string) => `/courses/${courseId}/quizzes`,
    DETAIL: (courseId: string, quizId: string) => `/courses/${courseId}/quizzes/${quizId}`,
    TAKE: (courseId: string, quizId: string) => `/courses/${courseId}/quizzes/${quizId}/take`,
    RESULTS: (courseId: string, quizId: string) => `/courses/${courseId}/quizzes/${quizId}/results`,
  },

  // Rutas de Pagos
  PAYMENT: {
    CHECKOUT: (courseId: string) => `/payments/checkout/${courseId}`,
    SUCCESS: '/payments/success',
    FAILED: '/payments/failed',
    HISTORY: '/payments/history',
  },

  // Rutas de error
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
  FORBIDDEN: '/403',
} as const

/**
 * Configuración completa de rutas con metadata
 */
export const ROUTE_CONFIGS: RouteConfig[] = [
  // Rutas públicas
  {
    path: ROUTES.HOME,
    label: 'Inicio',
    showInMenu: false,
  },
  {
    path: ROUTES.LOGIN,
    label: 'Iniciar Sesión',
    showInMenu: false,
  },
  {
    path: ROUTES.REGISTER,
    label: 'Registrarse',
    showInMenu: false,
  },
  {
    path: ROUTES.COURSES,
    label: 'Cursos',
    showInMenu: true,
    icon: 'School',
  },

  // Rutas privadas
  {
    path: ROUTES.DASHBOARD,
    label: 'Dashboard',
    requiresAuth: true,
    showInMenu: true,
    icon: 'Dashboard',
  },
  {
    path: ROUTES.PROFILE,
    label: 'Mi Perfil',
    requiresAuth: true,
    showInMenu: false,
  },

  // Rutas de Admin
  {
    path: ROUTES.ADMIN.ROOT,
    label: 'Administración',
    requiresAuth: true,
    allowedRoles: ['admin'],
    showInMenu: true,
    icon: 'AdminPanelSettings',
    children: [
      {
        path: ROUTES.ADMIN.USERS,
        label: 'Gestión de Usuarios',
        requiresAuth: true,
        allowedRoles: ['admin'],
        showInMenu: true,
        icon: 'People',
      },
      {
        path: ROUTES.ADMIN.USERS_PENDING,
        label: 'Usuarios Pendientes',
        requiresAuth: true,
        allowedRoles: ['admin'],
        showInMenu: true,
        icon: 'PendingActions',
      },
      {
        path: ROUTES.ADMIN.COURSES,
        label: 'Todos los Cursos',
        requiresAuth: true,
        allowedRoles: ['admin'],
        showInMenu: true,
        icon: 'LibraryBooks',
      },
      {
        path: ROUTES.ADMIN.COURSE_APPROVAL,
        label: 'Cursos Pendientes',
        requiresAuth: true,
        allowedRoles: ['admin'],
        showInMenu: true,
        icon: 'RateReview',
      },
      {
        path: ROUTES.ADMIN.PAYMENTS,
        label: 'Pagos',
        requiresAuth: true,
        allowedRoles: ['admin'],
        showInMenu: true,
        icon: 'Payments',
      },
      {
        path: ROUTES.ADMIN.SETTINGS,
        label: 'Configuración',
        requiresAuth: true,
        allowedRoles: ['admin'],
        showInMenu: true,
        icon: 'Settings',
      },
    ],
  },

  // Rutas de Teacher
  {
    path: ROUTES.TEACHER.ROOT,
    label: 'Profesor',
    requiresAuth: true,
    allowedRoles: ['teacher'],
    showInMenu: true,
    icon: 'School',
    children: [
      {
        path: ROUTES.TEACHER.DASHBOARD,
        label: 'Dashboard',
        requiresAuth: true,
        allowedRoles: ['teacher'],
        showInMenu: true,
        icon: 'Dashboard',
      },
      {
        path: ROUTES.TEACHER.COURSES,
        label: 'Mis Cursos',
        requiresAuth: true,
        allowedRoles: ['teacher'],
        showInMenu: true,
        icon: 'MenuBook',
      },
      {
        path: ROUTES.TEACHER.COURSE_CREATE,
        label: 'Crear Curso',
        requiresAuth: true,
        allowedRoles: ['teacher'],
        showInMenu: true,
        icon: 'AddCircle',
      },
      {
        path: ROUTES.TEACHER.STUDENTS,
        label: 'Mis Estudiantes',
        requiresAuth: true,
        allowedRoles: ['teacher'],
        showInMenu: true,
        icon: 'Groups',
      },
      {
        path: ROUTES.TEACHER.STATISTICS,
        label: 'Estadísticas',
        requiresAuth: true,
        allowedRoles: ['teacher'],
        showInMenu: true,
        icon: 'Analytics',
      },
    ],
  },

  // Rutas de Student
  {
    path: ROUTES.STUDENT.ROOT,
    label: 'Estudiante',
    requiresAuth: true,
    allowedRoles: ['student'],
    showInMenu: true,
    icon: 'Person',
    children: [
      {
        path: ROUTES.STUDENT.DASHBOARD,
        label: 'Dashboard',
        requiresAuth: true,
        allowedRoles: ['student'],
        showInMenu: true,
        icon: 'Dashboard',
      },
      {
        path: ROUTES.COURSES,
        label: 'Explorar Cursos',
        requiresAuth: true,
        allowedRoles: ['student'],
        showInMenu: true,
        icon: 'Explore',
      },
      {
        path: ROUTES.STUDENT.MY_COURSES,
        label: 'Mis Cursos',
        requiresAuth: true,
        allowedRoles: ['student'],
        showInMenu: true,
        icon: 'School',
      },
      {
        path: ROUTES.STUDENT.PROGRESS,
        label: 'Mi Progreso',
        requiresAuth: true,
        allowedRoles: ['student'],
        showInMenu: true,
        icon: 'TrendingUp',
      },
      {
        path: ROUTES.STUDENT.PAYMENTS,
        label: 'Historial de Pagos',
        requiresAuth: true,
        allowedRoles: ['student'],
        showInMenu: true,
        icon: 'Receipt',
      },
    ],
  },
]

/**
 * Helper para obtener la ruta por defecto según el rol
 */
export function getDefaultRouteByRole(role: Role): string {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN.ROOT
    case 'teacher':
      return ROUTES.TEACHER.DASHBOARD
    case 'student':
      return ROUTES.STUDENT.DASHBOARD
    default:
      return ROUTES.HOME
  }
}

/**
 * Helper para verificar si un usuario puede acceder a una ruta
 */
export function canAccessRoute(
  route: string,
  userRole: Role | null,
  isAuthenticated: boolean
): boolean {
  // Buscar la configuración de la ruta
  const findRouteConfig = (
    routes: RouteConfig[],
    targetPath: string
  ): RouteConfig | null => {
    for (const route of routes) {
      if (route.path === targetPath) return route
      if (route.children) {
        const found = findRouteConfig(route.children, targetPath)
        if (found) return found
      }
    }
    return null
  }

  const routeConfig = findRouteConfig(ROUTE_CONFIGS, route)
  if (!routeConfig) return true // Ruta no configurada, permitir acceso

  // Verificar autenticación
  if (routeConfig.requiresAuth && !isAuthenticated) return false

  // Verificar roles
  if (routeConfig.allowedRoles && userRole) {
    return routeConfig.allowedRoles.includes(userRole)
  }

  return true
}

/**
 * Helper para obtener rutas del menú según rol
 */
export function getMenuRoutesByRole(role: Role | null): RouteConfig[] {
  if (!role) {
    return ROUTE_CONFIGS.filter(
      (route) => !route.requiresAuth && route.showInMenu
    )
  }

  return ROUTE_CONFIGS.filter((route) => {
    if (!route.showInMenu) return false
    if (!route.requiresAuth) return true
    if (!route.allowedRoles) return true
    return route.allowedRoles.includes(role)
  })
}

/**
 * Helper para construir breadcrumbs
 */
export interface Breadcrumb {
  label: string
  path: string
}

export function getBreadcrumbs(currentPath: string): Breadcrumb[] {
  // Nota: El componente Breadcrumbs ya renderiza el link "Inicio".
  // Aquí devolvemos SOLO los items posteriores para evitar duplicar "Inicio".
  const breadcrumbs: Breadcrumb[] = []

  // Lógica básica de breadcrumbs según la ruta
  const segments = currentPath.split('/').filter(Boolean)

  if (segments.length === 0) return breadcrumbs

  // Admin routes
  if (segments[0] === 'admin') {
  breadcrumbs.push({ label: 'Admin', path: ROUTES.ADMIN.ROOT })
    if (segments[1] === 'courses') {
      breadcrumbs.push({ label: 'Cursos', path: ROUTES.ADMIN.COURSES })
      if (segments[2] === 'approval') {
        breadcrumbs.push({
          label: 'Aprobación',
          path: ROUTES.ADMIN.COURSE_APPROVAL,
        })
      }
    }
  }

  // Teacher routes
  if (segments[0] === 'teacher') {
  breadcrumbs.push({ label: 'Profesor', path: ROUTES.TEACHER.ROOT })
    if (segments[1] === 'courses') {
      breadcrumbs.push({ label: 'Mis Cursos', path: ROUTES.TEACHER.COURSES })
    }
  }

  // Student routes
  if (segments[0] === 'student') {
  breadcrumbs.push({ label: 'Estudiante', path: ROUTES.STUDENT.ROOT })
    if (segments[1] === 'courses') {
      breadcrumbs.push({ label: 'Mis Cursos', path: ROUTES.STUDENT.MY_COURSES })
    }
  }

  // Courses routes
  if (segments[0] === 'courses') {
  breadcrumbs.push({ label: 'Cursos', path: ROUTES.COURSES })
    if (segments[1] && segments[1] !== 'create') {
      breadcrumbs.push({
        label: 'Detalle del Curso',
        path: ROUTES.COURSE.DETAIL(segments[1]),
      })
    }
    if (segments[2] === 'edit') {
      breadcrumbs.push({ label: 'Editar', path: currentPath })
    }
  }

  return breadcrumbs
}
