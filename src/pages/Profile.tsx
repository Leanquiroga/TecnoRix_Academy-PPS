import { useAuth } from '../hooks/useAuth'
import { Box, Tabs, Tab, Container } from '@mui/material'
import { useState } from 'react'
import ProfileHeader from '../components/profile/ProfileHeader'
import ProfileEditForm from '../components/profile/ProfileEditForm'
import SecuritySettings from '../components/profile/SecuritySettings'
import ActivitySummary from '../components/profile/ActivitySummary'

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth()
  const [tab, setTab] = useState(0)

  if (!isAuthenticated || !user) {
    return <Box p={4}>Debes iniciar sesión para ver tu perfil.</Box>
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ProfileHeader user={user} />
      <Box mb={3}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label="Información" />
          <Tab label="Seguridad" />
          <Tab label="Actividad" />
        </Tabs>
      </Box>
      <Box>
        {tab === 0 && <ProfileEditForm user={user} />}
        {tab === 1 && <SecuritySettings />}
        {tab === 2 && <ActivitySummary user={user} />}
      </Box>
    </Container>
  )
}
