import jwt from 'jsonwebtoken'
import type { AuthPayload } from '../types/auth.types.js'
import type { SignOptions, Secret } from 'jsonwebtoken'

const JWT_SECRET: Secret = (process.env.JWT_SECRET ?? 'change_me') as Secret
const DEFAULT_EXPIRES_IN: SignOptions['expiresIn'] = (process.env.JWT_EXPIRES_IN as any) ?? '7d'

export function signToken(payload: AuthPayload, options: SignOptions = {}): string {
  const opts: SignOptions = { expiresIn: DEFAULT_EXPIRES_IN, ...options }
  return jwt.sign(payload, JWT_SECRET, opts)
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload
}
