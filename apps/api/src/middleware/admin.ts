import { Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from './auth';

export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
    }

    // بررسی نقش ادمین
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'دسترسی به پنل ادمین ندارید' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'خطا در بررسی دسترسی' });
  }
}
