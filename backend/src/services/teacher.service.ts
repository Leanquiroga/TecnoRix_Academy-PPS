// ============================================
// TEACHER SERVICE - FASE 6.5
// ============================================
// Lógica de negocio para aplicaciones y gestión de profesores

import { supabaseAdmin } from '../config/supabase'
import type {
  TeacherProfile,
  TeacherCredential,
  CreateTeacherProfileInput,
  CreateTeacherCredentialInput,
  TeacherApplicationResponse,
  PendingApplicationsResponse,
  ApplicationStatusResponse
} from '../types/teacher.types'
import { UserStatus } from '../types/auth.types'
import { hasApprovedCredential, countCredentialsByStatus } from '../types/teacher.types'

// ============================================
// TEACHER PROFILES
// ============================================

/**
 * Crear perfil profesional de profesor
 */
export async function createTeacherProfile(input: CreateTeacherProfileInput): Promise<TeacherProfile> {
  const { data, error } = await supabaseAdmin
    .from('teacher_profiles')
    .insert({
      user_id: input.user_id,
      headline: input.headline,
      bio: input.bio,
      years_experience: input.years_experience,
      linkedin_url: input.linkedin_url || null,
      phone: input.phone || null,
      photo_url: input.photo_url || null,
      profile_completed_at: new Date().toISOString()
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Obtener perfil de profesor por user_id
 */
export async function getTeacherProfileByUserId(userId: string): Promise<TeacherProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('teacher_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Actualizar perfil de profesor
 */
export async function updateTeacherProfile(
  userId: string,
  updates: Partial<CreateTeacherProfileInput>
): Promise<TeacherProfile> {
  const { data, error } = await supabaseAdmin
    .from('teacher_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

// ============================================
// TEACHER CREDENTIALS
// ============================================

/**
 * Crear credencial de profesor
 */
export async function createTeacherCredential(
  input: CreateTeacherCredentialInput
): Promise<TeacherCredential> {
  const { data, error } = await supabaseAdmin
    .from('teacher_credentials')
    .insert({
      user_id: input.user_id,
      credential_type: input.credential_type,
      institution: input.institution,
      document_url: input.document_url,
      year_obtained: input.year_obtained,
      verification_status: 'pending'
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Obtener credenciales de un profesor
 */
export async function getTeacherCredentials(userId: string): Promise<TeacherCredential[]> {
  const { data, error } = await supabaseAdmin
    .from('teacher_credentials')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Obtener credencial por ID
 */
export async function getCredentialById(credentialId: string): Promise<TeacherCredential | null> {
  const { data, error } = await supabaseAdmin
    .from('teacher_credentials')
    .select('*')
    .eq('id', credentialId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Actualizar estado de verificación de credencial
 */
export async function updateCredentialStatus(input: {
  credential_id: string
  verification_status: 'approved' | 'rejected' | 'pending'
  verified_by: string
  rejection_reason?: string
}): Promise<TeacherCredential> {
  const updates: any = {
    verification_status: input.verification_status,
    verified_by: input.verified_by,
    verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  if (input.rejection_reason) {
    updates.rejection_reason = input.rejection_reason
  }

  const { data, error } = await supabaseAdmin
    .from('teacher_credentials')
    .update(updates)
    .eq('id', input.credential_id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

// ============================================
// APLICACIONES COMPLETAS
// ============================================

/**
 * Obtener aplicación completa de profesor (user + profile + credentials)
 */
export async function getTeacherApplication(userId: string): Promise<TeacherApplicationResponse | null> {
  // Obtener usuario
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, status, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (userError) throw userError
  if (!user) return null

  // Obtener perfil
  const profile = await getTeacherProfileByUserId(userId)
  if (!profile) return null

  // Obtener credenciales
  const credentials = await getTeacherCredentials(userId)

  return {
    user,
    profile,
    credentials
  }
}

/**
 * Obtener todas las solicitudes pendientes (para admin)
 */
export async function getPendingApplications(): Promise<PendingApplicationsResponse> {
  // Obtener usuarios con status pending_validation y role teacher
  const { data: users, error: usersError } = await supabaseAdmin
    .from('users')
    .select('id, name, email, status, created_at')
    .eq('role', 'teacher')
    .eq('status', 'pending_validation')
    .order('created_at', { ascending: false })

  if (usersError) throw usersError
  if (!users || users.length === 0) {
    return { applications: [], total: 0 }
  }

  // Para cada usuario, obtener perfil y credenciales
  const applications = await Promise.all(
    users.map(async (user) => {
      const profile = await getTeacherProfileByUserId(user.id)
      const credentials = await getTeacherCredentials(user.id)

      return {
        user,
        profile: profile!,
        credentials,
        credentials_count: countCredentialsByStatus(credentials)
      }
    })
  )

  // Filtrar aplicaciones que tienen perfil
  const validApplications = applications.filter(app => app.profile !== null)

  return {
    applications: validApplications,
    total: validApplications.length
  }
}

/**
 * Obtener estado de aplicación de profesor
 */
export async function getApplicationStatus(userId: string): Promise<ApplicationStatusResponse | null> {
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('status, created_at')
    .eq('id', userId)
    .eq('role', 'teacher')
    .maybeSingle()

  if (userError) throw userError
  if (!user) return null

  const credentials = await getTeacherCredentials(userId)

  return {
    status: user.status,
    submitted_at: user.created_at,
    credentials: credentials.map(c => ({
      id: c.id,
      credential_type: c.credential_type,
      institution: c.institution,
      verification_status: c.verification_status,
      verified_at: c.verified_at,
      rejection_reason: c.rejection_reason
    })),
    can_be_approved: hasApprovedCredential(credentials)
  }
}

// ============================================
// APROBACIÓN DE PROFESORES
// ============================================

/**
 * Aprobar profesor completo
 * Prerequisito: Al menos 1 credencial debe estar aprobada
 */
export async function approveTeacher(userId: string, adminId: string): Promise<void> {
  // Verificar que tenga al menos 1 credencial aprobada
  const credentials = await getTeacherCredentials(userId)
  
  if (!hasApprovedCredential(credentials)) {
    throw new Error('El profesor debe tener al menos 1 credencial aprobada')
  }

  // Actualizar status del usuario a active
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      status: UserStatus.ACTIVE,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (updateError) throw updateError

  // Opcional: Marcar todas las credenciales pendientes como aprobadas
  const pendingCredentials = credentials.filter(c => c.verification_status === 'pending')
  
  if (pendingCredentials.length > 0) {
    await Promise.all(
      pendingCredentials.map(c =>
        updateCredentialStatus({
          credential_id: c.id,
          verification_status: 'approved',
          verified_by: adminId
        })
      )
    )
  }
}

/**
 * Rechazar aplicación de profesor
 */
export async function rejectTeacherApplication(
  userId: string,
  adminId: string,
  reason: string
): Promise<void> {
  // Marcar todas las credenciales como rechazadas
  const credentials = await getTeacherCredentials(userId)
  
  await Promise.all(
    credentials.map(c =>
      updateCredentialStatus({
        credential_id: c.id,
        verification_status: 'rejected',
        verified_by: adminId,
        rejection_reason: reason
      })
    )
  )

  // Opcional: Actualizar status del usuario a suspended o mantener pending
  // (Decisión de negocio: mantener pending para que pueda corregir)
}
