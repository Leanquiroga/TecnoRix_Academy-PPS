import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'
import LoginPage from '../pages/Login'
import RegisterPage from '../pages/Register'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'
import TeacherRegister from '../pages/TeacherRegister'
import TeacherPending from '../pages/TeacherPending'
import AdminPage from '../pages/AdminPage'
import AdminUsers from '../pages/AdminUsers'
import AdminUsersPending from '../pages/AdminUsersPending'
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
import CourseForum from '../pages/CourseForum'
import ForumPostDetail from '../pages/ForumPostDetail'
import QuizView from '../pages/QuizView'
import QuizResults from '../pages/QuizResults'
import RouteErrorElement from './RouteErrorElement'
import CreateQuizPage from '../pages/CreateQuiz'
import StudentProgressPage from '../pages/StudentProgress'
import TeacherCourseQuizzes from '../pages/TeacherCourseQuizzes'
import EditQuizPage from '../pages/EditQuiz'
import ProfilePage from '../pages/Profile'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RootLayout>
        <Outlet />
      </RootLayout>
    ),
    errorElement: <RouteErrorElement />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'register/teacher', element: <TeacherRegister /> },
      { path: 'teacher/pending', element: <TeacherPending /> },
      {
        path: 'profile',
        element: (
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        )
      },
      { path: 'courses', element: <CoursesList /> },
      { path: 'courses/:id', element: <CourseDetail /> },
      {
        path: 'courses/:id/forum',
        element: (
          <PrivateRoute>
            <CourseForum />
          </PrivateRoute>
        )
      },
      {
        path: 'courses/:id/forum/:postId',
        element: (
          <PrivateRoute>
            <ForumPostDetail />
          </PrivateRoute>
        )
      },
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
        path: 'quizzes/:quizId',
        element: (
          <RoleRoute roles={['student']}>
            <QuizView />
          </RoleRoute>
        )
      },
      {
        path: 'quizzes/:quizId/progress',
        element: (
          <RoleRoute roles={['student']}>
            <StudentProgressPage />
          </RoleRoute>
        )
      },
      {
        path: 'quiz-attempts/:attemptId',
        element: (
          <RoleRoute roles={['student']}>
            <QuizResults />
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
        path: 'admin', 
        element: (
          <RoleRoute roles={['admin']}>
            <AdminPage />
          </RoleRoute>
        ) 
      },
      {
        path: 'admin/users',
        element: (
          <RoleRoute roles={['admin']}>
            <AdminUsers />
          </RoleRoute>
        )
      },
      {
        path: 'admin/users/pending',
        element: (
          <RoleRoute roles={['admin']}>
            <AdminUsersPending />
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
        path: 'teacher/courses/:id/quizzes/create',
        element: (
          <RoleRoute roles={['teacher']}>
            <CreateQuizPage />
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
        path: 'teacher/courses/:id/quizzes',
        element: (
          <RoleRoute roles={['teacher']}>
            <TeacherCourseQuizzes />
          </RoleRoute>
        )
      },
      {
        path: 'teacher/quizzes/:quizId/edit',
        element: (
          <RoleRoute roles={['teacher']}>
            <EditQuizPage />
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