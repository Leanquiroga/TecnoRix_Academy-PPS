import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { ROUTES } from '../routes/routes.config'

interface RootLayoutProps {
  children: ReactNode
}

/**
 * Layout raíz que determina si mostrar AppLayout con navegación
 * Páginas de autenticación (login/register) no muestran navbar/sidebar
 */
export function RootLayout({ children }: RootLayoutProps) {
  const location = useLocation()

  // Rutas que no deben mostrar el layout completo (sin navbar/sidebar)
  const authRoutes = [ROUTES.LOGIN, ROUTES.REGISTER]
  const isAuthRoute = authRoutes.includes(location.pathname as typeof authRoutes[number])

  const isHome = location.pathname === ROUTES.HOME

  // Rutas públicas que muestran navbar pero no sidebar
  const publicRoutes = [
    ROUTES.HOME, 
    ROUTES.COURSES,
    '/about',    // TODO: Agregar a ROUTES.config cuando se implemente
    '/contact'   // TODO: Agregar a ROUTES.config cuando se implemente
  ]
  const isPublicRoute = publicRoutes.some(route => 
    location.pathname === route || location.pathname.startsWith(route + '/')
  )

  if (isAuthRoute) {
    // Solo el contenido, sin navbar ni sidebar
    return <>{children}</>
  }

  if (isPublicRoute) {
    // Navbar pero sin sidebar
    return (
      <AppLayout showNavbar={true} showSidebar={false} showBreadcrumbs={!isHome}>
        {children}
      </AppLayout>
    )
  }

  // Layout completo con navbar y sidebar (rutas privadas)
  return (
    <AppLayout showNavbar={true} showSidebar={true} showBreadcrumbs={!isHome}>
      {children}
    </AppLayout>
  )
}

export default RootLayout
