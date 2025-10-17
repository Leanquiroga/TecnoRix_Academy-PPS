import type { NextFunction, Response } from 'express'
import type { AuthRequest } from '../types/common.types'
import type { UserRole } from '../types/auth.types'

export function authorizeRoles(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    next()
  }
}
