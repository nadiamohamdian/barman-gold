import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  firstName: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  lastName: z.string().min(2, 'نام خانوادگی باید حداقل ۲ کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر نیست'),
  phone: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
  birthDate: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  agreeToNewsletter: z.boolean().optional().default(false)
});

const loginSchema = z.object({
  email: z.string().email('ایمیل معتبر نیست').optional(),
  phone: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست').optional(),
  password: z.string().min(1, 'رمز عبور الزامی است')
}).refine(data => data.email || data.phone, {
  message: 'ایمیل یا شماره موبایل الزامی است'
});

const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^09\d{9}$/).optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['male', 'female']).optional()
});

// Register user
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          ...(data.phone ? [{ phone: data.phone }] : [])
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'کاربری با این ایمیل یا شماره موبایل قبلاً ثبت نام کرده است'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        ...(data.phone && { phone: data.phone }),
        password: hashedPassword,
        role: 'customer',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'ثبت نام با موفقیت انجام شد',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات وارد شده نامعتبر است',
        errors: error.issues
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ثبت نام'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.phone ? [{ phone: data.phone }] : [])
        ],
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'کاربری با این اطلاعات یافت نشد'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'رمز عبور اشتباه است'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'ورود با موفقیت انجام شد',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات وارد شده نامعتبر است',
        errors: error.issues
      });
    }

    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ورود'
    });
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت پروفایل'
    });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    // Check if email or phone is already taken by another user
    if (data.email || data.phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: (req as any).userId } },
            {
              OR: [
                ...(data.email ? [{ email: data.email }] : []),
                ...(data.phone ? [{ phone: data.phone }] : [])
              ]
            }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'ایمیل یا شماره موبایل قبلاً توسط کاربر دیگری استفاده شده است'
        });
      }
    }

    const updateData: any = { ...data };
    if (data.birthDate) {
      updateData.birthDate = new Date(data.birthDate);
    }

    const user = await prisma.user.update({
      where: { id: (req as any).userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        // birthDate: true,
        gender: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'پروفایل با موفقیت به‌روزرسانی شد',
      data: user
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات وارد شده نامعتبر است',
        errors: error.issues
      });
    }

    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی پروفایل'
    });
  }
});

// Get user orders
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: (req as any).userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  image: true,
                  price: true
                }
              }
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت سفارشات'
    });
  }
});

// Get single order
router.get('/orders/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: id,
        userId: (req as any).userId
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'سفارش یافت نشد'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت سفارش'
    });
  }
});

// Get user addresses
router.get('/addresses', authMiddleware, async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: (req as any).userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت آدرس‌ها'
    });
  }
});

// Add address
router.post('/addresses', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone, address, city, postalCode, isDefault = false } = req.body;

    // If this is the default address, unset other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: (req as any).userId },
        data: { isDefault: false }
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: (req as any).userId,
        firstName,
        lastName,
        phone,
        address,
        city,
        province: city,
        postalCode,
        isDefault
      }
    });

    res.status(201).json({
      success: true,
      message: 'آدرس با موفقیت اضافه شد',
      data: newAddress
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در اضافه کردن آدرس'
    });
  }
});

// Update address
router.put('/addresses/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, address, city, postalCode, isDefault = false } = req.body;

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { id: id, userId: (req as any).userId }
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'آدرس یافت نشد'
      });
    }

    // If this is the default address, unset other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: (req as any).userId, id: { not: id } },
        data: { isDefault: false }
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: id },
      data: {
        firstName,
        lastName,
        phone,
        address,
        city,
        province: city,
        postalCode,
        isDefault
      }
    });

    res.json({
      success: true,
      message: 'آدرس با موفقیت به‌روزرسانی شد',
      data: updatedAddress
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی آدرس'
    });
  }
});

// Delete address
router.delete('/addresses/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { id: id, userId: (req as any).userId }
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'آدرس یافت نشد'
      });
    }

    await prisma.address.delete({
      where: { id: id }
    });

    res.json({
      success: true,
      message: 'آدرس با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف آدرس'
    });
  }
});

// Get wishlist
router.get('/wishlist', authMiddleware, async (req, res) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: (req as any).userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            slug: true,
            isActive: true,
            stock: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت علاقه‌مندی‌ها'
    });
  }
});

// Add to wishlist
router.post('/wishlist', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;

    // Check if product exists and is active
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'محصول یافت نشد'
      });
    }

    // Check if already in wishlist
    const existingWishlist = await prisma.wishlist.findFirst({
      where: { userId: (req as any).userId, productId: productId }
    });

    if (existingWishlist) {
      return res.status(400).json({
        success: false,
        message: 'این محصول قبلاً به علاقه‌مندی‌ها اضافه شده است'
      });
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: (req as any).userId,
        productId: productId
      }
    });

    res.status(201).json({
      success: true,
      message: 'محصول به علاقه‌مندی‌ها اضافه شد',
      data: wishlistItem
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در اضافه کردن به علاقه‌مندی‌ها'
    });
  }
});

// Remove from wishlist
router.delete('/wishlist/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlistItem = await prisma.wishlist.findFirst({
      where: { userId: (req as any).userId, productId: productId }
    });

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        message: 'محصول در علاقه‌مندی‌ها یافت نشد'
      });
    }

    await prisma.wishlist.delete({
      where: { id: wishlistItem.id }
    });

    res.json({
      success: true,
      message: 'محصول از علاقه‌مندی‌ها حذف شد'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف از علاقه‌مندی‌ها'
    });
  }
});

export default router;
