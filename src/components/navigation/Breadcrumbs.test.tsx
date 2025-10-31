import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Breadcrumbs } from './Breadcrumbs'

// Mock de los hooks y funciones
vi.mock('../../hooks/useNavigation')
vi.mock('../../routes/routes.config')

import { useNavigation } from '../../hooks/useNavigation'
import { getBreadcrumbs } from '../../routes/routes.config'

const mockGoTo = vi.fn()

describe('Breadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(useNavigation).mockReturnValue({
      currentPath: '/courses/123',
      goTo: mockGoTo,
    } as Partial<ReturnType<typeof useNavigation>> as ReturnType<typeof useNavigation>)
  })

  describe('Renderizado básico', () => {
    it('renderiza breadcrumbs con home por defecto', () => {
      vi.mocked(getBreadcrumbs).mockReturnValue([
        { label: 'Cursos', path: '/courses' },
        { label: 'Detalle del Curso', path: '/courses/123' },
      ])

      render(
        <BrowserRouter>
          <Breadcrumbs />
        </BrowserRouter>
      )

      expect(screen.getByText('Inicio')).toBeInTheDocument()
      expect(screen.getByText('Cursos')).toBeInTheDocument()
      expect(screen.getByText('Detalle del Curso')).toBeInTheDocument()
    })

    it('renderiza sin home cuando showHome es false', () => {
      vi.mocked(getBreadcrumbs).mockReturnValue([
        { label: 'Cursos', path: '/courses' },
      ])

      render(
        <BrowserRouter>
          <Breadcrumbs showHome={false} />
        </BrowserRouter>
      )

      expect(screen.queryByText('Inicio')).not.toBeInTheDocument()
      expect(screen.getByText('Cursos')).toBeInTheDocument()
    })

    it('renderiza breadcrumbs custom cuando se proporcionan', () => {
      const customItems = [
        { label: 'Custom 1', path: '/custom1' },
        { label: 'Custom 2', path: '/custom2' },
        { label: 'Custom 3' },
      ]

      render(
        <BrowserRouter>
          <Breadcrumbs customItems={customItems} />
        </BrowserRouter>
      )

      expect(screen.getByText('Custom 1')).toBeInTheDocument()
      expect(screen.getByText('Custom 2')).toBeInTheDocument()
      expect(screen.getByText('Custom 3')).toBeInTheDocument()
    })
  })

  describe('Navegación', () => {
    it('navega al hacer click en "Inicio"', () => {
      vi.mocked(getBreadcrumbs).mockReturnValue([
        { label: 'Cursos', path: '/courses' },
      ])

      render(
        <BrowserRouter>
          <Breadcrumbs />
        </BrowserRouter>
      )

      const homeLink = screen.getByText('Inicio')
      fireEvent.click(homeLink)

      expect(mockGoTo).toHaveBeenCalledWith('/')
    })

    it('navega al hacer click en breadcrumb intermedio', () => {
      vi.mocked(getBreadcrumbs).mockReturnValue([
        { label: 'Cursos', path: '/courses' },
        { label: 'Detalle', path: '/courses/123' },
      ])

      render(
        <BrowserRouter>
          <Breadcrumbs />
        </BrowserRouter>
      )

      const cursosLink = screen.getByText('Cursos')
      fireEvent.click(cursosLink)

      expect(mockGoTo).toHaveBeenCalledWith('/courses')
    })

    it('no navega al hacer click en el último breadcrumb', () => {
      vi.mocked(getBreadcrumbs).mockReturnValue([
        { label: 'Cursos', path: '/courses' },
        { label: 'Detalle', path: '/courses/123' },
      ])

      render(
        <BrowserRouter>
          <Breadcrumbs />
        </BrowserRouter>
      )

      const detalleText = screen.getByText('Detalle')
      fireEvent.click(detalleText)

      // El último item no es clickeable
      expect(mockGoTo).not.toHaveBeenCalled()
    })
  })

  describe('Estilos y apariencia', () => {
    it('el último breadcrumb tiene peso de fuente 600', () => {
      vi.mocked(getBreadcrumbs).mockReturnValue([
        { label: 'Cursos', path: '/courses' },
        { label: 'Actual', path: '' },
      ])

      render(
        <BrowserRouter>
          <Breadcrumbs />
        </BrowserRouter>
      )

      const actualText = screen.getByText('Actual')
      expect(actualText).toHaveStyle({ fontWeight: 600 })
    })

    it('muestra icono de Home', () => {
      vi.mocked(getBreadcrumbs).mockReturnValue([
        { label: 'Cursos', path: '/courses' },
      ])

      const { container } = render(
        <BrowserRouter>
          <Breadcrumbs />
        </BrowserRouter>
      )

      // Verificar que el icono Home está presente
      const homeIcon = container.querySelector('[data-testid="HomeIcon"]')
      expect(homeIcon).toBeInTheDocument()
    })
  })

  describe('Casos edge', () => {
    it('maneja breadcrumbs vacíos', () => {
      vi.mocked(getBreadcrumbs).mockReturnValue([])

      render(
        <BrowserRouter>
          <Breadcrumbs />
        </BrowserRouter>
      )

      // Solo debe mostrar Inicio
      expect(screen.getByText('Inicio')).toBeInTheDocument()
    })

    it('maneja breadcrumb sin path', () => {
      vi.mocked(getBreadcrumbs).mockReturnValue([
        { label: 'Item sin path', path: '' },
      ])

      render(
        <BrowserRouter>
          <Breadcrumbs />
        </BrowserRouter>
      )

      expect(screen.getByText('Item sin path')).toBeInTheDocument()
    })

    it('usa customItems en lugar de generar desde ruta', () => {
      const customItems = [
        { label: 'Custom', path: '/custom' },
      ]

      render(
        <BrowserRouter>
          <Breadcrumbs customItems={customItems} />
        </BrowserRouter>
      )

      // No debe llamar a getBreadcrumbs si hay customItems
      expect(getBreadcrumbs).not.toHaveBeenCalled()
      expect(screen.getByText('Custom')).toBeInTheDocument()
    })
  })

  describe('Accesibilidad', () => {
    it('tiene aria-label correcto', () => {
      vi.mocked(getBreadcrumbs).mockReturnValue([
        { label: 'Cursos', path: '/courses' },
      ])

      const { container } = render(
        <BrowserRouter>
          <Breadcrumbs />
        </BrowserRouter>
      )

      const nav = container.querySelector('nav')
      expect(nav).toHaveAttribute('aria-label', 'breadcrumb')
    })
  })
})
