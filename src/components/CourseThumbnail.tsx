import { Box } from '@mui/material'
import React from 'react'

interface CourseThumbnailProps {
  url?: string | null
  title: string
  height?: number
}

export const CourseThumbnail: React.FC<CourseThumbnailProps> = ({ url, title, height = 160 }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 0,
        overflow: 'hidden',
        bgcolor: 'grey.200',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        color: 'text.secondary',
      }}
      data-testid="course-thumbnail"
    >
      {url ? (
        <Box
          component="img"
          src={url}
          alt={`Portada del curso: ${title}`}
          loading="lazy"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement
            target.style.display = 'none'
          }}
        />
      ) : (
        'Sin portada'
      )}
    </Box>
  )
}

export default CourseThumbnail
