// ============================================
// TEACHER REGISTER - FASE 6.5
// ============================================
// Formulario multi-paso para inscripción de profesores

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Link as MuiLink,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import { Delete as DeleteIcon } from '@mui/icons-material'
import { useNotify } from '../hooks/useNotify'
import { useAuth } from '../hooks/useAuth'
import { createTeacherApplication, type TeacherCredentialInput } from '../api/teacher.service'
import FileUploadZone from '../components/common/FileUploadZone'
import { uploadCredentialPublic } from '../api/upload.service'

// ============================================
// TYPES
// ============================================

interface FormData {
  // Step 1
  name: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  
  // Step 2
  headline: string
  bio: string
  years_experience: string
  linkedin_url: string
  photo_url: string
  
  // Step 3
  credentials: TeacherCredentialInput[]
}

interface CurrentCredential {
  credential_type: 'degree' | 'certification' | 'work_experience'
  institution: string
  document_url: string
  year_obtained: string
}

const STEPS = ['Información Básica', 'Perfil Profesional', 'Credenciales']

const CREDENTIAL_TYPES = [
  { value: 'degree', label: 'Título Universitario' },
  { value: 'certification', label: 'Certificación Profesional' },
  { value: 'work_experience', label: 'Experiencia Laboral' },
]

// ============================================
// LOCAL STORAGE KEY
// ============================================
const STORAGE_KEY = 'teacher_registration_draft'

// ============================================
// COMPONENT
// ============================================

export default function TeacherRegister() {
  const navigate = useNavigate()
  const notify = useNotify()
  const { isAuthenticated } = useAuth()
  
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploadingCredential, setUploadingCredential] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState<FormData>(() => {
    // Cargar desde localStorage si existe
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return getInitialFormData()
      }
    }
    return getInitialFormData()
  })
  
  // Current credential being added
  const [currentCredential, setCurrentCredential] = useState<CurrentCredential>({
    credential_type: 'degree',
    institution: '',
    document_url: '',
    year_obtained: '',
  })
  
  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ============================================
  // AUTO-SAVE TO LOCALSTORAGE
  // ============================================
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [formData])

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleCredentialChange = (field: keyof CurrentCredential) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCurrentCredential(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleUploadCredential = async (file: File) => {
    try {
      setUploadingCredential(true)
      const result = isAuthenticated
        ? await uploadCredentialPublic(file) // válido también con login
        : await uploadCredentialPublic(file)
      setCurrentCredential(prev => ({ ...prev, document_url: result.url }))
      notify({ message: 'Documento subido exitosamente', severity: 'success' })
    } catch (error: any) {
      notify({ message: error.message || 'Error al subir documento', severity: 'error' })
    } finally {
      setUploadingCredential(false)
    }
  }

  const handleAddCredential = () => {
    // Validar credencial actual
    if (!currentCredential.institution.trim()) {
      notify({ message: 'Ingresa el nombre de la institución', severity: 'error' })
      return
    }
    if (!currentCredential.document_url) {
      notify({ message: 'Debes subir un documento', severity: 'error' })
      return
    }
    if (!currentCredential.year_obtained || parseInt(currentCredential.year_obtained) < 1950) {
      notify({ message: 'Ingresa un año válido', severity: 'error' })
      return
    }

    // Agregar a lista
    const newCredential: TeacherCredentialInput = {
      credential_type: currentCredential.credential_type,
      institution: currentCredential.institution,
      document_url: currentCredential.document_url,
      year_obtained: parseInt(currentCredential.year_obtained),
    }

    setFormData(prev => ({
      ...prev,
      credentials: [...prev.credentials, newCredential],
    }))

    // Reset current credential
    setCurrentCredential({
      credential_type: 'degree',
      institution: '',
      document_url: '',
      year_obtained: '',
    })

    notify({ message: 'Credencial agregada', severity: 'success' })
  }

  const handleRemoveCredential = (index: number) => {
    setFormData(prev => ({
      ...prev,
      credentials: prev.credentials.filter((_, i) => i !== index),
    }))
    notify({ message: 'Credencial eliminada', severity: 'info' })
  }

  // ============================================
  // VALIDATIONS
  // ============================================

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.headline.trim()) {
      newErrors.headline = 'El título profesional es obligatorio'
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'La biografía es obligatoria'
    } else if (formData.bio.length < 150) {
      newErrors.bio = 'Mínimo 150 caracteres'
    } else if (formData.bio.length > 500) {
      newErrors.bio = 'Máximo 500 caracteres'
    }

    const years = parseInt(formData.years_experience)
    if (!formData.years_experience || isNaN(years)) {
      newErrors.years_experience = 'Los años de experiencia son obligatorios'
    } else if (years < 0 || years > 50) {
      newErrors.years_experience = 'Debe estar entre 0 y 50 años'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = (): boolean => {
    if (formData.credentials.length === 0) {
      notify({ message: 'Debes agregar al menos 1 credencial', severity: 'error' })
      return false
    }
    return true
  }

  // ============================================
  // NAVIGATION
  // ============================================

  const handleNext = () => {
    let isValid = false

    if (activeStep === 0) {
      isValid = validateStep1()
    } else if (activeStep === 1) {
      isValid = validateStep2()
    } else if (activeStep === 2) {
      isValid = validateStep3()
    }

    if (isValid) {
      if (activeStep === STEPS.length - 1) {
        handleSubmit()
      } else {
        setActiveStep(prev => prev + 1)
      }
    }
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  // ============================================
  // SUBMIT
  // ============================================

  const handleSubmit = async () => {
    try {
      setLoading(true)

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        headline: formData.headline,
        bio: formData.bio,
        years_experience: parseInt(formData.years_experience),
        linkedin_url: formData.linkedin_url || undefined,
        photo_url: formData.photo_url || undefined,
        credentials: formData.credentials,
      }

      await createTeacherApplication(payload)

      // Limpiar localStorage
      localStorage.removeItem(STORAGE_KEY)

      notify({ message: 'Solicitud enviada exitosamente', severity: 'success' })
      
      // Redirigir a página de confirmación
      navigate('/teacher/pending', { 
        state: { email: formData.email } 
      })
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Error al enviar solicitud'
      notify({ message, severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // RENDER STEPS
  // ============================================

  const renderStep1 = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            fullWidth
            label="Nombre completo"
            value={formData.name}
            onChange={handleChange('name')}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            type="email"
            label="Email"
            value={formData.email}
            onChange={handleChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="password"
            label="Contraseña"
            value={formData.password}
            onChange={handleChange('password')}
            error={!!errors.password}
            helperText={errors.password || 'Mínimo 6 caracteres'}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="password"
            label="Confirmar contraseña"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            required
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            label="Teléfono"
            value={formData.phone}
            onChange={handleChange('phone')}
            error={!!errors.phone}
            helperText={errors.phone}
            required
            placeholder="+54 11 1234-5678"
          />
        </Grid>
      </Grid>
    </Box>
  )

  const renderStep2 = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            fullWidth
            label="Título profesional"
            value={formData.headline}
            onChange={handleChange('headline')}
            error={!!errors.headline}
            helperText={errors.headline || 'Ej: "Ingeniero de Software con 10 años de experiencia"'}
            required
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Biografía"
            value={formData.bio}
            onChange={handleChange('bio')}
            error={!!errors.bio}
            helperText={
              errors.bio || 
              `${formData.bio.length}/500 caracteres (mínimo 150)`
            }
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="Años de experiencia"
            value={formData.years_experience}
            onChange={handleChange('years_experience')}
            error={!!errors.years_experience}
            helperText={errors.years_experience}
            required
            InputProps={{ inputProps: { min: 0, max: 50 } }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="LinkedIn URL (opcional)"
            value={formData.linkedin_url}
            onChange={handleChange('linkedin_url')}
            placeholder="https://linkedin.com/in/tu-perfil"
          />
        </Grid>
      </Grid>
    </Box>
  )

  const renderStep3 = () => (
    <Box sx={{ mt: 3 }}>
      {/* Lista de credenciales agregadas */}
      {formData.credentials.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Credenciales agregadas ({formData.credentials.length})
          </Typography>
          <List>
            {formData.credentials.map((cred, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={`${CREDENTIAL_TYPES.find(t => t.value === cred.credential_type)?.label} - ${cred.institution}`}
                  secondary={`Año: ${cred.year_obtained}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveCredential(index)}
                    disabled={loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Formulario para agregar nueva credencial */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Agregar credencial
        </Typography>

        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField
              fullWidth
              select
              label="Tipo de credencial"
              value={currentCredential.credential_type}
              onChange={handleCredentialChange('credential_type')}
            >
              {CREDENTIAL_TYPES.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Institución o Empresa"
              value={currentCredential.institution}
              onChange={handleCredentialChange('institution')}
              placeholder="Ej: Universidad de Buenos Aires"
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              type="number"
              label="Año de obtención"
              value={currentCredential.year_obtained}
              onChange={handleCredentialChange('year_obtained')}
              InputProps={{ inputProps: { min: 1950, max: new Date().getFullYear() } }}
            />
          </Grid>

          <Grid size={12}>
            <FileUploadZone
              onUpload={handleUploadCredential}
              accept="application/pdf"
              maxSize={5 * 1024 * 1024}
              helperText="Sube tu certificado, diploma o carta laboral (PDF, máx 5MB)"
              loading={uploadingCredential}
              disabled={loading}
            />
            {/* Ya no se requiere login para subir credenciales (ruta pública) */}
            {currentCredential.document_url && (
              <Alert severity="success" sx={{ mt: 1 }}>
                Documento subido. Ahora presiona "Agregar credencial" para incluirla.
              </Alert>
            )}
          </Grid>

          <Grid size={12}>
            {(() => {
              const year = parseInt(currentCredential.year_obtained)
              const canAdd = Boolean(
                currentCredential.document_url &&
                currentCredential.institution.trim() &&
                !Number.isNaN(year) && year >= 1950
              )
              return (
                <>
                  <Button
                    variant="contained"
                    onClick={handleAddCredential}
                    disabled={!canAdd || loading || uploadingCredential}
                    fullWidth
                  >
                    Agregar Credencial
                  </Button>
                  {!canAdd && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                      Completa institución, año válido y sube el PDF para habilitar.
                    </Typography>
                  )}
                </>
              )
            })()}
          </Grid>
        </Grid>
      </Paper>

      {formData.credentials.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Debes agregar al menos 1 credencial para continuar
        </Alert>
      )}
    </Box>
  )

  // ============================================
  // RENDER
  // ============================================

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Inscripción de Profesores
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Completa tu solicitud en 3 simples pasos
        </Typography>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Content */}
        {activeStep === 0 && renderStep1()}
        {activeStep === 1 && renderStep2()}
        {activeStep === 2 && renderStep3()}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            fullWidth
          >
            Anterior
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            fullWidth
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : activeStep === STEPS.length - 1 ? (
              'Enviar Solicitud'
            ) : (
              'Siguiente'
            )}
          </Button>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            ¿Ya tienes una cuenta?{' '}
            <MuiLink href="/login" underline="hover">
              Inicia sesión aquí
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

// ============================================
// HELPER
// ============================================

function getInitialFormData(): FormData {
  return {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    headline: '',
    bio: '',
    years_experience: '',
    linkedin_url: '',
    photo_url: '',
    credentials: [],
  }
}
