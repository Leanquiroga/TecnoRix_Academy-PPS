export const TOKEN_KEY = 'trix_auth_token'
export const API_URL = import.meta.env.VITE_API_URL || '/api'
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const
