import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'
import LoginPage from '../pages/Login'
import RegisterPage from '../pages/Register'
import DashboardPage from '../pages/Dashboard'
import AdminPage from '../pages/AdminPage'
import CreateCoursePage from '../pages/CreateCourse'
import EditCoursePage from '../pages/EditCourse'
import CourseApprovalPage from '../pages/CourseApproval'
import { CoursesList } from '../pages/CoursesList'
import { CourseDetail } from '../pages/CourseDetail'
import MyCourses from '../pages/MyCourses'
import CourseView from '../pages/CourseView'
import StudentDashboard from '../pages/StudentDashboard'
import TeacherDashboard from '../pages/TeacherDashboard'
import StudentsList from '../pages/StudentsList'
import { PrivateRoute, RoleRoute } from './guards'
import { RootLayout } from '../layouts/RootLayout'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RootLayout>
        <Outlet />
      </RootLayout>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'courses', element: <CoursesList /> },
      { path: 'courses/:id', element: <CourseDetail /> },
      {
        path: 'student/my-courses',
        element: (
          <RoleRoute roles={['student']}>
            <MyCourses />
          </RoleRoute>
        )
      },
      {
        path: 'student/courses/:id',
        element: (
          <RoleRoute roles={['student']}>
            <CourseView />
          </RoleRoute>
        )
      },
        {
          path: 'student/dashboard',
          element: (
            <RoleRoute roles={['student']}>
              <StudentDashboard />
            </RoleRoute>
          )
        },
        {
          path: 'teacher/dashboard',
          element: (
            <RoleRoute roles={['teacher']}>
              <TeacherDashboard />
            </RoleRoute>
          )
        },
      { 
        path: 'dashboard',
        element: (
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        ) 
      },
      { 
        path: 'admin', 
        element: (
          <RoleRoute roles={['admin']}>
            <AdminPage />
          </RoleRoute>
        ) 
      },
      {
        path: 'admin/courses/approval',
        element: (
          <RoleRoute roles={['admin']}>
            <CourseApprovalPage />
          </RoleRoute>
        )
      },
      {
        path: 'courses/create',
        element: (
          <RoleRoute roles={['teacher']}>
            <CreateCoursePage />
          </RoleRoute>
        )
      },
      {
        path: 'teacher/courses/:id/students',
        element: (
          <RoleRoute roles={['teacher']}>
            <StudentsList />
          </RoleRoute>
        )
      },
      {
        path: 'courses/:id/edit',
        element: (
          <RoleRoute roles={['teacher']}>
            <EditCoursePage />
          </RoleRoute>
        )
      },
      { path: '*', element: <NotFound /> },
    ]
  }
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}

export default AppRoutes