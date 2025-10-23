import { Box, Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material'
import { NavigateNext, Home } from '@mui/icons-material'
import { useNavigation } from '../../hooks/useNavigation'
import { getBreadcrumbs } from '../../routes/routes.config'

interface BreadcrumbsProps {
  customItems?: Array<{ label: string; path?: string }>
  showHome?: boolean
}

export function Breadcrumbs({ customItems, showHome = true }: BreadcrumbsProps) {
  const { currentPath, goTo } = useNavigation()

  // Si hay items custom, usarlos; sino, generarlos desde la ruta actual
  const breadcrumbItems = customItems || getBreadcrumbs(currentPath)

  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    path?: string
  ) => {
    if (path) {
      event.preventDefault()
      goTo(path)
    }
  }

  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs
        separator={<NavigateNext fontSize="small" />}
        aria-label="breadcrumb"
      >
        {/* Home link */}
        {showHome && (
          <Link
            underline="hover"
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'text.primary',
              cursor: 'pointer',
              '&:hover': { color: 'primary.main' },
            }}
            onClick={(e) => handleClick(e, '/')}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Inicio
          </Link>
        )}

        {/* Dynamic breadcrumbs */}
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1

          if (isLast) {
            // Último item (página actual) - no es link
            return (
              <Typography
                key={item.path || index}
                color="text.primary"
                sx={{ fontWeight: 600 }}
              >
                {item.label}
              </Typography>
            )
          }

          // Items intermedios - son links
          return (
            <Link
              key={item.path || index}
              underline="hover"
              color="inherit"
              sx={{
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' },
              }}
              onClick={(e) => handleClick(e, item.path)}
            >
              {item.label}
            </Link>
          )
        })}
      </MuiBreadcrumbs>
    </Box>
  )
}

export default Breadcrumbs
