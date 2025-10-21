import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VideoPlayer } from './VideoPlayer'

describe('VideoPlayer', () => {
  it('debería renderizar el reproductor de video con URL válida', () => {
    const { container } = render(<VideoPlayer url="https://example.com/video.mp4" />)
    
    const videoElement = container.querySelector('video')
    expect(videoElement).toBeInTheDocument()
  })

  it('debería mostrar el título cuando se proporciona', () => {
    render(
      <VideoPlayer 
        url="https://example.com/video.mp4" 
        title="Mi Video de Prueba" 
      />
    )
    
    expect(screen.getByText('Mi Video de Prueba')).toBeInTheDocument()
  })

  it('debería aceptar formato .mp4', () => {
    const { container } = render(<VideoPlayer url="https://example.com/video.mp4" />)
    
    const videoElement = container.querySelector('video')
    expect(videoElement).toBeInTheDocument()
  })

  it('debería aceptar formato .mpeg', () => {
    const { container } = render(<VideoPlayer url="https://example.com/video.mpeg" />)
    
    const videoElement = container.querySelector('video')
    expect(videoElement).toBeInTheDocument()
  })

  it('debería aceptar formato .mov', () => {
    const { container } = render(<VideoPlayer url="https://example.com/video.mov" />)
    
    const videoElement = container.querySelector('video')
    expect(videoElement).toBeInTheDocument()
  })

  it('debería aceptar formato .avi', () => {
    const { container } = render(<VideoPlayer url="https://example.com/video.avi" />)
    
    const videoElement = container.querySelector('video')
    expect(videoElement).toBeInTheDocument()
  })

  it('debería aceptar formato .webm', () => {
    const { container } = render(<VideoPlayer url="https://example.com/video.webm" />)
    
    const videoElement = container.querySelector('video')
    expect(videoElement).toBeInTheDocument()
  })

  it('debería mostrar mensaje de error para formatos no soportados', () => {
    render(<VideoPlayer url="https://example.com/archivo.txt" />)
    
    expect(screen.getByText('Formato de video no soportado')).toBeInTheDocument()
  })

  it('debería mostrar ícono de error para formatos no válidos', () => {
    render(<VideoPlayer url="https://example.com/archivo.txt" />)
    
    expect(screen.getByTestId('PlayCircleIcon')).toBeInTheDocument()
  })

  it('debería incluir atributos de accesibilidad en el video', () => {
    const { container } = render(<VideoPlayer url="https://example.com/video.mp4" />)
    
    const videoElement = container.querySelector('video')
    expect(videoElement).toHaveAttribute('controls')
    expect(videoElement).toHaveAttribute('preload', 'metadata')
  })

  it('no debería mostrar título cuando no se proporciona', () => {
    render(<VideoPlayer url="https://example.com/video.mp4" />)
    
    const headings = screen.queryAllByRole('heading', { level: 6 })
    expect(headings).toHaveLength(0)
  })

  it('debería validar URL independiente de mayúsculas/minúsculas', () => {
    const { container } = render(<VideoPlayer url="https://example.com/VIDEO.MP4" />)
    
    const videoElement = container.querySelector('video')
    expect(videoElement).toBeInTheDocument()
  })
})
