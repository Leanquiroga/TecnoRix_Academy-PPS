// ============================================
// TEACHER TYPES - FASE 6.5
// ============================================
// Tipos para el sistema de aplicación y gestión de profesores

// Tipos de credenciales profesionales
export enum CredentialType {
  DEGREE = 'degree',
  CERTIFICATION = 'certification',
  WORK_EXPERIENCE = 'work_experience'
}

// Estados de verificación de credenciales
export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// ============================================
// INTERFACES DE BASE DE DATOS
// ============================================

export interface TeacherProfile {
  id: string
  user_id: string
  photo_url: string | null
  headline: string
  bio: string
  years_experience: number | null
  linkedin_url: string | null
  phone: string | null
  profile_completed_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface TeacherCredential {
  id: string
  user_id: string
  credential_type: CredentialType
  institution: string
  document_url: string
  year_obtained: number | null
  verification_status: VerificationStatus
  verified_at: string | null
  verified_by: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// ============================================
// REQUEST TYPES
// ============================================

// Request para crear aplicación de profesor (POST /api/teacher/application)
export interface CreateTeacherApplicationRequest {
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
  
  // Step 3: Credenciales (al menos 1 obligatoria)
  credentials: Array<{
    credential_type: CredentialType
    institution: string
    document_url: string
    year_obtained: number
  }>
}

// Request para revisar credencial (PUT /api/admin/credentials/:id/review)
export interface ReviewCredentialRequest {
  verification_status: 'approved' | 'rejected'
  rejection_reason?: string
}

// ============================================
// RESPONSE TYPES
// ============================================

// Response de aplicación con perfil y credenciales
export interface TeacherApplicationResponse {
  user: {
    id: string
    name: string
    email: string
    role: string
    status: string
    created_at: string
  }
  profile: TeacherProfile
  credentials: TeacherCredential[]
}

// Response de solicitudes pendientes para admin
export interface PendingApplicationsResponse {
  applications: Array<{
    user: {
      id: string
      name: string
      email: string
      status: string
      created_at: string
    }
    profile: TeacherProfile
    credentials: TeacherCredential[]
    credentials_count: {
      total: number
      approved: number
      pending: number
      rejected: number
    }
  }>
  total: number
}

// Response de estado de solicitud individual
export interface ApplicationStatusResponse {
  status: string // user status: pending_validation, active, suspended
  submitted_at: string
  credentials: Array<{
    id: string
    credential_type: CredentialType
    institution: string
    verification_status: VerificationStatus
    verified_at: string | null
    rejection_reason: string | null
  }>
  can_be_approved: boolean // true si al menos 1 credencial aprobada
}

// ============================================
// SERVICE INPUT TYPES
// ============================================

export interface CreateTeacherProfileInput {
  user_id: string
  headline: string
  bio: string
  years_experience: number
  linkedin_url?: string
  phone?: string
  photo_url?: string
}

export interface CreateTeacherCredentialInput {
  user_id: string
  credential_type: CredentialType
  institution: string
  document_url: string
  year_obtained: number
}

export interface UpdateCredentialStatusInput {
  credential_id: string
  verification_status: VerificationStatus
  verified_by: string
  rejection_reason?: string
}

// ============================================
// VALIDATION HELPERS
// ============================================

// Constantes de validación
export const TEACHER_VALIDATION = {
  BIO_MIN_LENGTH: 150,
  BIO_MAX_LENGTH: 500,
  MIN_EXPERIENCE_YEARS: 0,
  MAX_EXPERIENCE_YEARS: 50,
  MIN_CREDENTIALS: 1,
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_FILE_TYPES: ['application/pdf'],
  LINKEDIN_REGEX: /^https?:\/\/(www\.)?linkedin\.com\/.+$/
} as const

// Helper para validar URLs de Cloudinary
export function isValidCloudinaryUrl(url: string): boolean {
  return url.startsWith('https://res.cloudinary.com/')
}

// Helper para verificar si todas las credenciales fueron aprobadas
export function allCredentialsApproved(credentials: TeacherCredential[]): boolean {
  return credentials.length > 0 && credentials.every(c => c.verification_status === VerificationStatus.APPROVED)
}

// Helper para verificar si al menos una credencial fue aprobada
export function hasApprovedCredential(credentials: TeacherCredential[]): boolean {
  return credentials.some(c => c.verification_status === VerificationStatus.APPROVED)
}

// Helper para contar credenciales por estado
export function countCredentialsByStatus(credentials: TeacherCredential[]) {
  return {
    total: credentials.length,
    approved: credentials.filter(c => c.verification_status === VerificationStatus.APPROVED).length,
    pending: credentials.filter(c => c.verification_status === VerificationStatus.PENDING).length,
    rejected: credentials.filter(c => c.verification_status === VerificationStatus.REJECTED).length
  }
}
