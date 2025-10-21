import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import * as CourseAPI from '../api/course.service'
import type { CoursePublic, CourseMaterial } from '../types/course'
import { EditCourse } from './EditCourse'

vi.mock('../api/course.service')

const mockCourse: CoursePublic = {
  id: 'course-1',
  title: 'React Avanzado',
  description: 'Aprende React desde cero',
  price: 15000,
  thumbnail_url: 'https://example.com/thumb.jpg',
  category: 'Programación',
  level: 'intermediate',
  teacher_id: 'teacher-1',
  instructor_name: 'Juan Pérez',
}

const mockMaterials: CourseMaterial[] = [
  { id: 'm1', course_id: 'course-1', title: 'Intro', type: 'video', url: 'https://example.com/video.mp4', order: 1, created_at: '', updated_at: '' },
  { id: 'm2', course_id: 'course-1', title: 'Guía PDF', type: 'pdf', url: 'https://example.com/doc.pdf', order: 2, created_at: '', updated_at: '' },
]

function renderEditCourse(initialPath = '/courses/course-1/edit') {
  const router = createMemoryRouter([
    { path: '/courses/:id/edit', element: <EditCourse /> },
    { path: '/teacher/courses', element: <div>Teacher Courses Page</div> },
  ], { initialEntries: [initialPath] })
  return render(<RouterProvider router={router} />)
}

describe('EditCourse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra loading mientras carga el curso', () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockImplementation(() => new Promise(() => {}))
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockImplementation(() => new Promise(() => {}))

    renderEditCourse()

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('carga y muestra el formulario prellenado con los datos del curso', async () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockResolvedValue(mockCourse)
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockResolvedValue(mockMaterials)

    renderEditCourse()

    await waitFor(() => {
      expect(screen.getByDisplayValue('React Avanzado')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('Aprende React desde cero')).toBeInTheDocument()
    expect(screen.getByDisplayValue('15000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Programación')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://example.com/thumb.jpg')).toBeInTheDocument()

    // Verificar que se muestran los materiales
    expect(screen.getByText('Intro')).toBeInTheDocument()
    expect(screen.getByText(/Tipo: VIDEO/i)).toBeInTheDocument()
  })

  it('muestra error cuando falla la carga del curso', async () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockRejectedValue(new Error('Curso no encontrado'))
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockResolvedValue([])

    renderEditCourse()

    await waitFor(() => {
      expect(screen.getByText(/curso no encontrado/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument()
  })

  it('valida que título y descripción sean obligatorios', async () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockResolvedValue(mockCourse)
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockResolvedValue([])

    const user = userEvent.setup()
    renderEditCourse()

    await waitFor(() => {
      expect(screen.getByDisplayValue('React Avanzado')).toBeInTheDocument()
    })

    // Limpiar solo el título (mantener descripción)
    const titleInput = screen.getByLabelText(/título del curso/i) as HTMLInputElement
    await user.clear(titleInput)

    // Verificar que el título está vacío
    expect(titleInput.value).toBe('')

    // El formulario tiene required, lo que significa que la validación HTML5 evita envío  
    // Verificamos que los campos tienen el atributo required
    expect(titleInput).toHaveAttribute('required')
    const descriptionInput = screen.getByLabelText(/descripción/i) as HTMLTextAreaElement
    expect(descriptionInput).toHaveAttribute('required')
  })

  it('actualiza el curso correctamente cuando se envía el formulario', async () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockResolvedValue(mockCourse)
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockResolvedValue([])
    const updateSpy = vi.spyOn(CourseAPI, 'updateCourse').mockResolvedValue({ ...mockCourse, title: 'React Pro' } as any)

    const user = userEvent.setup()
    renderEditCourse()

    await waitFor(() => {
      expect(screen.getByDisplayValue('React Avanzado')).toBeInTheDocument()
    })

    // Editar título
    const titleInput = screen.getByLabelText(/título del curso/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'React Pro')

    // Guardar
    const saveButton = screen.getByRole('button', { name: /guardar cambios/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('course-1', expect.objectContaining({
        title: 'React Pro',
        description: 'Aprende React desde cero',
        price: 15000,
        category: 'Programación',
        level: 'intermediate',
        thumbnail_url: 'https://example.com/thumb.jpg',
      }))
    })

    expect(screen.getByText(/curso actualizado correctamente/i)).toBeInTheDocument()
  })

  it('muestra error cuando falla la actualización', async () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockResolvedValue(mockCourse)
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockResolvedValue([])
    vi.spyOn(CourseAPI, 'updateCourse').mockRejectedValue(new Error('No autorizado'))

    const user = userEvent.setup()
    renderEditCourse()

    await waitFor(() => {
      expect(screen.getByDisplayValue('React Avanzado')).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /guardar cambios/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/no autorizado/i)).toBeInTheDocument()
    })
  })

  it('permite cambiar el nivel del curso', async () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockResolvedValue({ ...mockCourse, level: 'beginner' })
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockResolvedValue([])
    const updateSpy = vi.spyOn(CourseAPI, 'updateCourse').mockResolvedValue(mockCourse as any)

    const user = userEvent.setup()
    renderEditCourse()

    await waitFor(() => {
      expect(screen.getByDisplayValue('React Avanzado')).toBeInTheDocument()
    })

    // Cambiar nivel - MUI Select usa un button en vez de un input tradicional
    const levelSelect = screen.getByRole('combobox', { name: /nivel/i })
    await user.click(levelSelect)
    
    const advancedOption = screen.getByRole('option', { name: /avanzado/i })
    await user.click(advancedOption)

    const saveButton = screen.getByRole('button', { name: /guardar cambios/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('course-1', expect.objectContaining({
        level: 'advanced',
      }))
    })
  })

  it('muestra mensaje informativo sobre edición de materiales', async () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockResolvedValue(mockCourse)
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockResolvedValue(mockMaterials)

    renderEditCourse()

    await waitFor(() => {
      expect(screen.getByText(/los materiales no se pueden editar desde aquí/i)).toBeInTheDocument()
    })
  })

  it('navega de vuelta cuando se hace click en cancelar', async () => {
    vi.spyOn(CourseAPI, 'getCoursePublicById').mockResolvedValue(mockCourse)
    vi.spyOn(CourseAPI, 'getCourseMaterials').mockResolvedValue([])

    const user = userEvent.setup()
    renderEditCourse()

    await waitFor(() => {
      expect(screen.getByDisplayValue('React Avanzado')).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    await user.click(cancelButton)

    // Debería navegar a /teacher/courses (en el mock renderizamos un div)
    await waitFor(() => {
      expect(screen.queryByText('Teacher Courses Page')).toBeInTheDocument()
    })
  })
})
