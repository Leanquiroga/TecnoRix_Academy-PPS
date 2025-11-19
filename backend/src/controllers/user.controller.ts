import type { Response } from 'express'
import type { AuthRequest } from '../types/common.types'
import { getUserById, updateUserProfile } from '../services/user.service'
import { supabaseAdmin } from '../config/supabase'
import { UserRole } from '../types/auth.types'

// PUT /api/users/profile
export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }
    const { name, bio, country, avatar_url } = req.body as {
      name?: string
      bio?: string | null
      country?: string | null
      avatar_url?: string | null
    }

    // Validaciones
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120) {
        return res.status(400).json({ success: false, error: 'Nombre inválido (2-120 caracteres)' })
      }
    }
    if (bio !== undefined && bio !== null) {
      if (typeof bio !== 'string' || bio.length > 500) {
        return res.status(400).json({ success: false, error: 'Bio inválida (máx 500 caracteres)' })
      }
    }
    if (country !== undefined && country !== null) {
      if (typeof country !== 'string' || country.length > 100) {
        return res.status(400).json({ success: false, error: 'País inválido (máx 100 caracteres)' })
      }
    }
    if (avatar_url !== undefined && avatar_url !== null) {
      if (typeof avatar_url !== 'string' || !/^https?:\/\//.test(avatar_url)) {
        return res.status(400).json({ success: false, error: 'URL de avatar inválida' })
      }
    }

    // Verificar existencia usuario
    const current = await getUserById(req.user.userId)
    if (!current) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' })
    }

    const updated = await updateUserProfile(req.user.userId, { name, bio, country, avatar_url })
    return res.status(200).json({ success: true, data: updated })
  } catch (err: any) {
    const msg = err?.message || 'Error al actualizar perfil'
    return res.status(500).json({ success: false, error: msg })
  }
}

// GET /api/users/activity - resumen según rol
export async function activitySummary(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' })
    const profile = await getUserById(req.user.userId)
    if (!profile) return res.status(404).json({ success: false, error: 'Usuario no encontrado' })

    if (profile.role === UserRole.STUDENT) {
      const { data: enrollments, error: enrErr } = await supabaseAdmin
        .from('enrollments')
        .select('course_id, progress, certificate_url')
        .eq('student_id', profile.id)
      if (enrErr) throw enrErr
      const totalEnrolled = enrollments?.length || 0
      const averageProgress = totalEnrolled
        ? (enrollments!.reduce((acc, e) => acc + (Number(e.progress) || 0), 0) / totalEnrolled)
        : 0
      const certificates = enrollments?.filter(e => !!e.certificate_url).length || 0
      return res.json({ success: true, data: { role: 'student', totalEnrolled, averageProgress, certificates } })
    }

    if (profile.role === UserRole.TEACHER) {
      const { data: courses, error: courseErr } = await supabaseAdmin
        .from('courses')
        .select('id')
        .eq('teacher_id', profile.id)
      if (courseErr) throw courseErr
      const courseIds = courses?.map(c => c.id) || []
      let totalStudents = 0
      if (courseIds.length) {
        const { count, error: countErr } = await supabaseAdmin
          .from('enrollments')
          .select('id', { count: 'exact', head: true })
          .in('course_id', courseIds)
        if (countErr) throw countErr
        totalStudents = count || 0
      }
      return res.json({ success: true, data: { role: 'teacher', totalCourses: courseIds.length, totalStudents } })
    }

    // Admin summary
    const [{ count: usersCount, error: usersErr }, { count: coursesCount, error: coursesErr }, { count: quizzesCount, error: quizzesErr }] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('courses').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('quizzes').select('id', { count: 'exact', head: true }),
    ])
    if (usersErr) throw usersErr
    if (coursesErr) throw coursesErr
    if (quizzesErr) throw quizzesErr
    return res.json({ success: true, data: { role: 'admin', totalUsers: usersCount || 0, totalCourses: coursesCount || 0, totalQuizzes: quizzesCount || 0 } })
  } catch (err: any) {
    const msg = err?.message || 'Error obteniendo actividad'
    return res.status(500).json({ success: false, error: msg })
  }
}
