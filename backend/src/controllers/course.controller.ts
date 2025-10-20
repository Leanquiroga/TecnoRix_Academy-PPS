import { listPendingCourses, approveCourse, rejectCourse, getCoursePublicById, updateCourse, deleteCourse } from '../services/course.service'

// ADMIN: Listar cursos pendientes
export async function getPendingCoursesController(_req: AuthRequest, res: Response) {
  try {
    console.log('[Courses][Admin] Listar pendientes')
    const courses = await listPendingCourses()
    return res.json({ success: true, data: courses })
  } catch (err: any) {
    const msg = err?.message || 'Error al listar cursos pendientes'
    console.error('[Courses][Admin] Error listando pendientes:', msg)
    return res.status(400).json({ success: false, error: msg })
  }
}

// ADMIN: Aprobar curso
export async function approveCourseController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    console.log('[Courses][Admin] Aprobar curso:', id)
    const course = await approveCourse(id)
    return res.json({ success: true, data: course, message: 'Curso aprobado correctamente' })
  } catch (err: any) {
    const msg = err?.message || 'Error al aprobar curso'
    console.error('[Courses][Admin] Error aprobando curso:', msg)
    return res.status(400).json({ success: false, error: msg })
  }
}

// ADMIN: Rechazar curso
export async function rejectCourseController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { reason } = req.body || {}
    console.log('[Courses][Admin] Rechazar curso:', id, 'reason:', reason)
    const course = await rejectCourse(id, reason)
    return res.json({ success: true, data: course, message: 'Curso rechazado correctamente' })
  } catch (err: any) {
    const msg = err?.message || 'Error al rechazar curso'
    console.error('[Courses][Admin] Error rechazando curso:', msg)
    return res.status(400).json({ success: false, error: msg })
  }
}
import type { Response } from 'express'
import type { AuthRequest } from '../types/common.types'
import { createCourse, listPublicCourses } from '../services/course.service'

export async function createCourseController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' })

    const { title, description, price, thumbnail_url, category, duration_hours, level, language, tags, metadata } = req.body || {}
    console.log('[Courses] Crear curso payload:', { title, teacher: req.user.userId })

    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Faltan campos obligatorios: title, description' })
    }

    const course = await createCourse(req.user.userId, {
      title,
      description,
      price,
      thumbnail_url,
      category,
      duration_hours,
      level,
      language,
      tags,
      metadata,
    })

    return res.status(201).json({ success: true, data: course, message: 'Curso creado y enviado a aprobación' })
  } catch (err: any) {
    const msg = err?.message || 'Error al crear curso'
    if (msg.includes('Solo los profesores') || msg.includes('aprobado')) {
      console.warn('[Courses] Rechazo por permisos/estado:', msg)
      return res.status(403).json({ success: false, error: msg })
    }
    console.error('[Courses] Error creando curso:', msg)
    return res.status(400).json({ success: false, error: msg })
  }
}

export async function getPublicCoursesController(_req: AuthRequest, res: Response) {
  try {
    console.log('[Courses] Listar cursos públicos')
    const courses = await listPublicCourses()
    return res.json({ success: true, data: courses })
  } catch (err: any) {
    const msg = err?.message || 'Error al listar cursos'
    console.error('[Courses] Error listando públicos:', msg)
    return res.status(400).json({ success: false, error: msg })
  }
}

export async function getCourseByIdController(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const course = await getCoursePublicById(id)
    if (!course) return res.status(404).json({ success: false, error: 'Curso no encontrado' })
    return res.json({ success: true, data: course })
  } catch (err: any) {
    const msg = err?.message || 'Error al obtener curso'
    return res.status(400).json({ success: false, error: msg })
  }
}

export async function updateCourseController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' })
    const { id } = req.params
    const course = await updateCourse(id, req.user.userId, req.body || {})
    return res.json({ success: true, data: course, message: 'Curso actualizado' })
  } catch (err: any) {
    const msg = err?.message || 'Error al actualizar curso'
    if (msg.includes('No autorizado')) return res.status(403).json({ success: false, error: msg })
    if (msg.includes('no encontrado')) return res.status(404).json({ success: false, error: msg })
    return res.status(400).json({ success: false, error: msg })
  }
}

export async function deleteCourseController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' })
    const { id } = req.params
    await deleteCourse(id, req.user.userId)
    return res.json({ success: true, message: 'Curso eliminado' })
  } catch (err: any) {
    const msg = err?.message || 'Error al eliminar curso'
    if (msg.includes('No autorizado')) return res.status(403).json({ success: false, error: msg })
    if (msg.includes('no encontrado')) return res.status(404).json({ success: false, error: msg })
    return res.status(400).json({ success: false, error: msg })
  }
}
