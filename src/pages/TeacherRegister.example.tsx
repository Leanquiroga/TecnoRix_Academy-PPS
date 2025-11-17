import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material'
import FileUploadZone from '../components/common/FileUploadZone'
import { useFileUpload } from '../hooks/useFileUpload'
import { useNotify } from '../hooks/useNotify'

// EJEMPLO DE USO DE FileUploadZone en el formulario de registro de profesores

interface TeacherCredential {
  type: 'degree' | 'certificate' | 'portfolio'
  title: string
  institution: string
  document_url: string
}

export default function TeacherRegisterExample() {
  const [activeStep, setActiveStep] = useState(0)
  const [credentials, setCredentials] = useState<TeacherCredential[]>([])
  const { uploading, error, upload } = useFileUpload()
  const notify = useNotify()

  // PASO 1: Información Básica
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  })

  // PASO 2: Perfil Profesional
  const [profile, setProfile] = useState({
    title: '',
    bio: '',
    experience: 0,
    linkedin: '',
  })

  // PASO 3: Credenciales (usando FileUploadZone)
  const [currentCredential, setCurrentCredential] = useState<Partial<TeacherCredential>>({
    type: 'degree',
    title: '',
    institution: '',
  })

  const handleUploadCredential = async (file: File) => {
    try {
      const result = await upload(file)
      if (!result) return

      setCurrentCredential((prev) => ({
        ...prev,
        document_url: result.url,
      }))

      notify({
        message: 'Documento subido exitosamente',
        severity: 'success',
      })
    } catch (err) {
      notify({
        message: 'Error al subir documento',
        severity: 'error',
      })
    }
  }

  const addCredential = () => {
    if (
      currentCredential.title &&
      currentCredential.institution &&
      currentCredential.document_url &&
      currentCredential.type
    ) {
      setCredentials([...credentials, currentCredential as TeacherCredential])
      setCurrentCredential({
        type: 'degree',
        title: '',
        institution: '',
      })
      notify({
        message: 'Credencial agregada',
        severity: 'success',
      })
    }
  }

  const steps = ['Información Básica', 'Perfil Profesional', 'Credenciales']

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Registro de Profesor
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3 }}>
        {activeStep === 0 && (
          <Stack spacing={3}>
            <Typography variant="h6">Paso 1: Información Básica</Typography>
            <TextField
              label="Nombre completo"
              fullWidth
              required
              value={basicInfo.name}
              onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={basicInfo.email}
              onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              required
              value={basicInfo.password}
              onChange={(e) => setBasicInfo({ ...basicInfo, password: e.target.value })}
            />
            <TextField
              label="Teléfono"
              fullWidth
              required
              value={basicInfo.phone}
              onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
            />
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack spacing={3}>
            <Typography variant="h6">Paso 2: Perfil Profesional</Typography>
            <TextField
              label="Título profesional"
              fullWidth
              required
              placeholder="Ej: Ingeniero de Software"
              value={profile.title}
              onChange={(e) => setProfile({ ...profile, title: e.target.value })}
            />
            <TextField
              label="Biografía"
              fullWidth
              required
              multiline
              rows={4}
              placeholder="Cuéntanos sobre tu experiencia y especialización..."
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
            <TextField
              label="Años de experiencia"
              type="number"
              fullWidth
              required
              value={profile.experience}
              onChange={(e) => setProfile({ ...profile, experience: Number(e.target.value) })}
            />
            <TextField
              label="LinkedIn (opcional)"
              fullWidth
              placeholder="https://linkedin.com/in/tu-perfil"
              value={profile.linkedin}
              onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
            />
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack spacing={3}>
            <Typography variant="h6">Paso 3: Credenciales</Typography>
            <Typography variant="body2" color="text.secondary">
              Sube documentos que validen tu experiencia (títulos, certificados, portfolio)
            </Typography>

            <TextField
              label="Título del documento"
              fullWidth
              required
              placeholder="Ej: Título de Ingeniero de Sistemas"
              value={currentCredential.title}
              onChange={(e) =>
                setCurrentCredential({ ...currentCredential, title: e.target.value })
              }
            />

            <TextField
              label="Institución"
              fullWidth
              required
              placeholder="Ej: Universidad Nacional"
              value={currentCredential.institution}
              onChange={(e) =>
                setCurrentCredential({ ...currentCredential, institution: e.target.value })
              }
            />

            {/* AQUÍ USAMOS EL COMPONENTE FileUploadZone */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Documento de respaldo *
              </Typography>
              <FileUploadZone
                onUpload={handleUploadCredential}
                loading={uploading}
                error={error}
                accept="application/pdf,image/*"
                maxSize={10 * 1024 * 1024}
                showPreview={true}
                helperText="PDF o imagen de tu título/certificado (máx 10MB)"
              />
            </Box>

            <Button
              variant="outlined"
              onClick={addCredential}
              disabled={
                !currentCredential.title ||
                !currentCredential.institution ||
                !currentCredential.document_url
              }
            >
              Agregar Credencial
            </Button>

            {credentials.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Credenciales agregadas: {credentials.length}
                </Typography>
                <Stack spacing={1}>
                  {credentials.map((cred, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body1" fontWeight="bold">
                        {cred.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {cred.institution}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={() => setActiveStep(activeStep - 1)}>
            Atrás
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              activeStep === steps.length - 1 ? console.log('Submit') : setActiveStep(activeStep + 1)
            }
          >
            {activeStep === steps.length - 1 ? 'Enviar Solicitud' : 'Siguiente'}
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
