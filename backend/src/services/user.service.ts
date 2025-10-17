import { supabase, supabaseAdmin } from '../config/supabase'
import type { UserRole, UserStatus } from '../types/auth.types'

export interface CreateUserInput {
  email: string
  password: string
  name: string
  role: UserRole
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getUserByAuthId(authUserId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getUserById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createUser(input: CreateUserInput) {
  // Crear usuario en Supabase Auth (admin API)
  const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name, role: input.role },
  })
  if (authError) throw authError
  const authUser = created.user
  if (!authUser) throw new Error('No se pudo crear el usuario en auth')

  const status: UserStatus = input.role === 'teacher' ? 'pending_validation' as UserStatus : 'active' as UserStatus

  // Insertar perfil en tabla pública
  const { data: profile, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({
      auth_user_id: authUser.id,
      name: input.name,
      email: input.email,
      role: input.role,
      status,
    })
    .select('*')
    .single()

  if (insertError) throw insertError
  return profile
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}
