import { Container } from '@mui/material'
import UserManagement from '../components/admin/UserManagement'

export default function AdminUsers() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <UserManagement />
    </Container>
  )
}
