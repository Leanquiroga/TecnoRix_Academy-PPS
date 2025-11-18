import { Container } from '@mui/material'
import TeacherApplicationsList from '../components/admin/TeacherApplicationsList'

export default function AdminUsersPending() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <TeacherApplicationsList />
    </Container>
  )
}
