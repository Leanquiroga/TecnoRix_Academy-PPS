import { useState } from 'react'
import { Button } from '@mui/material'
import type { ButtonProps } from '@mui/material'
import { School } from '@mui/icons-material'
import { enrollmentService } from '../api/enrollment.service'
import type { EnrollResponse } from '../types/enrollment'
import { useNotify } from '../hooks/useNotify'

export interface EnrollButtonProps extends Omit<ButtonProps, 'onClick'> {
  courseId: string
  onEnrolled?: (res: EnrollResponse) => void
  onRequiresPayment?: (res: EnrollResponse) => void
}

export function EnrollButton({
  courseId,
  onEnrolled,
  onRequiresPayment,
  variant = 'contained',
  startIcon = <School />,
  children,
  ...buttonProps
}: EnrollButtonProps) {
  const [loading, setLoading] = useState(false)
  const notify = useNotify()

  const handleClick = async () => {
    try {
      setLoading(true)
      const res = await enrollmentService.enroll(courseId)
      if (res.requires_payment) {
        onRequiresPayment?.(res)
        if (!onRequiresPayment) {
          // Fallback básico si no se provee callback
          notify({
            title: 'Inscripción pendiente',
            message: 'Serás redirigido al checkout próximamente.',
            severity: 'info',
          })
        }
      } else {
        onEnrolled?.(res)
        if (!onEnrolled) {
          notify({
            title: 'Inscripción exitosa',
            message: 'Ya puedes acceder a tus cursos en "Mis Cursos".',
            severity: 'success',
          })
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'No se pudo completar la inscripción'
      notify({ message: msg, severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      startIcon={startIcon}
      onClick={handleClick}
      disabled={loading || buttonProps.disabled}
      {...buttonProps}
    >
      {loading ? 'Inscribiendo...' : children ?? 'Inscribirse'}
    </Button>
  )
}

export default EnrollButton
