import { Box, Container, Typography, Paper, Stack } from '@mui/material'
import { useEffect, useState } from 'react'
import UserManagement from '../components/admin/UserManagement'
import { getUsers } from '../api/user.service'
import type { Role, UserStatus } from '../types/auth'

export default function AdminPage() {
  // Estado para estadísticas rápidas
  const [pendingTeachers, setPendingTeachers] = useState<number | null>(null)
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [activeStudents, setActiveStudents] = useState<number | null>(null)
  const [loadingCounts, setLoadingCounts] = useState<boolean>(false)
  const [countsError, setCountsError] = useState<string | null>(null)

  useEffect(() => {
    const loadPendingTeachers = async () => {
      try {
        setLoadingCounts(true)
        setCountsError(null)
        const list = await getUsers({
          role: 'teacher' as Role,
          status: 'pending_validation' as UserStatus,
        })
        setPendingTeachers(list.length)
      } catch (err: any) {
        setCountsError(err?.message ?? 'Error al cargar profesores pendientes')
      } finally {
        setLoadingCounts(false)
      }
    }
    loadPendingTeachers()
  }, [])

  // Cargar métricas totales y estudiantes activos
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Total usuarios
        const all = await getUsers()
        setTotalUsers(all.length)

        // Estudiantes activos
        const studentsActive = await getUsers({ role: 'student' as Role, status: 'active' as UserStatus })
        setActiveStudents(studentsActive.length)
      } catch (err: any) {
        setCountsError(err?.message ?? 'Error al cargar estadísticas')
      }
    }
    loadStats()
  }, [])

  const refreshDashboardStats = async () => {
    // Reutiliza las mismas cargas tras acciones del hijo
    try {
      const [pending, all, studentsActive] = await Promise.all([
        getUsers({ role: 'teacher' as Role, status: 'pending_validation' as UserStatus }),
        getUsers(),
        getUsers({ role: 'student' as Role, status: 'active' as UserStatus }),
      ])
      setPendingTeachers(pending.length)
      setTotalUsers(all.length)
      setActiveStudents(studentsActive.length)
    } catch (err: any) {
      // Mantener stats actuales si falla
      setCountsError(err?.message ?? 'Error al actualizar estadísticas')
    }
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Panel de Administración
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona usuarios, roles y permisos del sistema
        </Typography>
      </Box>

      {/* Estadísticas rápidas (para fase posterior) */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={3}
        sx={{ mb: 4 }}
        flexWrap="wrap"
      >
        <Paper
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            height: 140,
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Total Usuarios
          </Typography>
          <Typography variant="h3" component="div" fontWeight="bold" title={countsError ?? undefined}>
            {totalUsers ?? '—'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 'auto', opacity: 0.8 }}>
            Usuarios registrados
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            height: 140,
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Profesores Pendientes
          </Typography>
          <Typography variant="h3" component="div" fontWeight="bold" title={countsError ?? undefined}>
            {loadingCounts && pendingTeachers === null ? '…' : (pendingTeachers ?? '—')}
          </Typography>
          <Typography variant="body2" sx={{ mt: 'auto', opacity: 0.8 }}>
            Por aprobar
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            height: 140,
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Cursos Activos
          </Typography>
          <Typography variant="h3" component="div" fontWeight="bold">
            ---
          </Typography>
          <Typography variant="body2" sx={{ mt: 'auto', opacity: 0.8 }}>
            Disponibles en la plataforma
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            height: 140,
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Estudiantes Activos
          </Typography>
          <Typography variant="h3" component="div" fontWeight="bold" title={countsError ?? undefined}>
            {activeStudents ?? '—'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 'auto', opacity: 0.8 }}>
            Inscritos en cursos
          </Typography>
        </Paper>
      </Stack>

      {/* Gestión de Usuarios */}
      <Paper sx={{ p: 3 }}>
        <UserManagement onDataChanged={refreshDashboardStats} />
      </Paper>
    </Container>
  )
}
