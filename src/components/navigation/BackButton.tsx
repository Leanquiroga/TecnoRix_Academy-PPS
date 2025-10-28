import { Button } from '@mui/material'
import type { ButtonProps } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useNavigation } from '../../hooks/useNavigation'

interface BackButtonProps extends Omit<ButtonProps, 'onClick'> {
  /**
   * Etiqueta del botón
   */
  label?: string
  /**
   * Función personalizada de navegación (opcional)
   */
  onBack?: () => void
}

/**
 * Componente reutilizable para volver a la vista anterior
 * Si no se proporciona onBack, usa goBack() del hook de navegación
 */
export function BackButton({ label = 'Volver', onBack, ...props }: BackButtonProps) {
  const { goBack } = useNavigation()

  const handleClick = () => {
    if (onBack) {
      onBack()
    } else {
      goBack()
    }
  }

  return (
    <Button
      variant="outlined"
      startIcon={<ArrowBack />}
      onClick={handleClick}
      {...props}
    >
      {label}
    </Button>
  )
}

export default BackButton
