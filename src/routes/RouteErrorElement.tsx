import React from 'react'
import { useRouteError, isRouteErrorResponse, Link as RouterLink } from 'react-router-dom'
import { Box, Button, Card, CardContent, Typography } from '@mui/material'

const RouteErrorElement: React.FC = () => {
  const error = useRouteError() as any
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : (error?.message || 'Ocurrió un error inesperado')

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
      <Card sx={{ maxWidth: 640, width: '100%' }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Ups, algo salió mal
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {message}
          </Typography>
          <Button component={RouterLink} to="/" variant="contained">Ir al inicio</Button>
        </CardContent>
      </Card>
    </Box>
  )
}

export default RouteErrorElement
