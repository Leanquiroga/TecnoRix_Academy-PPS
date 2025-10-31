import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import * as CourseAPI from '../api/course.service'
import type { CoursePublic, CourseMaterial } from '../types/course'
import { CourseDetail } from './CourseDetail'

vi.mock('../api/course.service')

// Mock de notificaciones global para este test
vi.mock('../hooks/useNotify', () => ({
  useNotify: () => () => {},
}))

const mockCourse: CoursePublic = {
  id: 'course-1',
  title: 'React Avanzado',
  description: 'Aprende React desde cero',
  price: 15000,
  thumbnail_url: null,
  category: 'Programación',
  level: 'intermediate',
  teacher_id: 'teacher-1',
  instructor_name: 'Juan Pérez',
}

const mockMaterials: CourseMaterial[] = [
  { id: 'm1', course_id: 'course-1', title: 'Intro', type: 'video', url: 'https://example.com/video.mp4', order: 1, created_at: '', updated_at: '' },
  { id: 'm2', course_id: 'course-1', title: 'Guía PDF', type: 'pdf', url: 'https://example.com/doc.pdf', order: 2, created_at: '', updated_at: '' },
  { id: 'm3', course_id: 'course-1', title: 'Enlace útil', type: 'link', url: 'https://example.com', order: 3, created_at: '', updated_at: '' },
]

function renderCourseDetail(initialPath = '/courses/course-1') {
  const router = createMemoryRouter([
    { path: '/courses/:id', element: <CourseDetail /> },
  ], { initialEntries: [initialPath] })
  return render(<RouterProvider router={router} />)
}

describe('CourseDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra loading mientras carga', () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockImplementation(() => new Promise(() => {}))
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockImplementation(() => new Promise(() => {}))

    renderCourseDetail()

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('muestra información del curso y materiales al cargar', async () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockResolvedValue(mockCourse)
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockResolvedValue(mockMaterials)

    renderCourseDetail()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /react avanzado/i })).toBeInTheDocument()
    })

    // Info del curso
    expect(screen.getByText(/juan pérez/i)).toBeInTheDocument()
    expect(screen.getByText(/ars/i)).toBeInTheDocument()
    expect(screen.getByText(/intermedio/i)).toBeInTheDocument()
    expect(screen.getByText(/aprende react desde cero/i)).toBeInTheDocument()

  // Lista de materiales ("Intro" aparece como título y encabezado de visor)
  expect(screen.getAllByText('Intro').length).toBeGreaterThan(0)
    expect(screen.getByText('Guía PDF')).toBeInTheDocument()
    expect(screen.getByText('Enlace útil')).toBeInTheDocument()

  // Visualizador por defecto (primer material video)
  expect(document.querySelector('video')).toBeTruthy()
  })

  it('muestra mensaje cuando no hay materiales', async () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockResolvedValue(mockCourse)
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockResolvedValue([])

    renderCourseDetail()

    await waitFor(() => {
      expect(screen.getByText(/no hay materiales disponibles/i)).toBeInTheDocument()
    })
  })

  it('muestra error cuando la carga falla', async () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockRejectedValue(new Error('Curso no encontrado'))
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockResolvedValue([])

    renderCourseDetail()

    await waitFor(() => {
      expect(screen.getByText(/curso no encontrado|error al cargar el curso/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /volver a cursos/i })).toBeInTheDocument()
  })

  it('renderiza visor de PDF cuando el material es PDF', async () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockResolvedValue(mockCourse)
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockResolvedValue([
      { ...mockMaterials[1], type: 'pdf' },
    ])

    renderCourseDetail()

    await waitFor(() => {
      // PdfViewer usa iframe
      expect(document.querySelector('iframe')).toBeTruthy()
    })
  })

  it('renderiza botón para enlaces externos', async () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockResolvedValue(mockCourse)
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockResolvedValue([
      { ...mockMaterials[2], type: 'link' },
    ])

    renderCourseDetail()

    await waitFor(() => {
      // MUI Button con href se renderiza como <a>, rol "link"
      expect(screen.getByRole('link', { name: /abrir enlace/i })).toBeInTheDocument()
    })
  })
})
