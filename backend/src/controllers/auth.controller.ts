import type { Request, Response } from 'express'
import { signToken } from '../utils/jwt'
import type { AuthRequest } from '../types/common.types'
import type { RegisterRequest, LoginRequest } from '../types/auth.types'
import { UserRole, UserStatus } from '../types/auth.types'
import { createUser, getUserByAuthId, getUserByEmail, getUserById, signInWithPassword } from '../services/user.service'
import { supabaseAdmin } from '../config/supabase'

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, role } = req.body as RegisterRequest

    // Validaciones básicas
    if (!email || !password || !name || !role) {
      return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' })
    }
    // Validar formato de email
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Email inválido' })
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' })
    }
    if (name.length < 2) {
      return res.status(400).json({ success: false, error: 'El nombre es demasiado corto' })
    }
    const allowedRoles: UserRole[] = [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Rol inválido' })
    }

    // FASE 6.5: Rechazar registro directo como teacher (debe usar /api/teacher/application)
    if (role === UserRole.TEACHER) {
      return res.status(400).json({ 
        success: false, 
        error: 'Para registrarte como profesor, usa el formulario de aplicación en /register/teacher' 
      })
    }

    // Evitar duplicados en la tabla de perfiles
    const existing = await getUserByEmail(email)
    if (existing) {
      return res.status(409).json({ success: false, error: 'El email ya está registrado' })
    }

    // Validar que no exista en Supabase Auth
    try {
      // Si existe, signInWithPassword no lanzará error de usuario no encontrado, pero sí de credenciales
      await signInWithPassword(email, password)
      // Si no lanza error, el usuario ya existe en Auth
      return res.status(409).json({ success: false, error: 'El email ya está registrado en el sistema' })
    } catch (e: any) {
      // Si el error es "Invalid login credentials", entonces no existe en Auth
      if (e?.message && !e.message.toLowerCase().includes('invalid login credentials')) {
        // Otro error inesperado
        return res.status(400).json({ success: false, error: 'Error al validar usuario en Auth' })
      }
    }

    const profile = await createUser({ email, password, name, role })

    const token = signToken({ userId: profile.id, email: profile.email, role: profile.role })
    return res.status(201).json({ success: true, data: { user: profile, token } })
  } catch (err: any) {
    const msg = err?.message || 'Error en el registro'
    return res.status(400).json({ success: false, error: msg })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as LoginRequest
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña requeridos' })
    }
    // Validar formato de email
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Email inválido' })
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    let userAuth
    try {
      const { user } = await signInWithPassword(email, password)
      userAuth = user
    } catch (e: any) {
      // Si el error es "Invalid login credentials", devolver 401
      if (e?.message && e.message.toLowerCase().includes('invalid login credentials')) {
        return res.status(401).json({ success: false, error: 'Credenciales inválidas' })
      }
      return res.status(400).json({ success: false, error: 'Error al autenticar' })
    }
    if (!userAuth) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' })
    }

    const profile = await getUserByAuthId(userAuth.id)
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Perfil de usuario no encontrado' })
    }

    // Validar si el usuario está suspendido
    if (profile.status === UserStatus.SUSPENDED) {
      return res.status(403).json({ success: false, error: 'Usuario suspendido. Contacta al administrador.' })
    }

    const token = signToken({ userId: profile.id, email: profile.email, role: profile.role })
    const message = profile.role === UserRole.TEACHER && profile.status === UserStatus.PENDING_VALIDATION
      ? 'Tu cuenta de profesor está pendiente de aprobación. El acceso a creación y gestión de cursos se habilitará tras la validación.'
      : undefined
    return res.json({ success: true, data: { user: profile, token }, message })
  } catch (err: any) {
    const msg = err?.message || 'Error en el login'
    return res.status(400).json({ success: false, error: msg })
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' })
    const profile = await getUserById(req.user.userId)
    if (!profile) return res.status(404).json({ success: false, error: 'User not found' })
    return res.json({ success: true, data: profile })
  } catch (err: any) {
    const msg = err?.message || 'Failed to get profile'
    return res.status(400).json({ success: false, error: msg })
  }
}

export async function refresh(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' })
    // Volver a emitir un token con nueva expiración
    const profile = await getUserById(req.user.userId)
    if (!profile) return res.status(404).json({ success: false, error: 'User not found' })
    const token = signToken({ userId: profile.id, email: profile.email, role: profile.role })
    return res.json({ success: true, data: { token } })
  } catch (err: any) {
    const msg = err?.message || 'Failed to refresh token'
    return res.status(400).json({ success: false, error: msg })
  }
}

// ============================================
// PASSWORD RECOVERY - FASE 6.6
// ============================================

/**
 * POST /api/auth/forgot-password
 * Envía email de recuperación de contraseña usando Supabase Auth
 */
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email es obligatorio' 
      })
    }

    // Validar formato de email
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email inválido' 
      })
    }

    // Verificar que el usuario existe en nuestra BD
    const user = await getUserByEmail(email)
    if (!user) {
      // Por seguridad, no revelar si el email existe o no
      return res.json({ 
        success: true, 
        message: 'Si el email existe, recibirás un link de recuperación' 
      })
    }

    // Enviar email de recuperación usando Supabase Auth
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`,
    })

    if (error) {
      console.error('Error sending password reset email:', error)
      return res.status(500).json({ 
        success: false, 
        error: 'Error al enviar el email de recuperación' 
      })
    }

    return res.json({ 
      success: true, 
      message: 'Si el email existe, recibirás un link de recuperación' 
    })
  } catch (err: any) {
    console.error('Forgot password error:', err)
    return res.status(500).json({ 
      success: false, 
      error: 'Error al procesar la solicitud' 
    })
  }
}

/**
 * POST /api/auth/reset-password
 * Actualiza la contraseña usando el token recibido por email
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    const { access_token, newPassword } = req.body

    if (!access_token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token y nueva contraseña son obligatorios' 
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      })
    }

    // Crear cliente de Supabase con el token del usuario
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(access_token)
    
    if (userError || !userData.user) {
      console.error('Error verifying token:', userError)
      return res.status(400).json({ 
        success: false, 
        error: 'Token inválido o expirado' 
      })
    }

    // Actualizar la contraseña usando el admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return res.status(500).json({ 
        success: false, 
        error: 'Error al actualizar la contraseña' 
      })
    }

    return res.json({ 
      success: true, 
      message: 'Contraseña actualizada exitosamente' 
    })
  } catch (err: any) {
    console.error('Reset password error:', err)
    return res.status(500).json({ 
      success: false, 
      error: 'Error al restablecer la contraseña' 
    })
  }
}
