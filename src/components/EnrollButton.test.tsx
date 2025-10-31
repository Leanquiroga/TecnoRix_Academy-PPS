import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnrollButton } from './EnrollButton'

vi.mock('../api/enrollment.service', () => {
  return {
    enrollmentService: {
      enroll: vi.fn(),
    },
  }
})

// Mock de notificaciones para evitar requerir NotificationProvider
const mockNotify = vi.fn()
vi.mock('../hooks/useNotify', () => ({
  useNotify: () => mockNotify
}))

const { enrollmentService } = await import('../api/enrollment.service')

type MockedEnroll = ReturnType<typeof vi.fn>

describe('EnrollButton', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renderiza y realiza inscripción exitosa', async () => {
    const onEnrolled = vi.fn()
    ;(enrollmentService.enroll as MockedEnroll).mockResolvedValue({
      requires_payment: false,
      enrollment: { id: 'enr1' },
    })

    render(<EnrollButton courseId="course-1" onEnrolled={onEnrolled} />)

    const button = screen.getByRole('button', { name: /inscribirse/i })
    fireEvent.click(button)

    // Durante la acción debe estar deshabilitado y mostrar loading text
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent(/inscribiendo/i)

    await waitFor(() => expect(onEnrolled).toHaveBeenCalled())
    expect(enrollmentService.enroll).toHaveBeenCalledWith('course-1')
  })

  it('maneja inscripción pendiente de pago', async () => {
    const onRequiresPayment = vi.fn()
    ;(enrollmentService.enroll as MockedEnroll).mockResolvedValue({
      requires_payment: true,
      enrollment: { id: 'enr1' },
    })

    render(<EnrollButton courseId="course-2" onRequiresPayment={onRequiresPayment} />)

    fireEvent.click(screen.getByRole('button', { name: /inscribirse/i }))

    await waitFor(() => expect(onRequiresPayment).toHaveBeenCalled())
    expect(enrollmentService.enroll).toHaveBeenCalledWith('course-2')
  })

  it('muestra mensaje de error en fallo (notifica error)', async () => {
    mockNotify.mockReset()
    ;(enrollmentService.enroll as MockedEnroll).mockRejectedValue({ response: { data: { error: 'Fallo' } } })

    render(<EnrollButton courseId="course-3" />)

    fireEvent.click(screen.getByRole('button', { name: /inscribirse/i }))

    await waitFor(() => expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Fallo',
      severity: 'error',
    })))
  })
})
