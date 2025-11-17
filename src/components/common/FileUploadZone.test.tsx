import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FileUploadZone from './FileUploadZone'

describe('FileUploadZone', () => {
  const mockOnUpload = vi.fn()

  beforeEach(() => {
    mockOnUpload.mockClear()
  })

  it('renderiza el estado inicial correctamente', () => {
    render(<FileUploadZone onUpload={mockOnUpload} />)

    expect(screen.getByText(/arrastra un archivo aquí/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /seleccionar archivo/i })).toBeInTheDocument()
  })

  it('muestra estado de loading', () => {
    render(<FileUploadZone onUpload={mockOnUpload} loading={true} />)

    expect(screen.getByText(/subiendo archivo/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('muestra mensaje de error', () => {
    const errorMessage = 'Error al subir archivo'
    render(<FileUploadZone onUpload={mockOnUpload} error={errorMessage} />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('muestra helper text cuando se proporciona', () => {
    const helperText = 'Acepta PDF y videos hasta 100MB'
    render(<FileUploadZone onUpload={mockOnUpload} helperText={helperText} />)

    expect(screen.getByText(helperText)).toBeInTheDocument()
  })

  it('llama a onUpload cuando se selecciona un archivo válido', async () => {
    mockOnUpload.mockResolvedValue(undefined)
    render(<FileUploadZone onUpload={mockOnUpload} accept="application/pdf" />)

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByRole('button', { name: /seleccionar archivo/i }).parentElement?.querySelector('input[type="file"]')

    if (input) {
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(file)
      })
    }
  })

  it('deshabilita el componente cuando disabled=true', () => {
    render(<FileUploadZone onUpload={mockOnUpload} disabled={true} />)

    const button = screen.getByRole('button', { name: /seleccionar archivo/i })
    expect(button).toBeDisabled()
  })

  it('maneja drag and drop correctamente', async () => {
    mockOnUpload.mockResolvedValue(undefined)
    render(<FileUploadZone onUpload={mockOnUpload} />)

    const dropZone = screen.getByText(/arrastra un archivo aquí/i).closest('div')
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' })

    if (dropZone) {
      // Simular drag enter
      fireEvent.dragEnter(dropZone, {
        dataTransfer: { files: [file] },
      })

      // Simular drop
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      })

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(file)
      })
    }
  })

  it('muestra preview para archivos PDF', async () => {
    mockOnUpload.mockResolvedValue(undefined)
    const { container } = render(
      <FileUploadZone onUpload={mockOnUpload} showPreview={true} />
    )

    const file = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' })
    const input = container.querySelector('input[type="file"]')

    if (input) {
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
      })
    }
  })

  it('formatea correctamente el tamaño del archivo', async () => {
    mockOnUpload.mockResolvedValue(undefined)
    const { container } = render(
      <FileUploadZone onUpload={mockOnUpload} showPreview={true} />
    )

    // Crear archivo de 1.5 MB
    const fileSize = 1.5 * 1024 * 1024
    const file = new File(['x'.repeat(fileSize)], 'large.pdf', { type: 'application/pdf' })
    const input = container.querySelector('input[type="file"]')

    if (input) {
      Object.defineProperty(file, 'size', { value: fileSize })
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/MB/i)).toBeInTheDocument()
      })
    }
  })

  it('limpia el archivo seleccionado al hacer click en eliminar', async () => {
    mockOnUpload.mockResolvedValue(undefined)
    const { container } = render(
      <FileUploadZone onUpload={mockOnUpload} showPreview={true} />
    )

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' })
    const input = container.querySelector('input[type="file"]')

    if (input) {
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText(/eliminar/i)
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.queryByText('test.pdf')).not.toBeInTheDocument()
      })
    }
  })
})
