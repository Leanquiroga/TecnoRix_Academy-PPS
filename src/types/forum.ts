// Tipos de foro (alineados con backend, usando snake_case)

export interface ForumPost {
  id: string
  course_id: string
  user_id: string
  title: string
  message: string
  is_pinned?: boolean
  likes_count?: number
  reactions?: Record<string, unknown>
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
  created_at: string
  updated_at: string
}

export interface ForumReply {
  id: string
  post_id: string
  user_id: string
  message: string
  parent_reply_id?: string | null
  likes_count?: number
  reactions?: Record<string, unknown>
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
  created_at: string
  updated_at: string
}

export interface ForumAuthor {
  id: string
  name: string
  email: string
  avatar_url?: string | null
  role?: string
}

export interface ForumPostWithAuthor extends ForumPost {
  author: ForumAuthor
  replies_count?: number
}

export interface ForumReplyWithAuthor extends ForumReply {
  author: ForumAuthor
}

export interface CreateForumPostDTO {
  course_id: string
  title: string
  message: string
}

export interface CreateForumReplyDTO {
  post_id: string
  message: string
  parent_reply_id?: string
}

export interface UpdateForumPostDTO {
  title?: string
  message?: string
  is_pinned?: boolean
}

export interface UpdateForumReplyDTO {
  message: string
}
