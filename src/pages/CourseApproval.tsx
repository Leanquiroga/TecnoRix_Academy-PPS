import { Container } from '@mui/material'
import CourseManagement from '../components/admin/CourseManagement'

export function CourseApproval() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <CourseManagement />
    </Container>
  )
}

export default CourseApproval
