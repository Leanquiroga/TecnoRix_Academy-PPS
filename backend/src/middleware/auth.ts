import type { NextFunction, Response } from 'express'
import { verifyToken } from '../utils/jwt.js'
import type { AuthRequest } from '../types/common.types.js'

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Missing token' })
  }

  try {
    const payload = verifyToken(token)
    req.user = payload
    return next()
  } catch {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid token' })
  }
}
