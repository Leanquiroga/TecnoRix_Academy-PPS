// ============================================
// TEACHER ROUTES - FASE 6.5
// ============================================
// Rutas para aplicaciones y gestión de profesores

import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { authorizeRoles } from '../middleware/roles'
import {
  createTeacherApplication,
  getApplicationStatusEndpoint,
  getPendingApplicationsEndpoint,
  reviewCredential,
  approveTeacherEndpoint,
  getApplicationDetail,
  rejectTeacherApplicationEndpoint
} from '../controllers/teacher.controller'
import { UserRole } from '../types/auth.types'

const router = Router()

// ============================================
// RUTAS PÚBLICAS (sin auth)
// ============================================

// POST /api/teacher/application - Crear solicitud de profesor
router.post('/teacher/application', createTeacherApplication)

// ============================================
// RUTAS PROTEGIDAS (requieren auth)
// ============================================

// GET /api/teacher/application/:id - Ver estado de solicitud (owner o admin)
router.get('/teacher/application/:id', authMiddleware, getApplicationStatusEndpoint)

// ============================================
// RUTAS DE ADMIN (requieren role=admin)
// ============================================

// GET /api/admin/applications - Listar solicitudes pendientes
router.get('/admin/applications', authMiddleware, authorizeRoles(UserRole.ADMIN), getPendingApplicationsEndpoint)

// GET /api/admin/applications/:id - Ver detalle de solicitud
router.get('/admin/applications/:id', authMiddleware, authorizeRoles(UserRole.ADMIN), getApplicationDetail)

// PUT /api/admin/credentials/:id/review - Aprobar/Rechazar credencial
router.put('/admin/credentials/:id/review', authMiddleware, authorizeRoles(UserRole.ADMIN), reviewCredential)

// PUT /api/admin/applications/:id/approve - Aprobar profesor completo
router.put('/admin/applications/:id/approve', authMiddleware, authorizeRoles(UserRole.ADMIN), approveTeacherEndpoint)

// PUT /api/admin/applications/:id/reject - Rechazar solicitud de profesor
router.put('/admin/applications/:id/reject', authMiddleware, authorizeRoles(UserRole.ADMIN), rejectTeacherApplicationEndpoint)

export default router
