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

// Nuevo listado con paginación y búsqueda
export async function listUsers(
  page = 1,
  limit = 20,
  search?: string,
  role?: UserRole,
  status?: UserStatus
): Promise<{ users: any[]; total: number }> { // `any[]` para no romper importadores existentes; ideal tipar User
  const validPage = Math.max(1, page)
  const validLimit = Math.min(Math.max(1, limit), 100) // defensa: máximo 100 por página
  const offset = (validPage - 1) * validLimit

  // Query base para conteo
  let countQuery = supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Query base para datos
  let dataQuery = supabaseAdmin
    .from('users')
    .select('*')

  if (role) {
    countQuery = countQuery.eq('role', role)
    dataQuery = dataQuery.eq('role', role)
  }
  if (status) {
    countQuery = countQuery.eq('status', status)
    dataQuery = dataQuery.eq('status', status)
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    // Búsqueda por nombre o email (case-insensitive)
    countQuery = countQuery.or(`name.ilike.${term},email.ilike.${term}`)
    dataQuery = dataQuery.or(`name.ilike.${term},email.ilike.${term}`)
  }

  const { count, error: countError } = await countQuery
  if (countError) throw countError

  const { data, error } = await dataQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + validLimit - 1)

  if (error) throw error

  return {
    users: data || [],
    total: count || 0,
  }
}

export async function updateUserStatus(userId: string, status: UserStatus) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Actualizar perfil (name, bio, country, avatar_url)
export async function updateUserProfile(userId: string, updates: {
  name?: string
  bio?: string | null
  country?: string | null
  avatar_url?: string | null
}) {
  // Construir objeto limpio sin undefined
  const payload: Record<string, any> = {}
  if (typeof updates.name === 'string') payload.name = updates.name
  if (typeof updates.bio === 'string' || updates.bio === null) payload.bio = updates.bio
  if (typeof updates.country === 'string' || updates.country === null) payload.country = updates.country
  if (typeof updates.avatar_url === 'string' || updates.avatar_url === null) payload.avatar_url = updates.avatar_url
  payload.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}
