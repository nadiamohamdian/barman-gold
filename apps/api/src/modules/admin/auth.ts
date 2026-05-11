import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db/prisma';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/**
 * POST /v1/admin/auth/login
 * ورود ادمین
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    // جستجوی کاربر ادمین
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: username },
          { email: username }
        ],
        role: 'admin'
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isActive: true,
        password: true,
        createdAt: true
      }
    });

    if (!adminUser) {
      return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
    }

    // بررسی رمز عبور
    const isValidPassword = await bcrypt.compare(password, adminUser.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
    }

    // بررسی وضعیت کاربر
    if (adminUser.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'حساب کاربری شما غیرفعال است' });
    }

    // تولید JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      {
        id: adminUser.id,
        phone: adminUser.phone,
        email: adminUser.email,
        role: 'ADMIN'
      },
      secret,
      { expiresIn: '24h' }
    );

    // بروزرسانی آخرین ورود
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { lastLoginAt: new Date() }
    });

    res.json({
      success: true,
      token,
      user: {
        id: adminUser.id,
        phone: adminUser.phone,
        email: adminUser.email,
        role: 'ADMIN'
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /v1/admin/auth/logout
 * خروج ادمین
 */
router.post('/logout', async (req, res, next) => {
  try {
    // در JWT، logout معمولاً client-side انجام می‌شود
    // اما می‌توانیم token را blacklist کنیم
    res.json({ success: true, message: 'با موفقیت خارج شدید' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /v1/admin/auth/me
 * دریافت اطلاعات کاربر فعلی
 */
router.get('/me', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'توکن احراز هویت مورد نیاز است' });
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        phone: true,
        email: true,
        status: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    res.json({
      success: true,
      user: {
        ...user,
        role: 'ADMIN'
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
