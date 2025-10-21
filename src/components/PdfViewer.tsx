import { Box, Typography, Paper, Alert } from '@mui/material'
import { PictureAsPdf } from '@mui/icons-material'

interface PdfViewerProps {
  url: string
  title?: string
}

export function PdfViewer({ url, title }: PdfViewerProps) {
  const isValidPdfUrl = (url: string) => {
    return url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf')
  }

  if (!isValidPdfUrl(url)) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: 'grey.100',
          borderRadius: 2,
        }}
      >
        <PictureAsPdf sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          El archivo no es un PDF válido
        </Typography>
      </Paper>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      {title && (
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <Paper
        elevation={3}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          height: '800px',
          position: 'relative',
        }}
      >
        <iframe
          src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
          width="100%"
          height="100%"
          style={{
            border: 'none',
            display: 'block',
          }}
          title={title || 'PDF Viewer'}
        />
      </Paper>
      <Alert severity="info" sx={{ mt: 2 }}>
        Si el PDF no se muestra correctamente, puedes{' '}
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
          abrirlo en una nueva pestaña
        </a>
      </Alert>
    </Box>
  )
}
