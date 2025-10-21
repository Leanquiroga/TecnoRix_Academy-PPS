import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PdfViewer } from './PdfViewer'

describe('PdfViewer', () => {
  it('debería renderizar el visor de PDF con URL válida', () => {
    render(<PdfViewer url="https://example.com/documento.pdf" />)
    
    const iframe = screen.getByTitle('PDF Viewer')
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('src', 'https://example.com/documento.pdf#toolbar=1&navpanes=1&scrollbar=1')
  })

  it('debería mostrar el título cuando se proporciona', () => {
    render(
      <PdfViewer 
        url="https://example.com/documento.pdf" 
        title="Mi Documento PDF" 
      />
    )
    
    expect(screen.getByText('Mi Documento PDF')).toBeInTheDocument()
  })

  it('debería usar el título en el atributo title del iframe', () => {
    render(
      <PdfViewer 
        url="https://example.com/documento.pdf" 
        title="Documento Importante" 
      />
    )
    
    const iframe = screen.getByTitle('Documento Importante')
    expect(iframe).toBeInTheDocument()
  })

  it('debería aceptar URL con .pdf en minúsculas', () => {
    render(<PdfViewer url="https://example.com/documento.pdf" />)
    
    const iframe = screen.getByTitle('PDF Viewer')
    expect(iframe).toBeInTheDocument()
  })

  it('debería aceptar URL con .PDF en mayúsculas', () => {
    render(<PdfViewer url="https://example.com/DOCUMENTO.PDF" />)
    
    const iframe = screen.getByTitle('PDF Viewer')
    expect(iframe).toBeInTheDocument()
  })

  it('debería aceptar URL con .pdf en el medio de la URL', () => {
    render(<PdfViewer url="https://example.com/docs.pdf?version=1" />)
    
    const iframe = screen.getByTitle('PDF Viewer')
    expect(iframe).toBeInTheDocument()
  })

  it('debería mostrar mensaje de error para archivos no PDF', () => {
    render(<PdfViewer url="https://example.com/archivo.txt" />)
    
    expect(screen.getByText('El archivo no es un PDF válido')).toBeInTheDocument()
  })

  it('debería mostrar ícono de error para formatos no válidos', () => {
    render(<PdfViewer url="https://example.com/archivo.docx" />)
    
    expect(screen.getByTestId('PictureAsPdfIcon')).toBeInTheDocument()
  })

  it('debería mostrar mensaje informativo con link de descarga', () => {
    render(<PdfViewer url="https://example.com/documento.pdf" />)
    
    expect(screen.getByText(/Si el PDF no se muestra correctamente/i)).toBeInTheDocument()
    
    const link = screen.getByRole('link', { name: /abrirlo en una nueva pestaña/i })
    expect(link).toHaveAttribute('href', 'https://example.com/documento.pdf')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('debería configurar el iframe con parámetros de visualización', () => {
    render(<PdfViewer url="https://example.com/documento.pdf" />)
    
    const iframe = screen.getByTitle('PDF Viewer')
    const src = iframe.getAttribute('src')
    expect(src).toContain('toolbar=1')
    expect(src).toContain('navpanes=1')
    expect(src).toContain('scrollbar=1')
  })

  it('debería tener dimensiones del iframe al 100% del contenedor', () => {
    render(<PdfViewer url="https://example.com/documento.pdf" />)
    
    const iframe = screen.getByTitle('PDF Viewer')
    expect(iframe).toHaveAttribute('width', '100%')
    expect(iframe).toHaveAttribute('height', '100%')
  })

  it('no debería mostrar título cuando no se proporciona', () => {
    render(<PdfViewer url="https://example.com/documento.pdf" />)
    
    const headings = screen.queryAllByRole('heading', { level: 6 })
    expect(headings).toHaveLength(0)
  })

  it('debería usar "PDF Viewer" como título por defecto del iframe', () => {
    render(<PdfViewer url="https://example.com/documento.pdf" />)
    
    const iframe = screen.getByTitle('PDF Viewer')
    expect(iframe).toBeInTheDocument()
  })
})
