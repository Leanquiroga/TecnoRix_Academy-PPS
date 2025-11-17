import React, { useState, useRef } from 'react'
import {
  Box,
  Button,
  Paper,
  Typography,
  LinearProgress,
  Stack,
  Alert,
  IconButton,
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'

export interface FileUploadZoneProps {
  onUpload: (file: File) => Promise<void>
  loading?: boolean
  error?: string | null
  accept?: string
  maxSize?: number
  showPreview?: boolean
  disabled?: boolean
  helperText?: string
}

export default function FileUploadZone({
  onUpload,
  loading = false,
  error = null,
  accept = 'application/pdf,video/*',
  maxSize = 100 * 1024 * 1024, // 100MB default
  showPreview = true,
  disabled = false,
  helperText,
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Función para validar archivo
  const validateFile = (file: File): string | null => {
    const allowedTypes = accept.split(',').map((t) => t.trim())
    const matchesType = allowedTypes.some((type) => {
      if (type.includes('/*')) {
        const baseType = type.split('/')[0]
        return file.type.startsWith(baseType)
      }
      return file.type === type
    })

    if (!matchesType) {
      return 'Tipo de archivo no permitido'
    }

    if (file.size > maxSize) {
      const maxMB = (maxSize / (1024 * 1024)).toFixed(0)
      return `El archivo es demasiado grande. Máximo ${maxMB}MB`
    }

    return null
  }

  // Generar preview URL para videos e imágenes
  const generatePreview = (file: File) => {
    if (file.type.startsWith('video/') || file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    return undefined
  }

  // Manejar selección de archivo
  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      // Error de validación - lo maneja el padre a través del error prop
      return
    }

    setSelectedFile(file)
    if (showPreview) {
      generatePreview(file)
    }

    await onUpload(file)
  }

  // Manejar cambio en input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Manejar drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  // Limpiar archivo seleccionado
  const handleClear = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  // Click en zona de drop
  const handleZoneClick = () => {
    inputRef.current?.click()
  }

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <PictureAsPdfIcon sx={{ fontSize: 48, color: 'error.main' }} />
    }
    if (file.type.startsWith('video/')) {
      return <PlayCircleOutlineIcon sx={{ fontSize: 48, color: 'primary.main' }} />
    }
    return <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Box>
      {/* Zona de Drop */}
      <Paper
        elevation={dragActive ? 6 : 1}
        sx={{
          p: 3,
          border: dragActive ? '2px dashed' : '2px dashed transparent',
          borderColor: dragActive ? 'primary.main' : 'divider',
          bgcolor: dragActive ? 'action.hover' : 'background.paper',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          opacity: disabled ? 0.6 : 1,
          '&:hover': {
            bgcolor: disabled || loading ? undefined : 'action.hover',
            borderColor: disabled || loading ? undefined : 'primary.main',
          },
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={disabled || loading ? undefined : handleZoneClick}
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled || loading}
        />

        <Stack spacing={2} alignItems="center">
          {/* Loading State */}
          {loading ? (
            <>
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              <Typography variant="h6" color="primary">
                Subiendo archivo...
              </Typography>
              <Box sx={{ width: '100%', maxWidth: 400 }}>
                <LinearProgress />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Por favor espera mientras se sube el archivo
              </Typography>
            </>
          ) : selectedFile && showPreview ? (
            /* Preview State */
            <>
              {previewUrl && selectedFile.type.startsWith('video/') ? (
                <video
                  src={previewUrl}
                  controls
                  style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
                />
              ) : previewUrl && selectedFile.type.startsWith('image/') ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Preview"
                  sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 2 }}
                />
              ) : (
                getFileIcon(selectedFile)
              )}
              <Typography variant="h6" noWrap sx={{ maxWidth: '100%' }}>
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatFileSize(selectedFile.size)}
              </Typography>
              <IconButton 
                onClick={handleClear} 
                color="error" 
                disabled={loading}
                aria-label="eliminar archivo"
              >
                <DeleteIcon />
              </IconButton>
            </>
          ) : (
            /* Empty State */
            <>
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                Arrastra un archivo aquí o haz clic para seleccionar
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadFileIcon />}
                disabled={disabled || loading}
                onClick={(e) => {
                  e.stopPropagation()
                  handleZoneClick()
                }}
              >
                Seleccionar archivo
              </Button>
              {helperText && (
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  {helperText}
                </Typography>
              )}
            </>
          )}
        </Stack>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  )
}
