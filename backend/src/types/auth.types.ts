export interface User {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  status: 'active' | 'pending_validation' | 'suspended';
  avatar_url?: string;
  bio?: string;
  country?: string;
  verified_at?: Date;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role?: 'teacher' | 'student';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}