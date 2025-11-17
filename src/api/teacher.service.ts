// ============================================
// TEACHER SERVICE - FASE 6.5
// ============================================
// API calls para sistema de inscripción de profesores

import http from './http'

// ============================================
// TYPES
// ============================================

export interface TeacherCredentialInput {
  credential_type: 'degree' | 'certification' | 'work_experience'
  institution: string
  document_url: string
  year_obtained: number
}

export interface CreateTeacherApplicationData {
  // Step 1: Información básica
  name: string
  email: string
  password: string
  phone: string
  
  // Step 2: Perfil profesional
  headline: string
  bio: string
  years_experience: number
  linkedin_url?: string
  photo_url?: string
  
  // Step 3: Credenciales
  credentials: TeacherCredentialInput[]
}

export interface TeacherCredential {
  id: string
  user_id: string
  credential_type: 'degree' | 'certification' | 'work_experience'
  institution: string
  document_url: string
  year_obtained: number
  verification_status: 'pending' | 'approved' | 'rejected'
  verified_at?: string
  verified_by?: string
  rejection_reason?: string
  created_at: string
}

export interface TeacherProfile {
  id: string
  user_id: string
  photo_url?: string
  headline: string
  bio: string
  years_experience: number
  linkedin_url?: string
  phone: string
  profile_completed_at?: string
  created_at: string
}

export interface TeacherApplication {
  user_id: string
  name: string
  email: string
  status: 'pending_validation' | 'active' | 'rejected' | 'suspended'
  role: string
  created_at: string
  profile?: TeacherProfile
  credentials?: TeacherCredential[]
}

export interface ApplicationStatusResponse {
  success: boolean
  data: {
    status: string
    application: TeacherApplication
  }
}

export interface PendingApplicationsResponse {
  success: boolean
  data: {
    applications: TeacherApplication[]
    total: number
  }
}

export interface ReviewCredentialData {
  verification_status: 'approved' | 'rejected'
  rejection_reason?: string
}

// ============================================
// API CALLS
// ============================================

/**
 * Crear solicitud de profesor (público, sin auth)
 * POST /api/teacher/application
 */
export async function createTeacherApplication(data: CreateTeacherApplicationData) {
  const response = await http.post('/teacher/application', data)
  return response.data
}

/**
 * Ver estado de solicitud de profesor (requiere auth)
 * GET /api/teacher/application/:id
 */
export async function getApplicationStatus(userId: string): Promise<ApplicationStatusResponse> {
  const response = await http.get(`/teacher/application/${userId}`)
  return response.data
}

/**
 * Listar solicitudes pendientes (admin only)
 * GET /api/admin/applications
 */
export async function getPendingApplications(status?: string): Promise<PendingApplicationsResponse> {
  const params = status ? { status } : {}
  const response = await http.get('/admin/applications', { params })
  return response.data
}

/**
 * Ver detalle de solicitud (admin only)
 * GET /api/admin/applications/:id
 */
export async function getApplicationDetail(userId: string): Promise<ApplicationStatusResponse> {
  const response = await http.get(`/admin/applications/${userId}`)
  return response.data
}

/**
 * Aprobar/Rechazar credencial individual (admin only)
 * PUT /api/admin/credentials/:id/review
 */
export async function reviewCredential(
  credentialId: string,
  data: ReviewCredentialData
) {
  const response = await http.put(`/admin/credentials/${credentialId}/review`, data)
  return response.data
}

/**
 * Aprobar profesor completo (admin only)
 * PUT /api/admin/applications/:id/approve
 */
export async function approveTeacher(userId: string) {
  const response = await http.put(`/admin/applications/${userId}/approve`)
  return response.data
}

/**
 * Rechazar solicitud de profesor (admin only)
 * PUT /api/admin/applications/:id/reject
 */
export async function rejectTeacherApplication(userId: string, reason: string) {
  const response = await http.put(`/admin/applications/${userId}/reject`, { reason })
  return response.data
}
