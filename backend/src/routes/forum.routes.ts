/**
 * Rutas para el sistema de foros
 */

import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import * as ForumController from '../controllers/forum.controller'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// Posts del foro
router.post('/courses/:courseId/forum', ForumController.createPostController)
router.get('/courses/:courseId/forum', ForumController.listPostsController)
router.get('/forum/posts/:postId', ForumController.getPostController)
router.put('/forum/posts/:postId', ForumController.updatePostController)
router.delete('/forum/posts/:postId', ForumController.deletePostController)

// Respuestas del foro
router.post('/forum/posts/:postId/replies', ForumController.createReplyController)
router.get('/forum/posts/:postId/replies', ForumController.listRepliesController)
router.put('/forum/replies/:replyId', ForumController.updateReplyController)
router.delete('/forum/replies/:replyId', ForumController.deleteReplyController)

export default router
