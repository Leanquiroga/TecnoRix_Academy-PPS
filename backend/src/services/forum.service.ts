/**
 * Servicio para gestión de foros
 */

import { supabaseAdmin } from '../config/supabase'
import type {
  ForumPost,
  ForumReply,
  ForumPostWithAuthor,
  ForumReplyWithAuthor,
  CreateForumPostDTO,
  CreateForumReplyDTO,
  UpdateForumPostDTO,
  UpdateForumReplyDTO,
} from '../types/forum.types'

/**
 * Verificar si un usuario está inscrito en un curso
 */
export async function checkEnrollment(userId: string, courseId: string): Promise<boolean> {
  console.log('[ForumService] checkEnrollment', userId, courseId)
  
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select('id, status')
    .eq('student_id', userId)
    .eq('course_id', courseId)
    .single()

  if (error || !data) {
    return false
  }

  // Solo permitir si está activo o completado
  return data.status === 'active' || data.status === 'completed'
}

/**
 * Verificar si un usuario es el profesor del curso
 */
export async function checkIsTeacher(userId: string, courseId: string): Promise<boolean> {
  console.log('[ForumService] checkIsTeacher', userId, courseId)
  
  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('teacher_id')
    .eq('id', courseId)
    .single()

  if (error || !data) {
    return false
  }

  return data.teacher_id === userId
}

/**
 * Verificar si un usuario puede acceder al foro de un curso
 * (debe estar inscrito o ser el profesor)
 */
export async function canAccessForum(userId: string, courseId: string): Promise<boolean> {
  const isEnrolled = await checkEnrollment(userId, courseId)
  const isTeacher = await checkIsTeacher(userId, courseId)
  
  return isEnrolled || isTeacher
}

/**
 * Crear un post en el foro
 */
export async function createForumPost(
  userId: string,
  input: CreateForumPostDTO
): Promise<ForumPostWithAuthor> {
  console.log('[ForumService] createForumPost', userId, input.course_id)

  // Verificar acceso al foro
  const hasAccess = await canAccessForum(userId, input.course_id)
  if (!hasAccess) {
    throw new Error('No tienes acceso a este foro. Debes estar inscrito en el curso.')
  }

  // Crear el post
  const { data: post, error: postError } = await supabaseAdmin
    .from('forum_posts')
    .insert({
      course_id: input.course_id,
      user_id: userId,
      title: input.title,
      message: input.message,
      is_pinned: false,
    })
    .select()
    .single()

  if (postError || !post) {
    throw postError || new Error('Error al crear el post')
  }

  // Obtener información del autor
  const { data: author, error: authorError } = await supabaseAdmin
    .from('users')
    .select('id, name, email, avatar_url, role')
    .eq('id', userId)
    .single()

  if (authorError || !author) {
    throw authorError || new Error('Error al obtener información del autor')
  }

  return {
    ...post,
    author,
    replies_count: 0,
  } as ForumPostWithAuthor
}

/**
 * Listar posts de un curso
 */
export async function listForumPosts(courseId: string): Promise<ForumPostWithAuthor[]> {
  console.log('[ForumService] listForumPosts', courseId)

  // Obtener posts
  const { data: posts, error: postsError } = await supabaseAdmin
    .from('forum_posts')
    .select('*')
    .eq('course_id', courseId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (postsError) {
    throw postsError
  }

  if (!posts || posts.length === 0) {
    return []
  }

  // Obtener autores
  const userIds = [...new Set(posts.map(p => p.user_id))]
  const { data: authors, error: authorsError } = await supabaseAdmin
    .from('users')
    .select('id, name, email, avatar_url, role')
    .in('id', userIds)

  if (authorsError) {
    throw authorsError
  }

  // Obtener cantidad de respuestas por post
  const postIds = posts.map(p => p.id)
  const { data: repliesCounts, error: repliesError } = await supabaseAdmin
    .from('forum_replies')
    .select('post_id')
    .in('post_id', postIds)

  if (repliesError) {
    throw repliesError
  }

  // Contar respuestas por post
  const repliesCountMap = new Map<string, number>()
  if (repliesCounts) {
    repliesCounts.forEach(reply => {
      const count = repliesCountMap.get(reply.post_id) || 0
      repliesCountMap.set(reply.post_id, count + 1)
    })
  }

  // Crear mapa de autores
  const authorsMap = new Map(authors?.map(a => [a.id, a]) || [])

  // Combinar datos
  return posts.map(post => ({
    ...post,
    author: authorsMap.get(post.user_id) || {
      id: post.user_id,
      name: 'Usuario desconocido',
      email: '',
      avatar_url: null,
      role: 'student',
    },
    replies_count: repliesCountMap.get(post.id) || 0,
  })) as ForumPostWithAuthor[]
}

/**
 * Obtener un post específico
 */
export async function getForumPost(postId: string): Promise<ForumPostWithAuthor> {
  console.log('[ForumService] getForumPost', postId)

  const { data: post, error: postError } = await supabaseAdmin
    .from('forum_posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (postError || !post) {
    // Mapear error de no encontrado de PostgREST a un mensaje consistente
    if ((postError as any)?.code === 'PGRST116') {
      throw new Error('Post no encontrado')
    }
    throw postError || new Error('Post no encontrado')
  }

  // Obtener autor
  const { data: author, error: authorError } = await supabaseAdmin
    .from('users')
    .select('id, name, email, avatar_url, role')
    .eq('id', post.user_id)
    .single()

  if (authorError || !author) {
    throw authorError || new Error('Error al obtener información del autor')
  }

  // Contar respuestas
  const { count, error: countError } = await supabaseAdmin
    .from('forum_replies')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  if (countError) {
    throw countError
  }

  return {
    ...post,
    author,
    replies_count: count || 0,
  } as ForumPostWithAuthor
}

/**
 * Actualizar un post
 */
export async function updateForumPost(
  postId: string,
  userId: string,
  input: UpdateForumPostDTO
): Promise<ForumPost> {
  console.log('[ForumService] updateForumPost', postId, userId)

  // Verificar que el post existe y pertenece al usuario
  const { data: post, error: checkError } = await supabaseAdmin
    .from('forum_posts')
    .select('user_id')
    .eq('id', postId)
    .single()

  if (checkError || !post) {
    throw checkError || new Error('Post no encontrado')
  }

  if (post.user_id !== userId) {
    throw new Error('No tienes permiso para editar este post')
  }

  // Actualizar
  const { data, error } = await supabaseAdmin
    .from('forum_posts')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .select()
    .single()

  if (error || !data) {
    throw error || new Error('Error al actualizar el post')
  }

  return data as ForumPost
}

/**
 * Eliminar un post
 */
export async function deleteForumPost(postId: string, userId: string): Promise<void> {
  console.log('[ForumService] deleteForumPost', postId, userId)

  // Verificar que el post existe y pertenece al usuario
  const { data: post, error: checkError } = await supabaseAdmin
    .from('forum_posts')
    .select('user_id')
    .eq('id', postId)
    .single()

  if (checkError || !post) {
    throw checkError || new Error('Post no encontrado')
  }

  if (post.user_id !== userId) {
    throw new Error('No tienes permiso para eliminar este post')
  }

  // Eliminar post (ON DELETE CASCADE se encarga de respuestas)
  const { error } = await supabaseAdmin
    .from('forum_posts')
    .delete()
    .eq('id', postId)

  if (error) {
    throw error
  }
}

/**
 * Crear una respuesta
 */
export async function createForumReply(
  userId: string,
  input: CreateForumReplyDTO
): Promise<ForumReplyWithAuthor> {
  console.log('[ForumService] createForumReply', userId, input.post_id)

  // Verificar que el post existe y obtener el course_id
  const { data: post, error: postError } = await supabaseAdmin
    .from('forum_posts')
    .select('course_id')
    .eq('id', input.post_id)
    .single()

  if (postError || !post) {
    throw postError || new Error('Post no encontrado')
  }

  // Verificar acceso al foro
  const hasAccess = await canAccessForum(userId, post.course_id)
  if (!hasAccess) {
    throw new Error('No tienes acceso a este foro. Debes estar inscrito en el curso.')
  }

  // Si hay parent_reply_id, verificar que existe
  if (input.parent_reply_id) {
    const { data: parentReply, error: parentError } = await supabaseAdmin
      .from('forum_replies')
      .select('id')
      .eq('id', input.parent_reply_id)
      .single()

    if (parentError || !parentReply) {
      throw new Error('La respuesta padre no existe')
    }
  }

  // Crear la respuesta
  const { data: reply, error: replyError } = await supabaseAdmin
    .from('forum_replies')
    .insert({
      post_id: input.post_id,
      user_id: userId,
      message: input.message,
      parent_reply_id: input.parent_reply_id || null,
    })
    .select()
    .single()

  if (replyError || !reply) {
    throw replyError || new Error('Error al crear la respuesta')
  }

  // Obtener información del autor
  const { data: author, error: authorError } = await supabaseAdmin
    .from('users')
    .select('id, name, email, avatar_url, role')
    .eq('id', userId)
    .single()

  if (authorError || !author) {
    throw authorError || new Error('Error al obtener información del autor')
  }

  return {
    ...reply,
    author,
  } as ForumReplyWithAuthor
}

/**
 * Listar respuestas de un post
 */
export async function listForumReplies(postId: string): Promise<ForumReplyWithAuthor[]> {
  console.log('[ForumService] listForumReplies', postId)

  // Obtener respuestas
  const { data: replies, error: repliesError } = await supabaseAdmin
    .from('forum_replies')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (repliesError) {
    throw repliesError
  }

  if (!replies || replies.length === 0) {
    return []
  }

  // Obtener autores
  const userIds = [...new Set(replies.map(r => r.user_id))]
  const { data: authors, error: authorsError } = await supabaseAdmin
    .from('users')
    .select('id, name, email, avatar_url, role')
    .in('id', userIds)

  if (authorsError) {
    throw authorsError
  }

  // Crear mapa de autores
  const authorsMap = new Map(authors?.map(a => [a.id, a]) || [])

  // Combinar datos
  return replies.map(reply => ({
    ...reply,
    author: authorsMap.get(reply.user_id) || {
      id: reply.user_id,
      name: 'Usuario desconocido',
      email: '',
      avatar_url: null,
      role: 'student',
    },
  })) as ForumReplyWithAuthor[]
}

/**
 * Actualizar una respuesta
 */
export async function updateForumReply(
  replyId: string,
  userId: string,
  input: UpdateForumReplyDTO
): Promise<ForumReply> {
  console.log('[ForumService] updateForumReply', replyId, userId)

  // Verificar que la respuesta existe y pertenece al usuario
  const { data: reply, error: checkError } = await supabaseAdmin
    .from('forum_replies')
    .select('user_id')
    .eq('id', replyId)
    .single()

  if (checkError || !reply) {
    throw checkError || new Error('Respuesta no encontrada')
  }

  if (reply.user_id !== userId) {
    throw new Error('No tienes permiso para editar esta respuesta')
  }

  // Actualizar
  const { data, error } = await supabaseAdmin
    .from('forum_replies')
    .update({
      message: input.message,
      updated_at: new Date().toISOString(),
    })
    .eq('id', replyId)
    .select()
    .single()

  if (error || !data) {
    throw error || new Error('Error al actualizar la respuesta')
  }

  return data as ForumReply
}

/**
 * Eliminar una respuesta
 */
export async function deleteForumReply(replyId: string, userId: string): Promise<void> {
  console.log('[ForumService] deleteForumReply', replyId, userId)

  // Verificar que la respuesta existe y pertenece al usuario
  const { data: reply, error: checkError } = await supabaseAdmin
    .from('forum_replies')
    .select('user_id')
    .eq('id', replyId)
    .single()

  if (checkError || !reply) {
    throw checkError || new Error('Respuesta no encontrada')
  }

  if (reply.user_id !== userId) {
    throw new Error('No tienes permiso para eliminar esta respuesta')
  }

  // Eliminar respuesta (ON DELETE SET NULL en parent_reply_id mantendrá la integridad)
  const { error } = await supabaseAdmin
    .from('forum_replies')
    .delete()
    .eq('id', replyId)

  if (error) {
    throw error
  }
}
