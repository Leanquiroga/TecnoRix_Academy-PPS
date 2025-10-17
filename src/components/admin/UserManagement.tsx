import { useState, useEffect } from 'react'
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
  IconButton,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Typography,
  Stack,
  Tooltip,
} from '@mui/material'
import {
  CheckCircle as ApproveIcon,
  Block as BlockIcon,
  CheckCircleOutline as ActivateIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import type { User, Role, UserStatus } from '../../types/auth'
import * as userService from '../../api/user.service'

interface Props {
  onDataChanged?: () => void
}

export default function UserManagement({ onDataChanged }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Filtros
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  
  // Dialog states
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; user: User | null; newRole: Role }>({
    open: false,
    user: null,
    newRole: 'student',
  })
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    action: () => void
  }>({
    open: false,
    title: '',
    message: '',
    action: () => {},
  })

  useEffect(() => {
    loadUsers()
  }, [roleFilter, statusFilter])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const filters = {
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
      }
      const data = await userService.getUsers(filters)
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (user: User) => {
    try {
      setError(null)
      await userService.approveTeacher(user.id)
      setSuccess(`Profesor ${user.name} aprobado exitosamente`)
      loadUsers()
      onDataChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar profesor')
    }
  }

  const handleSuspend = async (user: User, suspend: boolean) => {
    try {
      setError(null)
      await userService.suspendUser(user.id, suspend)
      setSuccess(`Usuario ${user.name} ${suspend ? 'suspendido' : 'activado'} exitosamente`)
      loadUsers()
      onDataChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado')
    }
  }

  const handleChangeRole = async () => {
    if (!roleDialog.user) return
    
    try {
      setError(null)
      await userService.changeUserRole(roleDialog.user.id, roleDialog.newRole)
      setSuccess(`Rol de ${roleDialog.user.name} cambiado a ${roleDialog.newRole}`)
      setRoleDialog({ open: false, user: null, newRole: 'student' })
      loadUsers()
      onDataChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar rol')
      setRoleDialog({ open: false, user: null, newRole: 'student' })
    }
  }

  const openConfirmDialog = (title: string, message: string, action: () => void) => {
    setConfirmDialog({ open: true, title, message, action })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, title: '', message: '', action: () => {} })
  }

  const executeAction = () => {
    confirmDialog.action()
    closeConfirmDialog()
  }

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'admin':
        return 'error'
      case 'teacher':
        return 'primary'
      case 'student':
        return 'success'
    }
  }

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'suspended':
        return 'error'
      case 'pending_validation':
        return 'warning'
    }
  }

  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'Activo'
      case 'suspended':
        return 'Suspendido'
      case 'pending_validation':
        return 'Pendiente'
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Gestión de Usuarios
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => { loadUsers(); onDataChanged?.() }}
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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Filtrar por Rol</InputLabel>
            <Select
              value={roleFilter}
              label="Filtrar por Rol"
              onChange={(e) => setRoleFilter(e.target.value as Role | '')}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="teacher">Profesor</MenuItem>
              <MenuItem value="student">Estudiante</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Filtrar por Estado</InputLabel>
            <Select
              value={statusFilter}
              label="Filtrar por Estado"
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | '')}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="active">Activo</MenuItem>
              <MenuItem value="suspended">Suspendido</MenuItem>
              <MenuItem value="pending_validation">Pendiente</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Tabla de usuarios */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Rol</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell><strong>Fecha de Registro</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No hay usuarios que mostrar</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role.toUpperCase()}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(user.status)}
                      color={getStatusColor(user.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {/* Aprobar Teacher */}
                      {user.role === 'teacher' && user.status === 'pending_validation' && (
                        <Tooltip title="Aprobar profesor">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() =>
                              openConfirmDialog(
                                'Aprobar Profesor',
                                `¿Estás seguro de aprobar a ${user.name} como profesor?`,
                                () => handleApprove(user)
                              )
                            }
                          >
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* Cambiar Rol */}
                      <Tooltip title="Cambiar rol">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            setRoleDialog({ open: true, user, newRole: user.role })
                          }
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      {/* Suspender/Activar */}
                      {user.status !== 'pending_validation' && (
                        <Tooltip title={user.status === 'suspended' ? 'Activar usuario' : 'Suspender usuario'}>
                          <IconButton
                            size="small"
                            color={user.status === 'suspended' ? 'success' : 'error'}
                            onClick={() =>
                              openConfirmDialog(
                                user.status === 'suspended' ? 'Activar Usuario' : 'Suspender Usuario',
                                `¿Estás seguro de ${user.status === 'suspended' ? 'activar' : 'suspender'} a ${user.name}?`,
                                () => handleSuspend(user, user.status !== 'suspended')
                              )
                            }
                          >
                            {user.status === 'suspended' ? <ActivateIcon /> : <BlockIcon />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog: Cambiar Rol */}
      <Dialog open={roleDialog.open} onClose={() => setRoleDialog({ open: false, user: null, newRole: 'student' })}>
        <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Usuario: <strong>{roleDialog.user?.name}</strong>
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Nuevo Rol</InputLabel>
            <Select
              value={roleDialog.newRole}
              label="Nuevo Rol"
              onChange={(e) =>
                setRoleDialog({ ...roleDialog, newRole: e.target.value as Role })
              }
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="teacher">Profesor</MenuItem>
              <MenuItem value="student">Estudiante</MenuItem>
            </Select>
          </FormControl>
          {roleDialog.newRole === 'teacher' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Al cambiar a profesor, el usuario quedará en estado "Pendiente de Validación"
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog({ open: false, user: null, newRole: 'student' })}>
            Cancelar
          </Button>
          <Button onClick={handleChangeRole} variant="contained" autoFocus>
            Cambiar Rol
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Confirmación */}
      <Dialog open={confirmDialog.open} onClose={closeConfirmDialog}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>Cancelar</Button>
          <Button onClick={executeAction} variant="contained" color="primary" autoFocus>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
