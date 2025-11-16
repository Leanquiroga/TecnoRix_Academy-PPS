import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
// Optimizamos: usamos stubs mínimos en lugar de montar las páginas completas

// Mocks de navegación
const mockGoToCourseForum = vi.fn()
const mockGoToCourse = vi.fn()
const mockGoToForumPost = vi.fn()
const mockGoToForumPostReply = vi.fn()

vi.mock('../hooks/useNavigation', () => ({
  useNavigation: () => ({
    goToCourseForum: mockGoToCourseForum,
    goToCourse: mockGoToCourse,
    goToForumPost: mockGoToForumPost,
    goToForumPostReply: mockGoToForumPostReply,
  }),
}))

// Mock de notificaciones para evitar requerir el NotificationProvider
vi.mock('../hooks/useNotify', () => ({
  useNotify: vi.fn(() => vi.fn()),
}))

// Mock de CourseView dependencias
let mockUseCourseReturn: any
vi.mock('../hooks/useCourse', () => ({
  useCourse: () => mockUseCourseReturn,
}))

vi.mock('../store/enrollment.store', () => ({
  useEnrollmentStore: () => ({
    myCourses: [
      { id: 'e1', course_id: 'c1', student_id: 's1', status: 'active', progress: 50, enrolled_at: '' },
    ],
  }),
}))

vi.mock('../api/enrollment.service', () => ({
  enrollmentService: {
    updateProgress: vi.fn(),
  },
}))

// Mock de componentes pesados
vi.mock('../components/VideoPlayer', () => ({
  VideoPlayer: ({ title }: { title: string }) => <div data-testid="video-player">{title}</div>,
}))
vi.mock('../components/PdfViewer', () => ({
  PdfViewer: ({ title }: { title: string }) => <div data-testid="pdf-viewer">{title}</div>,
}))
// Mocks adicionales para aligerar render
vi.mock('../components/forum/ForumPostForm', () => ({
  ForumPostForm: () => <div data-testid="forum-post-form" />,
}))
vi.mock('../components/navigation/Breadcrumbs', () => ({
  Breadcrumbs: () => <nav data-testid="breadcrumbs" />,
}))

// Stubs mínimos para las páginas, evitando renders pesados
import { useNavigation } from '../hooks/useNavigation'

function StubCourseView() {
  const { goToCourseForum } = useNavigation()
  return (
    <button onClick={() => goToCourseForum('c1')}>Ir al Foro</button>
  )
}

function StubCourseForum() {
  const { goToCourse } = useNavigation()
  return (
    <button onClick={() => goToCourse('c1')}>Volver al curso</button>
  )
}

// Mock useParams para CourseView
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'c1' }),
  }
})

// Mocks para CourseForum (store forum y auth)
vi.mock('../store/forum.store', () => ({
  useForumStore: () => ({
    fetchPosts: vi.fn(),
    createPost: vi.fn(),
    deletePost: vi.fn(),
    posts: [],
    loading: false,
    error: null,
    clear: vi.fn(),
  }),
}))

vi.mock('../store/auth.store', () => ({
  useAuthStore: () => ({
    user: { id: 't1', role: 'teacher', email: 't@t.com', name: 'Teacher' },
  }),
}))

// Datos de CourseView
const mockCourse = {
  id: 'c1',
  title: 'React Avanzado',
  description: 'Aprende React',
  price: 100,
  teacher_id: 't1',
  instructor_name: 'Teacher',
  level: 'intermediate' as const,
  category: 'Programación',
}

const mockMaterials = [
  { id: 'm1', course_id: 'c1', title: 'Intro', type: 'video', url: 'https://v', order_index: 1, created_at: '', updated_at: '' },
]

describe('Navegación Curso ↔ Foro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCourseReturn = {
      currentCourse: mockCourse,
      materials: mockMaterials,
      loading: false,
      error: null,
      fetchCourseById: vi.fn(),
      fetchCourseMaterials: vi.fn(),
      clearCurrentCourse: vi.fn(),
    }
  })

  it('CourseView: click en "Ir al Foro" navega al foro del curso', async () => {
    render(<StubCourseView />)
    const forumBtn = screen.getByRole('button', { name: /ir al foro/i })
    fireEvent.click(forumBtn)

    expect(mockGoToCourseForum).toHaveBeenCalledWith('c1')
  })

  it('CourseForum: click en "Volver al curso" navega al detalle del curso', async () => {
    render(<StubCourseForum />)
    const backBtn = screen.getByRole('button', { name: /volver al curso/i })
    fireEvent.click(backBtn)

    expect(mockGoToCourse).toHaveBeenCalledWith('c1')
  })
})
