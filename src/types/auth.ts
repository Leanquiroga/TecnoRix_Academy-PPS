export type Role = 'admin' | 'teacher' | 'student'

export type UserStatus = 'active' | 'suspended' | 'pending_validation'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  status: UserStatus
  avatar_url?: string
  bio?: string | null
  country?: string | null
  last_login?: string | null
  verified_at?: string | null
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  name: string
  role: Role
}
