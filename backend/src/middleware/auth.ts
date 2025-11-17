import type { NextFunction, Response } from 'express'
import { verifyToken } from '../utils/jwt'
import type { AuthRequest } from '../types/common.types'
import { getUserById } from '../services/user.service'
import { UserStatus } from '../types/auth.types'

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Missing token' })
  }

  try {
    const payload = verifyToken(token)
    req.user = payload

    // Cargar perfil para validar estado
    const profile = await getUserById(payload.userId)
    if (!profile) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: 'User not found' })
    }

    // Bloquear usuarios suspendidos en cualquier endpoint protegido
    if (profile.status === UserStatus.SUSPENDED) {
      return res.status(403).json({ success: false, error: 'Usuario suspendido', message: 'Tu cuenta está suspendida. Contacta al administrador.' })
    }

    // Bloquear teachers pendientes excepto en endpoints de auth y teacher application
    const isAuthRoute = req.path.startsWith('/api/auth') || req.path.startsWith('/login') || req.path.startsWith('/register')
    const isTeacherApplicationRoute = req.path.startsWith('/api/teacher/application') || req.path.startsWith('/teacher/application')
    
    if (profile.status === UserStatus.PENDING_VALIDATION && !isAuthRoute && !isTeacherApplicationRoute) {
      return res.status(403).json({ success: false, error: 'Usuario pendiente de aprobación', message: 'Tu cuenta de profesor aún no ha sido aprobada.' })
    }

    return next()
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid token' })
  }
}
