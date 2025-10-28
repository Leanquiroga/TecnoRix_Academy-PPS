/**
 * Tipos para el sistema de foros
 */

/**
 * Interfaz de post del foro
 */
export interface ForumPost {
  id: string
  course_id: string
  user_id: string
  title: string
  message: string
  is_pinned?: boolean
  likes_count?: number
  reactions?: Record<string, any>
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
  created_at: Date
  updated_at: Date
}

/**
 * Interfaz de respuesta del foro
 */
export interface ForumReply {
  id: string
  post_id: string
  user_id: string
  message: string
  parent_reply_id?: string | null
  likes_count?: number
  reactions?: Record<string, any>
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
  created_at: Date
  updated_at: Date
}

/**
 * Post del foro con información del autor
 */
export interface ForumPostWithAuthor extends ForumPost {
  author: {
    id: string
    name: string
    email: string
    avatar_url?: string | null
    role?: string
  }
  replies_count?: number
}

/**
 * Respuesta del foro con información del autor
 */
export interface ForumReplyWithAuthor extends ForumReply {
  author: {
    id: string
    name: string
    email: string
    avatar_url?: string | null
    role?: string
  }
}

/**
 * DTO para crear un post
 */
export interface CreateForumPostDTO {
  course_id: string
  title: string
  message: string
}

/**
 * DTO para crear una respuesta
 */
export interface CreateForumReplyDTO {
  post_id: string
  message: string
  parent_reply_id?: string
}

/**
 * DTO para actualizar un post
 */
export interface UpdateForumPostDTO {
  title?: string
  message?: string
  is_pinned?: boolean
}

/**
 * DTO para actualizar una respuesta
 */
export interface UpdateForumReplyDTO {
  message: string
}
