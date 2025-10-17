import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { authorizeRoles } from '../middleware/roles'
import { UserRole } from '../types/auth.types'
import { approveTeacher, changeUserRole, getUsers, suspendUser } from '../controllers/admin.controller'

const router = Router()

// Todas las rutas requieren autenticación y rol de admin
router.use(authMiddleware)
router.use(authorizeRoles(UserRole.ADMIN))

// GET /api/admin/users - Listar todos los usuarios (con filtros opcionales)
router.get('/users', getUsers)

// PUT /api/admin/users/:id/approve - Aprobar un teacher pendiente
router.put('/users/:id/approve', approveTeacher)

// PUT /api/admin/users/:id/role - Cambiar rol de un usuario
router.put('/users/:id/role', changeUserRole)

// PUT /api/admin/users/:id/suspend - Suspender/activar un usuario
router.put('/users/:id/suspend', suspendUser)

export default router
