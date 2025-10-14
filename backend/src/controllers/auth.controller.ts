import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service'; 
import { RegisterDTO, LoginDTO } from '../types/auth.types';
import { supabase } from '../config/supabase.config';

export const register = async (req: Request<{}, {}, RegisterDTO>, res: Response) => {
  try {
    const { name, email, password, role = 'student' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const user = await AuthService.register({ name, email, password, role });
    return res.status(201).json(user);
  } catch (err: any) {
    if (err.message.includes('already registered')) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }
    return res.status(400).json({ message: err.message });
  }
};

export const login = async (req: Request<{}, {}, LoginDTO>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' });
    }

    const data = await AuthService.login({ email, password });
    return res.status(200).json(data);
  } catch (err: any) {
    if (err.message.includes('Invalid login credentials')) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    return res.status(400).json({ message: err.message });
  }
};

export const me = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  return res.json(user);
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token es requerido' });
    }

    const data = await AuthService.refresh(refreshToken);
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(401).json({ message: err.message });
  }
};

export const approveTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { data: teacher, error } = await supabase
      .from('users')
      .update({ 
        status: 'active',
        verified_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('role', 'teacher')
      .single();

    if (error) throw new Error(error.message);
    
    return res.json({ message: 'Profesor aprobado exitosamente', teacher });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
