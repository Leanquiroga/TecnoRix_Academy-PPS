import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NavigationProgress } from './NavigationProgress'

describe('NavigationProgress', () => {
  describe('variant text', () => {
    it('renderiza el progreso en formato texto', () => {
      render(<NavigationProgress currentIndex={2} total={5} variant="text" />)
      expect(screen.getByText('3 de 5')).toBeInTheDocument()
    })

    it('muestra correctamente el primer item', () => {
      render(<NavigationProgress currentIndex={0} total={10} variant="text" />)
      expect(screen.getByText('1 de 10')).toBeInTheDocument()
    })

    it('muestra correctamente el último item', () => {
      render(<NavigationProgress currentIndex={4} total={5} variant="text" />)
      expect(screen.getByText('5 de 5')).toBeInTheDocument()
    })

    it('no renderiza nada si total es 0', () => {
      const { container } = render(<NavigationProgress currentIndex={0} total={0} variant="text" />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('variant stepper', () => {
    it('renderiza stepper con cantidad correcta de pasos', () => {
      render(<NavigationProgress currentIndex={1} total={3} variant="stepper" />)
      
      expect(screen.getByText('Paso 1')).toBeInTheDocument()
      expect(screen.getByText('Paso 2')).toBeInTheDocument()
      expect(screen.getByText('Paso 3')).toBeInTheDocument()
    })

    it('renderiza stepper con labels personalizados', () => {
      const labels = ['Introducción', 'Desarrollo', 'Conclusión']
      render(
        <NavigationProgress 
          currentIndex={1} 
          total={3} 
          variant="stepper" 
          labels={labels} 
        />
      )
      
      expect(screen.getByText('Introducción')).toBeInTheDocument()
      expect(screen.getByText('Desarrollo')).toBeInTheDocument()
      expect(screen.getByText('Conclusión')).toBeInTheDocument()
    })

    it('marca pasos anteriores como completados', () => {
      const { container } = render(<NavigationProgress currentIndex={2} total={4} variant="stepper" />)
      
      // Verificar que los pasos completados tienen la clase Mui-completed
      const completedSteps = container.querySelectorAll('.MuiStep-root.Mui-completed')
      expect(completedSteps).toHaveLength(2) // Pasos 1 y 2 están completados
      
      // Verificar que los labels se muestran correctamente
      expect(screen.getByText('Paso 1')).toBeInTheDocument()
      expect(screen.getByText('Paso 4')).toBeInTheDocument()
    })

    it('soporta orientación vertical', () => {
      const { container } = render(
        <NavigationProgress 
          currentIndex={0} 
          total={3} 
          variant="stepper" 
          orientation="vertical" 
        />
      )
      
      // Verificar que el stepper se renderizó
      const stepper = container.querySelector('.MuiStepper-vertical')
      expect(stepper).toBeInTheDocument()
    })
  })

  describe('casos edge', () => {
    it('maneja total=1 correctamente', () => {
      render(<NavigationProgress currentIndex={0} total={1} variant="text" />)
      expect(screen.getByText('1 de 1')).toBeInTheDocument()
    })

    it('usa variant text como default', () => {
      render(<NavigationProgress currentIndex={0} total={3} />)
      expect(screen.getByText('1 de 3')).toBeInTheDocument()
    })
  })
})
