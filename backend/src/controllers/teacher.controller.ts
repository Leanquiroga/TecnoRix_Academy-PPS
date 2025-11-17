// ============================================
// TEACHER CONTROLLER - FASE 6.5
// ============================================
// Endpoints HTTP para aplicaciones y gestión de profesores

import type { Request, Response } from 'express'
import type { AuthRequest } from '../types/common.types'
import type { CreateTeacherApplicationRequest, ReviewCredentialRequest } from '../types/teacher.types'
import { UserRole, UserStatus } from '../types/auth.types'
import { TEACHER_VALIDATION, isValidCloudinaryUrl } from '../types/teacher.types'
import { createUser } from '../services/user.service'
import {
  createTeacherProfile,
  createTeacherCredential,
  getTeacherApplication,
  getPendingApplications,
  getApplicationStatus,
  getCredentialById,
  updateCredentialStatus,
  approveTeacher
} from '../services/teacher.service'

// ============================================
// ENDPOINT: POST /api/teacher/application
// Crear solicitud de profesor (público, sin auth)
// ============================================
export async function createTeacherApplication(req: Request, res: Response) {
  try {
    const body = req.body as CreateTeacherApplicationRequest

    // ====================================
    // VALIDACIONES
    // ====================================

    // Step 1: Validar campos básicos
    if (!body.name || !body.email || !body.password || !body.phone) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos obligatorios: name, email, password, phone'
      })
    }

    // Validar email
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
    if (!emailRegex.test(body.email)) {
      return res.status(400).json({ success: false, error: 'Email inválido' })
    }

    // Validar password
    if (body.password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      })
    }

    // Step 2: Validar perfil profesional
    if (!body.headline || !body.bio || body.years_experience === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos del perfil: headline, bio, years_experience'
      })
    }

    // Validar bio length
    if (
      body.bio.length < TEACHER_VALIDATION.BIO_MIN_LENGTH ||
      body.bio.length > TEACHER_VALIDATION.BIO_MAX_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        error: `La biografía debe tener entre ${TEACHER_VALIDATION.BIO_MIN_LENGTH} y ${TEACHER_VALIDATION.BIO_MAX_LENGTH} caracteres`
      })
    }

    // Validar years_experience
    if (
      body.years_experience < TEACHER_VALIDATION.MIN_EXPERIENCE_YEARS ||
      body.years_experience > TEACHER_VALIDATION.MAX_EXPERIENCE_YEARS
    ) {
      return res.status(400).json({
        success: false,
        error: `Los años de experiencia deben estar entre ${TEACHER_VALIDATION.MIN_EXPERIENCE_YEARS} y ${TEACHER_VALIDATION.MAX_EXPERIENCE_YEARS}`
      })
    }

    // Validar LinkedIn URL (opcional)
    if (body.linkedin_url && !TEACHER_VALIDATION.LINKEDIN_REGEX.test(body.linkedin_url)) {
      return res.status(400).json({
        success: false,
        error: 'URL de LinkedIn inválida'
      })
    }

    // Step 3: Validar credenciales
    if (!body.credentials || !Array.isArray(body.credentials)) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar un array de credenciales'
      })
    }

    if (body.credentials.length < TEACHER_VALIDATION.MIN_CREDENTIALS) {
      return res.status(400).json({
        success: false,
        error: `Debe proporcionar al menos ${TEACHER_VALIDATION.MIN_CREDENTIALS} credencial`
      })
    }

    // Validar cada credencial
    for (const cred of body.credentials) {
      if (!cred.credential_type || !cred.institution || !cred.document_url || !cred.year_obtained) {
        return res.status(400).json({
          success: false,
          error: 'Cada credencial debe tener: credential_type, institution, document_url, year_obtained'
        })
      }

      // Validar que document_url sea de Cloudinary
      if (!isValidCloudinaryUrl(cred.document_url)) {
        return res.status(400).json({
          success: false,
          error: 'El documento debe estar alojado en Cloudinary'
        })
      }
    }

    // ====================================
    // CREAR USUARIO, PERFIL Y CREDENCIALES
    // ====================================

    // 1. Crear usuario en users (con role=teacher, status=pending_validation)
    let user
    try {
      user = await createUser({
        email: body.email,
        password: body.password,
        name: body.name,
        role: UserRole.TEACHER // Force teacher role
      })
    } catch (error: any) {
      // Manejar email duplicado específicamente
      if (error?.message?.includes('already') || error?.code === '23505') {
        return res.status(400).json({
          success: false,
          error: 'El email ya está registrado'
        })
      }
      throw error // Re-throw otros errores
    }

    // 2. Crear perfil en teacher_profiles
    await createTeacherProfile({
      user_id: user.id,
      headline: body.headline,
      bio: body.bio,
      years_experience: body.years_experience,
      linkedin_url: body.linkedin_url,
      phone: body.phone,
      photo_url: body.photo_url
    })

    // 3. Crear credenciales en teacher_credentials
    await Promise.all(
      body.credentials.map(cred =>
        createTeacherCredential({
          user_id: user.id,
          credential_type: cred.credential_type,
          institution: cred.institution,
          document_url: cred.document_url,
          year_obtained: cred.year_obtained
        })
      )
    )

    // IMPORTANTE: NO generar JWT token
    // El profesor no puede hacer login hasta ser aprobado

    return res.status(201).json({
      success: true,
      message: 'Solicitud enviada exitosamente. Tu aplicación será revisada en 48-72 horas.',
      data: {
        user_id: user.id,
        email: user.email,
        status: user.status
      }
    })
  } catch (error: any) {
    console.error('Error creating teacher application:', error)
    return res.status(400).json({
      success: false,
      error: error?.message || 'Error al crear solicitud de profesor'
    })
  }
}

// ============================================
// ENDPOINT: GET /api/teacher/application/:id
// Ver estado de solicitud (profesor owner o admin)
// ============================================
export async function getApplicationStatusEndpoint(req: AuthRequest, res: Response) {
  try {
    const { id: userId } = req.params

    // Verificar que el usuario autenticado sea el owner o admin
    if (req.user?.userId !== userId && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para ver esta solicitud'
      })
    }

    const status = await getApplicationStatus(userId)

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      })
    }

    return res.json({
      success: true,
      data: status
    })
  } catch (error: any) {
    console.error('Error getting application status:', error)
    return res.status(500).json({
      success: false,
      error: 'Error al obtener estado de solicitud'
    })
  }
}

// ============================================
// ENDPOINT: GET /api/admin/applications
// Listar solicitudes pendientes (solo admin)
// ============================================
export async function getPendingApplicationsEndpoint(_req: AuthRequest, res: Response) {
  try {
    // Ya verificado por middleware de admin
    const applications = await getPendingApplications()

    return res.json({
      success: true,
      data: applications
    })
  } catch (error: any) {
    console.error('Error getting pending applications:', error)
    return res.status(500).json({
      success: false,
      error: 'Error al obtener solicitudes pendientes'
    })
  }
}

// ============================================
// ENDPOINT: PUT /api/admin/credentials/:id/review
// Aprobar/Rechazar credencial individual (solo admin)
// ============================================
export async function reviewCredential(req: AuthRequest, res: Response) {
  try {
    const { id: credentialId } = req.params
    const body = req.body as ReviewCredentialRequest

    // Validar body
    if (!body.verification_status || !['approved', 'rejected'].includes(body.verification_status)) {
      return res.status(400).json({
        success: false,
        error: 'verification_status debe ser "approved" o "rejected"'
      })
    }

    if (body.verification_status === 'rejected' && !body.rejection_reason) {
      return res.status(400).json({
        success: false,
        error: 'rejection_reason es obligatorio al rechazar'
      })
    }

    // Verificar que la credencial existe
    const credential = await getCredentialById(credentialId)
    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credencial no encontrada'
      })
    }

    // Actualizar estado de credencial
    const updated = await updateCredentialStatus({
      credential_id: credentialId,
      verification_status: body.verification_status as 'approved' | 'rejected',
      verified_by: req.user!.userId,
      rejection_reason: body.rejection_reason
    })

    return res.json({
      success: true,
      message: `Credencial ${body.verification_status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`,
      data: updated
    })
  } catch (error: any) {
    console.error('Error reviewing credential:', error)
    return res.status(500).json({
      success: false,
      error: 'Error al revisar credencial'
    })
  }
}

// ============================================
// ENDPOINT: PUT /api/admin/applications/:id/approve
// Aprobar profesor completo (solo admin)
// ============================================
export async function approveTeacherEndpoint(req: AuthRequest, res: Response) {
  try {
    const { id: userId } = req.params

    // Verificar que el usuario existe y es teacher
    const application = await getTeacherApplication(userId)
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud de profesor no encontrada'
      })
    }

    if (application.user.role !== UserRole.TEACHER) {
      return res.status(400).json({
        success: false,
        error: 'El usuario no es un profesor'
      })
    }

    if (application.user.status !== UserStatus.PENDING_VALIDATION) {
      return res.status(400).json({
        success: false,
        error: 'El profesor no está pendiente de validación'
      })
    }

    // Aprobar profesor (verifica internamente que tenga al menos 1 credencial aprobada)
    await approveTeacher(userId, req.user!.userId)

    return res.json({
      success: true,
      message: 'Profesor aprobado exitosamente. Ahora puede iniciar sesión y crear cursos.'
    })
  } catch (error: any) {
    console.error('Error approving teacher:', error)
    return res.status(400).json({
      success: false,
      error: error?.message || 'Error al aprobar profesor'
    })
  }
}

// ============================================
// ENDPOINT: GET /api/admin/applications/:id
// Ver detalle completo de aplicación (solo admin)
// ============================================
export async function getApplicationDetail(req: AuthRequest, res: Response) {
  try {
    const { id: userId } = req.params

    const application = await getTeacherApplication(userId)

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      })
    }

    return res.json({
      success: true,
      data: application
    })
  } catch (error: any) {
    console.error('Error getting application detail:', error)
    return res.status(500).json({
      success: false,
      error: 'Error al obtener detalle de solicitud'
    })
  }
}
