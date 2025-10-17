import type { Response } from 'express'
import type { AuthRequest } from '../types/common.types'
import { UserRole, UserStatus } from '../types/auth.types'
import { getAllUsers, getUserById, updateUserRole, updateUserStatus } from '../services/user.service'

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const { role, status } = req.query

    const filters: { role?: UserRole; status?: UserStatus } = {}
    if (role && typeof role === 'string') {
      filters.role = role as UserRole
    }
    if (status && typeof status === 'string') {
      filters.status = status as UserStatus
    }

    const users = await getAllUsers(filters)

    return res.status(200).json({
      success: true,
      data: users,
    })
  } catch (error: any) {
    console.error('Error getting users:', error)
    return res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios',
    })
  }
}

export async function approveTeacher(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params

    // Verificar que el usuario existe
    const user = await getUserById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      })
    }

    // Verificar que sea un teacher
    if (user.role !== UserRole.TEACHER) {
      return res.status(400).json({
        success: false,
        error: 'El usuario no es un profesor',
      })
    }

    // Verificar que esté pendiente de validación
    if (user.status !== UserStatus.PENDING_VALIDATION) {
      return res.status(400).json({
        success: false,
        error: 'El usuario no está pendiente de validación',
      })
    }

    // Aprobar el teacher
    const updatedUser = await updateUserStatus(id, UserStatus.ACTIVE)

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Profesor aprobado exitosamente',
    })
  } catch (error: any) {
    console.error('Error approving teacher:', error)
    return res.status(500).json({
      success: false,
      error: 'Error al aprobar profesor',
    })
  }
}

export async function changeUserRole(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { role } = req.body

    // Validar que se envió el rol
    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'El rol es requerido',
      })
    }

    // Validar que el rol sea válido
    const allowedRoles: UserRole[] = [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rol inválido',
      })
    }

    // Verificar que el usuario existe
    const user = await getUserById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      })
    }

    // Evitar que el admin se cambie su propio rol
    if (req.user?.userId === id) {
      return res.status(400).json({
        success: false,
        error: 'No puedes cambiar tu propio rol',
      })
    }

    // Cambiar el rol
    const updatedUser = await updateUserRole(id, role)

    // Si el nuevo rol es teacher, cambiar status a pending_validation
    if (role === UserRole.TEACHER && user.role !== UserRole.TEACHER) {
      await updateUserStatus(id, UserStatus.PENDING_VALIDATION)
    }

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Rol actualizado exitosamente',
    })
  } catch (error: any) {
    console.error('Error changing user role:', error)
    return res.status(500).json({
      success: false,
      error: 'Error al cambiar rol de usuario',
    })
  }
}

export async function suspendUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { suspend } = req.body

    // Validar que se envió el parámetro suspend
    if (typeof suspend !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'El parámetro suspend es requerido y debe ser booleano',
      })
    }

    // Verificar que el usuario existe
    const user = await getUserById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      })
    }

    // Evitar que el admin se suspenda a sí mismo
    if (req.user?.userId === id) {
      return res.status(400).json({
        success: false,
        error: 'No puedes suspender tu propia cuenta',
      })
    }

    // Cambiar el status
    const newStatus: UserStatus = suspend ? UserStatus.SUSPENDED : UserStatus.ACTIVE
    const updatedUser = await updateUserStatus(id, newStatus)

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: suspend ? 'Usuario suspendido exitosamente' : 'Usuario activado exitosamente',
    })
  } catch (error: any) {
    console.error('Error suspending/activating user:', error)
    return res.status(500).json({
      success: false,
      error: 'Error al cambiar estado del usuario',
    })
  }
}

