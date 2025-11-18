import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Typography,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { getPendingApplications, type TeacherApplication } from '../../api/teacher.service'
import TeacherApplicationModal from './TeacherApplicationModal.js'

interface Props {
  onDataChanged?: () => void
}

type StatusFilter = 'all' | 'pending_validation' | 'active' | 'rejected' | 'suspended'

export default function TeacherApplicationsList({ onDataChanged }: Props) {
  const [applications, setApplications] = useState<TeacherApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending_validation')
  
  // Modal state
  const [selectedApplication, setSelectedApplication] = useState<TeacherApplication | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadApplications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter
      const response = await getPendingApplications(status)
      setApplications(response.data.applications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar aplicaciones')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  const handleViewDetails = (application: TeacherApplication) => {
    setSelectedApplication(application)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedApplication(null)
  }

  const handleApplicationUpdated = async (message: string, shouldClose: boolean = true) => {
    setSuccess(message)
    
    // Recargar la lista de aplicaciones
    await loadApplications()
    onDataChanged?.()
    
    // Si el modal debe permanecer abierto, actualizar la aplicación seleccionada
    if (!shouldClose && selectedApplication) {
      // Buscar la aplicación actualizada en la nueva lista
      const status = statusFilter === 'all' ? undefined : statusFilter
      const response = await getPendingApplications(status)
      const updatedApplication = response.data.applications.find(
        app => app.user_id === selectedApplication.user_id
      )
      if (updatedApplication) {
        setSelectedApplication(updatedApplication)
      }
    }
    
    if (shouldClose) {
      handleCloseModal()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'rejected':
        return 'error'
      case 'pending_validation':
        return 'warning'
      case 'suspended':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aprobado'
      case 'rejected':
        return 'Rechazado'
      case 'pending_validation':
        return 'Pendiente'
      case 'suspended':
        return 'Suspendido'
      default:
        return status
    }
  }

  const getPendingCredentialsCount = (application: TeacherApplication) => {
    if (!application.credentials) return 0
    return application.credentials.filter(c => c.verification_status === 'pending').length
  }

  const renderTableContent = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
            <CircularProgress />
          </TableCell>
        </TableRow>
      )
    }

    if (applications.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
            <Typography color="text.secondary">
              No hay aplicaciones {statusFilter !== 'all' && `con estado "${getStatusLabel(statusFilter)}"`}
            </Typography>
          </TableCell>
        </TableRow>
      )
    }

    return applications.map((application, index) => (
      <TableRow key={`${application.user_id}-${index}`} hover>
        <TableCell>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar 
              src={application.profile?.photo_url} 
              alt={application.name || 'Usuario'}
              sx={{ width: 40, height: 40 }}
            >
              {application.name ? application.name.charAt(0).toUpperCase() : '?'}
            </Avatar>
            <Typography variant="body2" fontWeight="medium">
              {application.name || 'Sin nombre'}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {application.email || '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
            {application.profile?.headline || '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {application.profile?.years_experience 
              ? `${application.profile.years_experience} años`
              : '—'
            }
          </Typography>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="body2">
              {application.credentials?.length || 0}
            </Typography>
            {getPendingCredentialsCount(application) > 0 && (
              <Chip 
                label={`${getPendingCredentialsCount(application)} pendientes`}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>
        </TableCell>
        <TableCell>
          <Chip
            label={getStatusLabel(application.status)}
            color={getStatusColor(application.status)}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {new Date(application.created_at).toLocaleDateString('es-ES')}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Tooltip title="Ver detalles y revisar">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleViewDetails(application)}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Aplicaciones de Profesores
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Mostrando {applications.length} aplicacion{applications.length !== 1 ? 'es' : ''}
          </Typography>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => { loadApplications(); onDataChanged?.() }}
          variant="outlined"
          disabled={loading}
        >
          Actualizar
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por Estado</InputLabel>
            <Select
              value={statusFilter}
              label="Filtrar por Estado"
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pending_validation">Pendientes</MenuItem>
              <MenuItem value="active">Aprobados</MenuItem>
              <MenuItem value="rejected">Rechazados</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            Total: <strong>{applications.length}</strong> aplicaciones
          </Typography>
        </Stack>
      </Paper>

      {/* Tabla de aplicaciones */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Profesor</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Especialidad</strong></TableCell>
              <TableCell><strong>Experiencia</strong></TableCell>
              <TableCell><strong>Credenciales</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderTableContent()}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de detalles */}
      {selectedApplication && (
        <TeacherApplicationModal
          open={modalOpen}
          application={selectedApplication}
          onClose={handleCloseModal}
          onApplicationUpdated={handleApplicationUpdated}
        />
      )}
    </Box>
  )
}
