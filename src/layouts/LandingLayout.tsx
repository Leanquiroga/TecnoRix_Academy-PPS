import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import PublicNavbar from '../components/navigation/PublicNavbar'
import Footer from '../components/common/Footer'

interface LandingLayoutProps {
  children: ReactNode
}

/**
 * Layout específico para la landing y páginas públicas informativas.
 * Full-width, sin sidebar ni breadcrumb, navbar pública y footer común.
 */
export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicNavbar />
      {/* Offset para navbar fija */}
      <Box component="main" sx={{ flex: 1, pt: '64px' }}>
        {children}
      </Box>
      <Footer />
    </Box>
  )
}

export default LandingLayout