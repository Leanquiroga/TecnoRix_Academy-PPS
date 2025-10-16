export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student'
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING_VALIDATION = 'pending_validation'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}
