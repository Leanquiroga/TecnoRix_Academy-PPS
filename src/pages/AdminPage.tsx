import { Box, Container, Typography, Paper, Stack, Tabs, Tab } from '@mui/material'
import { useEffect, useState } from 'react'
import UserManagement from '../components/admin/UserManagement'
import TeacherApplicationsList from '../components/admin/TeacherApplicationsList'
import { getUsers } from '../api/user.service'
import { getPendingApplications } from '../api/teacher.service'
import type { Role, UserStatus } from '../types/auth'

export default function AdminPage() {
  // Tab state
  const [currentTab, setCurrentTab] = useState(0)
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
        
        // Usar el nuevo endpoint de teacher.service para obtener aplicaciones pendientes
        const response = await getPendingApplications('pending_validation')
        setPendingTeachers(response.data.total)
      } catch (err) {
        const error = err as Error
        setCountsError(error?.message ?? 'Error al cargar profesores pendientes')
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
      } catch (err) {
        const error = err as Error
        setCountsError(error?.message ?? 'Error al cargar estadísticas')
      }
    }
    loadStats()
  }, [])

  const refreshDashboardStats = async () => {
    // Reutiliza las mismas cargas tras acciones del hijo
    try {
      const [pendingResponse, all, studentsActive] = await Promise.all([
        getPendingApplications('pending_validation'),
        getUsers(),
        getUsers({ role: 'student' as Role, status: 'active' as UserStatus }),
      ])
      setPendingTeachers(pendingResponse.data.total)
      setTotalUsers(all.length)
      setActiveStudents(studentsActive.length)
    } catch (err) {
      const error = err as Error
      // Mantener stats actuales si falla
      setCountsError(error?.message ?? 'Error al actualizar estadísticas')
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

      {/* Tabs para diferentes secciones */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Gestión de Usuarios" />
          <Tab 
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Aplicaciones de Profesores</span>
                {pendingTeachers !== null && pendingTeachers > 0 && (
                  <Box
                    component="span"
                    sx={{
                      bgcolor: 'warning.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {pendingTeachers}
                  </Box>
                )}
              </Stack>
            }
          />
        </Tabs>
      </Paper>

      {/* Contenido según tab */}
      <Paper sx={{ p: 3 }}>
        {currentTab === 0 && (
          <UserManagement onDataChanged={refreshDashboardStats} />
        )}
        {currentTab === 1 && (
          <TeacherApplicationsList onDataChanged={refreshDashboardStats} />
        )}
      </Paper>
    </Container>
  )
}
