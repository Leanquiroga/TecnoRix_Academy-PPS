import type { Role } from '../types/auth'

/**
 * Item de menú de navegación
 */
export interface NavigationItem {
  id: string
  label: string
  path: string
  icon: string
  badge?: number | string
  children?: NavigationItem[]
  roles?: Role[]
  divider?: boolean
  disabled?: boolean
}

/**
 * Menú de navegación para Admin
 */
export const ADMIN_NAVIGATION: NavigationItem[] = [
  {
    id: 'admin-dashboard',
    label: 'Dashboard',
    path: '/admin',
    icon: 'Dashboard',
    roles: ['admin'],
  },
  {
    id: 'admin-users',
    label: 'Gestión de Usuarios',
    path: '/admin/users',
    icon: 'People',
    roles: ['admin'],
    children: [
      {
        id: 'admin-users-pending',
        label: 'Usuarios Pendientes',
        path: '/admin/users/pending',
        icon: 'PendingActions',
        roles: ['admin'],
      },
      {
        id: 'admin-users-all',
        label: 'Todos los Usuarios',
        path: '/admin/users',
        icon: 'Groups',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'admin-courses',
    label: 'Gestión de Cursos',
    path: '/admin/courses',
    icon: 'School',
    roles: ['admin'],
    children: [
      {
        id: 'admin-courses-pending',
        label: 'Cursos Pendientes',
        path: '/admin/courses/approval',
        icon: 'RateReview',
        roles: ['admin'],
      },
      {
        id: 'admin-courses-all',
        label: 'Todos los Cursos',
        path: '/admin/courses',
        icon: 'LibraryBooks',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'admin-divider-1',
    label: '',
    path: '',
    icon: '',
    divider: true,
  },
  {
    id: 'admin-payments',
    label: 'Pagos',
    path: '/admin/payments',
    icon: 'Payments',
    roles: ['admin'],
    children: [
      {
        id: 'admin-payments-transactions',
        label: 'Historial de Transacciones',
        path: '/admin/payments',
        icon: 'Receipt',
        roles: ['admin'],
      },
      {
        id: 'admin-payments-reports',
        label: 'Reportes',
        path: '/admin/reports',
        icon: 'Assessment',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'admin-settings',
    label: 'Configuración',
    path: '/admin/settings',
    icon: 'Settings',
    roles: ['admin'],
    children: [
      {
        id: 'admin-settings-general',
        label: 'Configuración General',
        path: '/admin/settings',
        icon: 'Tune',
        roles: ['admin'],
      },
      {
        id: 'admin-settings-backups',
        label: 'Backups',
        path: '/admin/backups',
        icon: 'Backup',
        roles: ['admin'],
      },
    ],
  },
]

/**
 * Menú de navegación para Teacher
 */
export const TEACHER_NAVIGATION: NavigationItem[] = [
  {
    id: 'teacher-dashboard',
    label: 'Dashboard',
    path: '/teacher/dashboard',
    icon: 'Dashboard',
    roles: ['teacher'],
  },
  {
    id: 'teacher-courses',
    label: 'Mis Cursos',
    path: '/teacher/courses',
    icon: 'MenuBook',
    roles: ['teacher'],
    children: [
      {
        id: 'teacher-courses-create',
        label: 'Crear Nuevo Curso',
        path: '/courses/create',
        icon: 'AddCircle',
        roles: ['teacher'],
      },
      {
        id: 'teacher-courses-active',
        label: 'Cursos Activos',
        path: '/teacher/courses?status=active',
        icon: 'CheckCircle',
        roles: ['teacher'],
      },
      {
        id: 'teacher-courses-pending',
        label: 'Cursos Pendientes',
        path: '/teacher/courses?status=pending',
        icon: 'Schedule',
        roles: ['teacher'],
      },
      {
        id: 'teacher-courses-drafts',
        label: 'Borradores',
        path: '/teacher/courses?status=draft',
        icon: 'Drafts',
        roles: ['teacher'],
      },
    ],
  },
  {
    id: 'teacher-students',
    label: 'Mis Estudiantes',
    path: '/teacher/students',
    icon: 'Groups',
    roles: ['teacher'],
    children: [
      {
        id: 'teacher-students-by-course',
        label: 'Por Curso',
        path: '/teacher/students',
        icon: 'School',
        roles: ['teacher'],
      },
      {
        id: 'teacher-students-progress',
        label: 'Progreso General',
        path: '/teacher/students/progress',
        icon: 'TrendingUp',
        roles: ['teacher'],
      },
    ],
  },
  {
    id: 'teacher-divider-1',
    label: '',
    path: '',
    icon: '',
    divider: true,
  },
  {
    id: 'teacher-statistics',
    label: 'Estadísticas',
    path: '/teacher/statistics',
    icon: 'Analytics',
    roles: ['teacher'],
  },
  {
    id: 'teacher-profile',
    label: 'Mi Perfil',
    path: '/profile',
    icon: 'Person',
    roles: ['teacher'],
  },
]

/**
 * Menú de navegación para Student
 */
export const STUDENT_NAVIGATION: NavigationItem[] = [
  {
    id: 'student-dashboard',
    label: 'Dashboard',
    path: '/student/dashboard',
    icon: 'Dashboard',
    roles: ['student'],
  },
  {
    id: 'student-explore',
    label: 'Explorar Cursos',
    path: '/courses',
    icon: 'Explore',
    roles: ['student'],
    children: [
      {
        id: 'student-explore-all',
        label: 'Todos los Cursos',
        path: '/courses',
        icon: 'School',
        roles: ['student'],
      },
      {
        id: 'student-explore-categories',
        label: 'Por Categoría',
        path: '/courses/categories',
        icon: 'Category',
        roles: ['student'],
      },
    ],
  },
  {
    id: 'student-my-courses',
    label: 'Mis Cursos',
    path: '/student/my-courses',
    icon: 'School',
    roles: ['student'],
    children: [
      {
        id: 'student-my-courses-progress',
        label: 'En Progreso',
        path: '/student/my-courses?status=in_progress',
        icon: 'PlayArrow',
        roles: ['student'],
      },
      {
        id: 'student-my-courses-completed',
        label: 'Completados',
        path: '/student/my-courses?status=completed',
        icon: 'CheckCircle',
        roles: ['student'],
      },
    ],
  },
  {
    id: 'student-divider-1',
    label: '',
    path: '',
    icon: '',
    divider: true,
  },
  {
    id: 'student-progress',
    label: 'Mi Progreso',
    path: '/student/progress',
    icon: 'TrendingUp',
    roles: ['student'],
    children: [
      {
        id: 'student-progress-quizzes',
        label: 'Quizzes Realizados',
        path: '/student/progress/quizzes',
        icon: 'Quiz',
        roles: ['student'],
      },
      {
        id: 'student-progress-certificates',
        label: 'Certificados',
        path: '/student/certificates',
        icon: 'EmojiEvents',
        roles: ['student'],
      },
    ],
  },
  {
    id: 'student-payments',
    label: 'Historial de Pagos',
    path: '/student/payments',
    icon: 'Receipt',
    roles: ['student'],
  },
  {
    id: 'student-profile',
    label: 'Mi Perfil',
    path: '/profile',
    icon: 'Person',
    roles: ['student'],
  },
]

/**
 * Menú público (sin autenticación)
 */
export const PUBLIC_NAVIGATION: NavigationItem[] = [
  {
    id: 'public-home',
    label: 'Inicio',
    path: '/',
    icon: 'Home',
  },
  {
    id: 'public-courses',
    label: 'Cursos',
    path: '/courses',
    icon: 'School',
  },
  {
    id: 'public-about',
    label: 'Nosotros',
    path: '/about',
    icon: 'Info',
  },
  {
    id: 'public-contact',
    label: 'Contacto',
    path: '/contact',
    icon: 'Email',
  },
]

/**
 * Obtener navegación según el rol del usuario
 */
export function getNavigationByRole(role: Role | null): NavigationItem[] {
  if (!role) return PUBLIC_NAVIGATION

  switch (role) {
    case 'admin':
      return ADMIN_NAVIGATION
    case 'teacher':
      return TEACHER_NAVIGATION
    case 'student':
      return STUDENT_NAVIGATION
    default:
      return PUBLIC_NAVIGATION
  }
}

/**
 * Filtrar items de navegación por rol
 */
export function filterNavigationByRole(
  items: NavigationItem[],
  role: Role | null
): NavigationItem[] {
  if (!role) {
    return items.filter((item) => !item.roles || item.roles.length === 0)
  }

  return items
    .filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => ({
      ...item,
      children: item.children
        ? filterNavigationByRole(item.children, role)
        : undefined,
    }))
}

/**
 * Items del menú de usuario (dropdown)
 */
export interface UserMenuItem {
  id: string
  label: string
  icon: string
  action: 'navigate' | 'logout' | 'theme-toggle'
  path?: string
  divider?: boolean
}

export const USER_MENU_ITEMS: UserMenuItem[] = [
  {
    id: 'user-profile',
    label: 'Mi Perfil',
    icon: 'Person',
    action: 'navigate',
    path: '/profile',
  },
  {
    id: 'user-settings',
    label: 'Configuración',
    icon: 'Settings',
    action: 'navigate',
    path: '/settings',
  },
  {
    id: 'user-divider-1',
    label: '',
    icon: '',
    action: 'navigate',
    divider: true,
  },
  {
    id: 'user-theme',
    label: 'Cambiar Tema',
    icon: 'Brightness4',
    action: 'theme-toggle',
  },
  {
    id: 'user-logout',
    label: 'Cerrar Sesión',
    icon: 'Logout',
    action: 'logout',
  },
]
