/**
 * Controlador para endpoints de foros
 */

import type { Response } from 'express'
import type { AuthRequest } from '../types/common.types'
import type { CreateForumPostDTO, CreateForumReplyDTO, UpdateForumPostDTO, UpdateForumReplyDTO } from '../types/forum.types'
import * as ForumService from '../services/forum.service'

/**
 * POST /api/courses/:courseId/forum
 * Crear un nuevo post en el foro del curso
 */
export async function createPostController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { courseId } = req.params
    const { title, message } = req.body
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    if (!title || !message) {
      return res.status(400).json({ error: 'El título y mensaje son requeridos' })
    }

    if (title.length < 5) {
      return res.status(400).json({ error: 'El título debe tener al menos 5 caracteres' })
    }

    if (message.length < 10) {
      return res.status(400).json({ error: 'El mensaje debe tener al menos 10 caracteres' })
    }

    const input: CreateForumPostDTO = {
      course_id: courseId,
      title,
      message,
    }

    const post = await ForumService.createForumPost(userId, input)

    return res.status(201).json({
      success: true,
      data: post,
    })
  } catch (error: any) {
    console.error('Error al crear post:', error)
    
    if (error.message?.includes('acceso')) {
      return res.status(403).json({ error: error.message })
    }
    
    return res.status(500).json({
      error: 'Error al crear el post del foro',
      details: error.message,
    })
  }
}

/**
 * GET /api/courses/:courseId/forum
 * Listar posts del foro de un curso
 */
export async function listPostsController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { courseId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Verificar acceso al foro
    const hasAccess = await ForumService.canAccessForum(userId, courseId)
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'No tienes acceso a este foro. Debes estar inscrito en el curso.' 
      })
    }

    const posts = await ForumService.listForumPosts(courseId)

    return res.json({
      success: true,
      data: posts,
    })
  } catch (error: any) {
    console.error('Error al listar posts:', error)
    return res.status(500).json({
      error: 'Error al obtener los posts del foro',
      details: error.message,
    })
  }
}

/**
 * GET /api/forum/posts/:postId
 * Obtener un post específico
 */
export async function getPostController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { postId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const post = await ForumService.getForumPost(postId)

    // Verificar acceso al foro del curso
    const hasAccess = await ForumService.canAccessForum(userId, post.course_id)
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'No tienes acceso a este foro. Debes estar inscrito en el curso.' 
      })
    }

    return res.json({
      success: true,
      data: post,
    })
  } catch (error: any) {
    console.error('Error al obtener post:', error)
    
    if (error.message?.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    
    return res.status(500).json({
      error: 'Error al obtener el post',
      details: error.message,
    })
  }
}

/**
 * PUT /api/forum/posts/:postId
 * Actualizar un post
 */
export async function updatePostController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { postId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const input: UpdateForumPostDTO = {}
    
    if (req.body.title !== undefined) {
      if (req.body.title.length < 5) {
        return res.status(400).json({ error: 'El título debe tener al menos 5 caracteres' })
      }
      input.title = req.body.title
    }
    
    if (req.body.message !== undefined) {
      if (req.body.message.length < 10) {
        return res.status(400).json({ error: 'El mensaje debe tener al menos 10 caracteres' })
      }
      input.message = req.body.message
    }

    if (req.body.is_pinned !== undefined) {
      input.is_pinned = req.body.is_pinned
    }

    const post = await ForumService.updateForumPost(postId, userId, input)

    return res.json({
      success: true,
      data: post,
    })
  } catch (error: any) {
    console.error('Error al actualizar post:', error)
    
    if (error.message?.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    
    if (error.message?.includes('permiso')) {
      return res.status(403).json({ error: error.message })
    }
    
    return res.status(500).json({
      error: 'Error al actualizar el post',
      details: error.message,
    })
  }
}

/**
 * DELETE /api/forum/posts/:postId
 * Eliminar un post
 */
export async function deletePostController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { postId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    await ForumService.deleteForumPost(postId, userId)

    return res.json({
      success: true,
      message: 'Post eliminado correctamente',
    })
  } catch (error: any) {
    console.error('Error al eliminar post:', error)
    
    if (error.message?.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    
    if (error.message?.includes('permiso')) {
      return res.status(403).json({ error: error.message })
    }
    
    return res.status(500).json({
      error: 'Error al eliminar el post',
      details: error.message,
    })
  }
}

/**
 * POST /api/forum/posts/:postId/replies
 * Crear una respuesta a un post
 */
export async function createReplyController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { postId } = req.params
    const { message, parent_reply_id } = req.body
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    if (!message) {
      return res.status(400).json({ error: 'El mensaje es requerido' })
    }

    if (message.length < 3) {
      return res.status(400).json({ error: 'El mensaje debe tener al menos 3 caracteres' })
    }

    const input: CreateForumReplyDTO = {
      post_id: postId,
      message,
      parent_reply_id: parent_reply_id || undefined,
    }

    const reply = await ForumService.createForumReply(userId, input)

    return res.status(201).json({
      success: true,
      data: reply,
    })
  } catch (error: any) {
    console.error('Error al crear respuesta:', error)
    
    if (error.message?.includes('acceso') || error.message?.includes('no encontrado')) {
      return res.status(403).json({ error: error.message })
    }
    
    return res.status(500).json({
      error: 'Error al crear la respuesta',
      details: error.message,
    })
  }
}

/**
 * GET /api/forum/posts/:postId/replies
 * Listar respuestas de un post
 */
export async function listRepliesController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { postId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Verificar que el post existe y obtener el course_id
    const post = await ForumService.getForumPost(postId)

    // Verificar acceso al foro
    const hasAccess = await ForumService.canAccessForum(userId, post.course_id)
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'No tienes acceso a este foro. Debes estar inscrito en el curso.' 
      })
    }

    const replies = await ForumService.listForumReplies(postId)

    return res.json({
      success: true,
      data: replies,
    })
  } catch (error: any) {
    console.error('Error al listar respuestas:', error)
    
    if (error.message?.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    
    return res.status(500).json({
      error: 'Error al obtener las respuestas',
      details: error.message,
    })
  }
}

/**
 * PUT /api/forum/replies/:replyId
 * Actualizar una respuesta
 */
export async function updateReplyController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { replyId } = req.params
    const { message } = req.body
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    if (!message) {
      return res.status(400).json({ error: 'El mensaje es requerido' })
    }

    if (message.length < 3) {
      return res.status(400).json({ error: 'El mensaje debe tener al menos 3 caracteres' })
    }

    const input: UpdateForumReplyDTO = { message }
    const reply = await ForumService.updateForumReply(replyId, userId, input)

    return res.json({
      success: true,
      data: reply,
    })
  } catch (error: any) {
    console.error('Error al actualizar respuesta:', error)
    
    if (error.message?.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    
    if (error.message?.includes('permiso')) {
      return res.status(403).json({ error: error.message })
    }
    
    return res.status(500).json({
      error: 'Error al actualizar la respuesta',
      details: error.message,
    })
  }
}

/**
 * DELETE /api/forum/replies/:replyId
 * Eliminar una respuesta
 */
export async function deleteReplyController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { replyId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    await ForumService.deleteForumReply(replyId, userId)

    return res.json({
      success: true,
      message: 'Respuesta eliminada correctamente',
    })
  } catch (error: any) {
    console.error('Error al eliminar respuesta:', error)
    
    if (error.message?.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    
    if (error.message?.includes('permiso')) {
      return res.status(403).json({ error: error.message })
    }
    
    return res.status(500).json({
      error: 'Error al eliminar la respuesta',
      details: error.message,
    })
  }
}
