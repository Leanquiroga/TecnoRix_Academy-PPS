import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.config';
import { RegisterDTO, LoginDTO, User, AuthResponse } from '../types/auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

export const register = async ({ name, email, password, role = 'student' }: RegisterDTO) => {
  // Create user in Supabase auth first
  const { data: signUpData, error: signUpErr } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { name }
  });

  if (signUpErr) throw new Error(signUpErr.message);

  // Insert profile into users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([{
      name,
      email,
      role,
      status: role === 'teacher' ? 'pending_validation' : 'active',
      auth_user_id: signUpData.user.id
    }])
    .select()
    .single();

  if (userError) throw new Error(userError.message);

  const token = generateTokens(userData);
  return { user: userData, ...token };
};

export const login = async ({ email, password }: LoginDTO): Promise<AuthResponse> => {
  // Attempt sign in with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) throw new Error(authError.message);

  // Get user profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (userError) throw new Error(userError.message);

  // Check user status
  if (userData.status === 'suspended') {
    throw new Error('Usuario suspendido');
  }

  if (userData.status === 'pending_validation' && userData.role === 'teacher') {
    throw new Error('Profesor pendiente de validación');
  }

  // Update last login
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userData.id);

  const tokens = generateTokens(userData);
  return { user: userData, ...tokens };
};

export const refresh = async (refreshToken: string): Promise<AuthResponse> => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.sub)
      .single();

    if (userError) throw new Error('Usuario no encontrado');

    // Check user status
    if (userData.status !== 'active') {
      throw new Error('Usuario no activo');
    }

    const tokens = generateTokens(userData);
    return { user: userData, ...tokens };
  } catch (err) {
    throw new Error('Invalid refresh token');
  }
};

function generateTokens(user: User) {
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { sub: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { token, refreshToken };
}
