import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Avatar,
  Chip,
  Divider,
  Paper,
  IconButton,
  TextField,
  Alert,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  CircularProgress,
} from '@mui/material'
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Download as DownloadIcon,
  LinkedIn as LinkedInIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  WorkOutline as WorkIcon,
  EmojiEvents as CertIcon,
} from '@mui/icons-material'
import {
  type TeacherApplication,
  type ReviewCredentialData,
  reviewCredential,
  approveTeacher,
  rejectTeacherApplication,
} from '../../api/teacher.service'

interface Props {
  open: boolean
  application: TeacherApplication
  onClose: () => void
  onApplicationUpdated: (message: string, shouldClose?: boolean) => void
}

export default function TeacherApplicationModal({
  open,
  application,
  onClose,
  onApplicationUpdated,
}: Props) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Rejection state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  
  // Credential review state
  const [reviewingCredential, setReviewingCredential] = useState<string | null>(null)
  const [credentialRejectReason, setCredentialRejectReason] = useState('')
  const [credentialRejectDialogOpen, setCredentialRejectDialogOpen] = useState(false)

  const handleReviewCredential = async (
    credentialId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ) => {
    setProcessing(true)
    setError(null)
    try {
      const data: ReviewCredentialData = {
        verification_status: status,
        ...(reason && { rejection_reason: reason }),
      }
      await reviewCredential(credentialId, data)
      onApplicationUpdated(`Credencial ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al revisar credencial')
    } finally {
      setProcessing(false)
      setCredentialRejectDialogOpen(false)
      setCredentialRejectReason('')
      setReviewingCredential(null)
    }
  }

  const handleApproveTeacher = async () => {
    setProcessing(true)
    setError(null)
    try {
      await approveTeacher(application.user_id)
      onApplicationUpdated(`Profesor ${application.name || 'sin nombre'} aprobado exitosamente`, true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar profesor')
      setProcessing(false)
    }
  }

  const handleRejectApplication = async () => {
    if (!rejectionReason.trim()) {
      setError('Debes proporcionar un motivo de rechazo')
      return
    }
    
    setProcessing(true)
    setError(null)
    try {
      await rejectTeacherApplication(application.user_id, rejectionReason)
      onApplicationUpdated(`Solicitud de ${application.name || 'profesor'} rechazada`, true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar solicitud')
      setProcessing(false)
      setRejectDialogOpen(false)
    }
  }

  const openCredentialRejectDialog = (credentialId: string) => {
    setReviewingCredential(credentialId)
    setCredentialRejectDialogOpen(true)
    setCredentialRejectReason('')
  }

  const getCredentialIcon = (type: string) => {
    switch (type) {
      case 'degree':
        return <SchoolIcon />
      case 'certification':
        return <CertIcon />
      case 'work_experience':
        return <WorkIcon />
      default:
        return <SchoolIcon />
    }
  }

  const getCredentialTypeLabel = (type: string) => {
    switch (type) {
      case 'degree':
        return 'Título Académico'
      case 'certification':
        return 'Certificación'
      case 'work_experience':
        return 'Experiencia Laboral'
      default:
        return type
    }
  }

  const getCredentialStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success'
      case 'rejected':
        return 'error'
      case 'pending':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getCredentialStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobada'
      case 'rejected':
        return 'Rechazada'
      case 'pending':
        return 'Pendiente'
      default:
        return status
    }
  }

  const allCredentialsApproved = application.credentials?.every(
    c => c.verification_status === 'approved'
  ) ?? false

  const hasCredentials = (application.credentials?.length ?? 0) > 0

  const isPending = application.status === 'pending_validation'

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar 
              src={application.profile?.photo_url} 
              alt={application.name || 'Usuario'}
              sx={{ width: 56, height: 56 }}
            >
              {application.name ? application.name.charAt(0).toUpperCase() : '?'}
            </Avatar>
            <Box>
              <Typography variant="h6">{application.name || 'Sin nombre'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {application.profile?.headline || 'Sin especialidad'}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Chip
                label={application.status === 'active' ? 'Aprobado' : 
                       application.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                color={application.status === 'active' ? 'success' : 
                       application.status === 'rejected' ? 'error' : 'warning'}
              />
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Información básica */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Información de Contacto
            </Typography>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2">{application.email}</Typography>
              </Stack>
              {application.profile?.phone && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">{application.profile.phone}</Typography>
                </Stack>
              )}
              {application.profile?.linkedin_url && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <LinkedInIcon fontSize="small" color="action" />
                  <Link 
                    href={application.profile.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    variant="body2"
                  >
                    Ver perfil de LinkedIn
                  </Link>
                </Stack>
              )}
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  Registrado: {new Date(application.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          {/* Perfil profesional */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Perfil Profesional
            </Typography>
            
            {application.profile?.years_experience && (
              <Box mb={2}>
                <Chip 
                  label={`${application.profile.years_experience} años de experiencia`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>
            )}

            {application.profile?.bio && (
              <Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  paragraph
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  {application.profile.bio}
                </Typography>
              </Box>
            )}

            {!application.profile && (
              <Typography variant="body2" color="text.secondary">
                No se ha completado el perfil profesional
              </Typography>
            )}
          </Paper>

          <Divider sx={{ my: 3 }} />

          {/* Credenciales */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Credenciales ({application.credentials?.length || 0})
            </Typography>

            {!hasCredentials ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No se han proporcionado credenciales
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Tipo</strong></TableCell>
                      <TableCell><strong>Institución</strong></TableCell>
                      <TableCell><strong>Año</strong></TableCell>
                      <TableCell><strong>Documento</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                      <TableCell align="center"><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {application.credentials?.map((credential) => (
                      <TableRow key={credential.id}>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {getCredentialIcon(credential.credential_type)}
                            <Typography variant="body2">
                              {getCredentialTypeLabel(credential.credential_type)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {credential.institution}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {credential.year_obtained}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Descargar documento">
                            <IconButton
                              size="small"
                              component="a"
                              href={credential.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getCredentialStatusLabel(credential.verification_status)}
                            color={getCredentialStatusColor(credential.verification_status)}
                            size="small"
                          />
                          {credential.rejection_reason && (
                            <Tooltip title={credential.rejection_reason}>
                              <Typography 
                                variant="caption" 
                                color="error" 
                                display="block"
                                sx={{ mt: 0.5, cursor: 'help' }}
                              >
                                Ver motivo
                              </Typography>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {credential.verification_status === 'pending' && isPending && (
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Aprobar credencial">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleReviewCredential(credential.id, 'approved')}
                                  disabled={processing}
                                >
                                  <ApproveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rechazar credencial">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => openCredentialRejectDialog(credential.id)}
                                  disabled={processing}
                                >
                                  <RejectIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          {!allCredentialsApproved && hasCredentials && isPending && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Debes aprobar todas las credenciales antes de aprobar al profesor
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={processing}>
            Cerrar
          </Button>
          
          {isPending && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setRejectDialogOpen(true)}
                disabled={processing}
              >
                Rechazar Solicitud
              </Button>
              
              <Button
                variant="contained"
                color="success"
                startIcon={processing ? <CircularProgress size={16} /> : <ApproveIcon />}
                onClick={handleApproveTeacher}
                disabled={!allCredentialsApproved || !hasCredentials || processing}
              >
                Aprobar Profesor
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog: Rechazar Solicitud */}
      <Dialog 
        open={rejectDialogOpen} 
        onClose={() => !processing && setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rechazar Solicitud de Profesor</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Profesor: <strong>{application.name || 'Sin nombre'}</strong>
          </Typography>
          <TextField
            label="Motivo del rechazo"
            multiline
            rows={4}
            fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Explica el motivo del rechazo (será enviado al profesor)"
            disabled={processing}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleRejectApplication} 
            variant="contained" 
            color="error"
            disabled={!rejectionReason.trim() || processing}
          >
            {processing ? 'Rechazando...' : 'Confirmar Rechazo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Rechazar Credencial */}
      <Dialog 
        open={credentialRejectDialogOpen} 
        onClose={() => !processing && setCredentialRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rechazar Credencial</DialogTitle>
        <DialogContent>
          <TextField
            label="Motivo del rechazo"
            multiline
            rows={3}
            fullWidth
            value={credentialRejectReason}
            onChange={(e) => setCredentialRejectReason(e.target.value)}
            sx={{ mt: 1 }}
            placeholder="Explica por qué esta credencial no es válida"
            disabled={processing}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCredentialRejectDialogOpen(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button 
            onClick={() => reviewingCredential && handleReviewCredential(
              reviewingCredential, 
              'rejected', 
              credentialRejectReason
            )}
            variant="contained" 
            color="error"
            disabled={!credentialRejectReason.trim() || processing}
          >
            {processing ? 'Rechazando...' : 'Rechazar Credencial'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
