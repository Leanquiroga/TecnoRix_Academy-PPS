import { create } from 'zustand'
import forumAPI from '../api/forum.service'
import type {
  ForumPostWithAuthor,
  ForumReplyWithAuthor,
  UpdateForumPostDTO,
  UpdateForumReplyDTO,
} from '../types/forum'

interface ForumState {
  posts: ForumPostWithAuthor[]
  currentPost: ForumPostWithAuthor | null
  replies: ForumReplyWithAuthor[]
  loading: boolean
  error: string | null
  // actions
  fetchPosts: (courseId: string) => Promise<void>
  fetchPost: (postId: string) => Promise<void>
  createPost: (courseId: string, input: { title: string; message: string }) => Promise<ForumPostWithAuthor>
  updatePost: (postId: string, input: UpdateForumPostDTO) => Promise<void>
  deletePost: (postId: string) => Promise<void>
  fetchReplies: (postId: string) => Promise<void>
  createReply: (postId: string, input: { message: string; parent_reply_id?: string }) => Promise<ForumReplyWithAuthor>
  updateReply: (replyId: string, input: UpdateForumReplyDTO) => Promise<void>
  deleteReply: (replyId: string) => Promise<void>
  clear: () => void
}

export const useForumStore = create<ForumState>((set) => ({
  posts: [],
  currentPost: null,
  replies: [],
  loading: false,
  error: null,

  fetchPosts: async (courseId) => {
    set({ loading: true, error: null })
    try {
      const posts = await forumAPI.listPosts(courseId)
      // Ordenar por fecha de creación descendente (más recientes primero)
      const sorted = [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      set({ posts: sorted })
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      const msg = error?.response?.data?.error || 'Error al obtener posts del foro'
      set({ error: msg })
    } finally {
      set({ loading: false })
    }
  },

  fetchPost: async (postId) => {
    set({ loading: true, error: null })
    try {
      const post = await forumAPI.getPost(postId)
      set({ currentPost: post })
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      const msg = error?.response?.data?.error || 'Error al obtener el post'
      set({ error: msg })
    } finally {
      set({ loading: false })
    }
  },

  createPost: async (courseId, input) => {
    const post = await forumAPI.createPost(courseId, input)
    set((state) => ({ posts: [post, ...state.posts] }))
    return post
  },

  updatePost: async (postId, input) => {
    const updated = await forumAPI.updatePost(postId, input)
    set((state) => ({
      posts: state.posts.map((p) => (p.id === postId ? { ...p, ...updated } : p)),
      currentPost: state.currentPost && state.currentPost.id === postId ? { ...state.currentPost, ...updated } : state.currentPost,
    }))
  },

  deletePost: async (postId) => {
    await forumAPI.deletePost(postId)
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
      currentPost: state.currentPost?.id === postId ? null : state.currentPost,
    }))
  },

  fetchReplies: async (postId) => {
    set({ loading: true, error: null })
    try {
      const replies = await forumAPI.listReplies(postId)
      set({ replies })
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      const msg = error?.response?.data?.error || 'Error al obtener respuestas'
      set({ error: msg })
    } finally {
      set({ loading: false })
    }
  },

  createReply: async (postId, input) => {
    const reply = await forumAPI.createReply(postId, input)
    set((state) => ({ replies: [...state.replies, reply] }))
    // Mantener contador de respuestas si está disponible
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, replies_count: (p.replies_count ?? 0) + 1 } : p
      ),
      currentPost:
        state.currentPost && state.currentPost.id === postId
          ? { ...state.currentPost, replies_count: (state.currentPost.replies_count ?? 0) + 1 }
          : state.currentPost,
    }))
    return reply
  },

  updateReply: async (replyId, input) => {
    const updated = await forumAPI.updateReply(replyId, input)
    set((state) => ({
      replies: state.replies.map((r) => (r.id === replyId ? { ...r, ...updated } : r)),
    }))
  },

  deleteReply: async (replyId) => {
    await forumAPI.deleteReply(replyId)
    set((state) => ({ replies: state.replies.filter((r) => r.id !== replyId) }))
  },

  clear: () => set({ posts: [], currentPost: null, replies: [], error: null })
}))

export default useForumStore
