import http from './http'
import type {
  ForumPostWithAuthor,
  ForumReplyWithAuthor,
  CreateForumPostDTO,
  UpdateForumPostDTO,
  CreateForumReplyDTO,
  UpdateForumReplyDTO,
  ForumPost,
  ForumReply,
} from '../types/forum'

export const forumService = {
  async listPosts(courseId: string): Promise<ForumPostWithAuthor[]> {
    const { data } = await http.get(`/courses/${courseId}/forum`)
    // Backend responde { data: posts } o directamente array; normalizamos
    return (data?.data ?? data) as ForumPostWithAuthor[]
  },

  async createPost(courseId: string, payload: Omit<CreateForumPostDTO, 'course_id'>): Promise<ForumPostWithAuthor> {
    const body: CreateForumPostDTO = { course_id: courseId, ...payload }
    const { data } = await http.post(`/courses/${courseId}/forum`, body)
    return (data?.data ?? data) as ForumPostWithAuthor
  },

  async getPost(postId: string): Promise<ForumPostWithAuthor> {
    const { data } = await http.get(`/forum/posts/${postId}`)
    return (data?.data ?? data) as ForumPostWithAuthor
  },

  async updatePost(postId: string, payload: UpdateForumPostDTO): Promise<ForumPost> {
    const { data } = await http.put(`/forum/posts/${postId}`, payload)
    return (data?.data ?? data) as ForumPost
  },

  async deletePost(postId: string): Promise<void> {
    await http.delete(`/forum/posts/${postId}`)
  },

  async listReplies(postId: string): Promise<ForumReplyWithAuthor[]> {
    const { data } = await http.get(`/forum/posts/${postId}/replies`)
    return (data?.data ?? data) as ForumReplyWithAuthor[]
  },

  async createReply(postId: string, payload: Omit<CreateForumReplyDTO, 'post_id'>): Promise<ForumReplyWithAuthor> {
    const body: CreateForumReplyDTO = { post_id: postId, ...payload }
    const { data } = await http.post(`/forum/posts/${postId}/replies`, body)
    return (data?.data ?? data) as ForumReplyWithAuthor
  },

  async updateReply(replyId: string, payload: UpdateForumReplyDTO): Promise<ForumReply> {
    const { data } = await http.put(`/forum/replies/${replyId}`, payload)
    return (data?.data ?? data) as ForumReply
  },

  async deleteReply(replyId: string): Promise<void> {
    await http.delete(`/forum/replies/${replyId}`)
  },
}

export default forumService
