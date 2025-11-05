import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import CourseView from './CourseView'

vi.mock('../hooks/useNavigation', () => ({
  useNavigation: () => ({ goToMyCourses: vi.fn(), goToCourseForum: vi.fn() }),
}))

// Mock de notificaciones para evitar provider real
vi.mock('../hooks/useNotify', () => ({
  useNotify: () => () => {},
}))

vi.mock('../components/VideoPlayer', () => ({
  VideoPlayer: () => <div />,
}))
vi.mock('../components/PdfViewer', () => ({
  PdfViewer: () => <div />,
}))

const course = {
  id: 'course-x',
  title: 'Curso X',
  description: 'Desc',
  price: 0,
  thumbnail_url: null,
  category: 'Cat',
  level: 'beginner',
  teacher_id: 't1',
  instructor_name: 'Profe',
}

vi.mock('../hooks/useCourse', () => ({
  useCourse: () => ({
    currentCourse: course,
    materials: [],
    loading: false,
    error: null,
    fetchCourseById: vi.fn(),
    fetchCourseMaterials: vi.fn(),
    clearCurrentCourse: vi.fn(),
  }),
}))

const quiz = {
  id: 'quiz-1',
  course_id: 'course-x',
  title: 'Quiz 1',
  description: 'D1',
  passing_score: 60,
  time_limit_minutes: null,
  max_attempts: null,
  order_index: 0,
  created_at: '',
  updated_at: '',
  questions: [],
}

vi.mock('../store/quiz.store', () => ({
  useQuizStore: () => ({
    loadQuizzesByCourse: vi.fn(),
    quizzesByCourse: { 'course-x': [quiz] },
  }),
}))

// Mock de inscripción con estado mutable
let mockMyCourses: any[] = []
vi.mock('../store/enrollment.store', () => ({
  useEnrollmentStore: () => ({ myCourses: mockMyCourses }),
}))

function renderCourse(id = 'course-x') {
  const router = createMemoryRouter(
    [
      { path: '/student/courses/:id', element: <CourseView /> },
    ],
    { initialEntries: [`/student/courses/${id}`] }
  )
  return render(<RouterProvider router={router} />)
}

describe('CourseView - Quizzes del curso', () => {
  beforeEach(() => {
    vi.resetModules()
    mockMyCourses = []
  })

  it('deshabilita Tomar Quiz si no está inscrito', async () => {
    mockMyCourses = []
    renderCourse()

    await waitFor(() => {
      expect(screen.getByText(/no estás inscrito en este curso/i)).toBeInTheDocument()
    })
    expect(screen.queryByText(/quizzes del curso/i)).not.toBeInTheDocument()
  })

  it('habilita Tomar Quiz si está inscrito', async () => {
    mockMyCourses = [{ id: 'e1', course_id: 'course-x' }]
    renderCourse()

    await waitFor(() => {
      expect(screen.getByText(/quizzes del curso/i)).toBeInTheDocument()
    })

    const link = screen.getByRole('link', { name: /tomar quiz/i })
    expect(link).toHaveAttribute('href', '/quizzes/quiz-1')
  })
})
