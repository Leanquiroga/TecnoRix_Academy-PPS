import { Box, Typography, Paper } from '@mui/material'
import { PlayCircle } from '@mui/icons-material'

interface VideoPlayerProps {
  url: string
  title?: string
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const isValidVideoUrl = (url: string) => {
    const videoExtensions = ['.mp4', '.mpeg', '.mov', '.avi', '.webm']
    const lowerUrl = url.toLowerCase()
    return videoExtensions.some(ext => lowerUrl.includes(ext))
  }

  if (!isValidVideoUrl(url)) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: 'grey.100',
          borderRadius: 2,
        }}
      >
        <PlayCircle sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Formato de video no soportado
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
          bgcolor: 'black',
        }}
      >
        <video
          controls
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            maxHeight: '600px',
          }}
          preload="metadata"
        >
          <source src={url} type="video/mp4" />
          <source src={url} type="video/mpeg" />
          <source src={url} type="video/quicktime" />
          Tu navegador no soporta el elemento de video.
        </video>
      </Paper>
    </Box>
  )
}
