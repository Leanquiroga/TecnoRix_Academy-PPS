import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'
import LoginPage from '../pages/Login'
import RegisterPage from '../pages/Register'
import DashboardPage from '../pages/Dashboard'
import AdminPage from '../pages/AdminPage'
import { PrivateRoute, RoleRoute } from './guards'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { 
    path: '/dashboard', 
    element: (
      <PrivateRoute>
        <DashboardPage />
      </PrivateRoute>
    ) 
  },
  { 
    path: '/admin', 
    element: (
      <RoleRoute roles={['admin']}>
        <AdminPage />
      </RoleRoute>
    ) 
  },
  { path: '*', element: <NotFound /> },
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}

export default AppRoutes