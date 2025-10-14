import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.config';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
      return res.status(401).json({ message: 'Token malformado' });
    }

    const token = parts[1];

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.sub)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // Add user to request
    (req as any).user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: 'No tiene permiso para acceder a este recurso' });
    }

    return next();
  };
};
