import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

// Import all admin modules
import articlesRouter from './articles';
import pagesRouter from './pages';
import menusRouter from './menus';
import bannersRouter from './banners';
import reportsRouter from './reports';
import couponsRouter from './coupons';
import inventoryRouter from './inventory';
import financeRouter from './finance';
import notificationsRouter from './notifications';
import seoRouter from './seo';
import backupRouter from './backup';
import apiRouter from './api';
import analyticsRouter from './analytics';

const router = Router();

// اعمال middleware برای تمام مسیرهای ادمین
router.use(authMiddleware);
router.use(adminMiddleware);

// ==================== DASHBOARD ====================

/**
 * GET /v1/admin/dashboard
 * دریافت آمار کلی داشبورد
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      recentOrders,
      lowStockProducts
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        _sum: { totals: true },
        where: { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } }
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { phone: true } },
          items: {
            include: {
              variant: {
                include: { product: { select: { title: true } } }
              }
            }
          }
        }
      }),
      prisma.productVariant.findMany({
        where: { stockQty: { lt: 10 } },
        include: { product: { select: { title: true } } },
        take: 5
      })
    ]);

    res.json({
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue: totalRevenue._sum.totals || 0
      },
      recentOrders,
      lowStockProducts
    });
  } catch (err) {
    next(err);
  }
});

// ==================== PRODUCTS ====================

/**
 * GET /v1/admin/products
 * لیست محصولات با فیلتر و pagination
 */
router.get('/products', async (req, res, next) => {
  try {
    const { page = 1, per_page = 10, search, category, status } = req.query;
    const skip = (Number(page) - 1) * Number(per_page);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } }
      ];
    }
    
    if (category) {
      where.categories = {
        some: { category: { slug: category as string } }
      };
    }
    
    if (status !== undefined) {
      where.isActive = status === 'active';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Number(per_page),
        orderBy: { createdAt: 'desc' },
        include: {
          variants: {
            select: {
              id: true,
              sku: true,
              weight_g: true,
              stockQty: true,
              makingFee: true,
              stoneCost: true
            }
          },
          categories: {
            include: { category: { select: { name: true, slug: true } } }
          },
          media: { take: 1, orderBy: { sort: 'asc' } },
          _count: { select: { reviews: true } }
        }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      data: products,
      pagination: {
        page: Number(page),
        per_page: Number(per_page),
        total,
        total_pages: Math.ceil(total / Number(per_page))
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /v1/admin/products
 * ایجاد محصول جدید
 */
router.post('/products', async (req, res, next) => {
  try {
    const productSchema = z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      karat: z.number().min(1).max(24),
      brand: z.string().optional(),
      isActive: z.boolean().default(true),
      categories: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      variants: z.array(z.object({
        sku: z.string(),
        barcode: z.string().optional(),
        weight_g: z.number().positive(),
        makingFee: z.number().min(0),
        stoneCost: z.number().min(0),
        stockQty: z.number().min(0)
      }))
    });

    const data = productSchema.parse(req.body);

    const product = await prisma.product.create({
      data: {
        name: data.title, // use title as name
        title: data.title,
        slug: data.slug,
        description: data.description,
        karat: data.karat,
        brand: data.brand,
        isActive: data.isActive,
        variants: {
          create: data.variants
        },
        categories: data.categories ? {
          create: data.categories.map(categoryId => ({
            categoryId
          }))
        } : undefined,
        tags: data.tags ? {
          create: data.tags.map(tagId => ({
            tagId,
            tag: tagId // use tagId as tag for compatibility
          }))
        } : undefined
      },
      include: {
        variants: true,
        categories: {
          include: { category: true }
        },
        tags: {
          include: { tagRef: true }
        }
      }
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /v1/admin/products/:id
 * ویرایش محصول
 */
router.put('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const productSchema = z.object({
      title: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      description: z.string().optional(),
      karat: z.number().min(1).max(24).optional(),
      brand: z.string().optional(),
      isActive: z.boolean().optional()
    });

    const data = productSchema.parse(req.body);

    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        variants: true,
        categories: {
          include: { category: true }
        }
      }
    });

    res.json(product);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /v1/admin/products/:id
 * حذف محصول
 */
router.delete('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: 'محصول با موفقیت حذف شد' });
  } catch (err) {
    next(err);
  }
});

// ==================== ORDERS ====================

/**
 * GET /v1/admin/orders
 * لیست سفارشات
 */
router.get('/orders', async (req, res, next) => {
  try {
    const { page = 1, per_page = 10, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(per_page);

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { id: { contains: search as string } },
        { user: { phone: { contains: search as string } } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: Number(per_page),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { phone: true, email: true } },
          items: {
            include: {
              variant: {
                include: { product: { select: { title: true } } }
              }
            }
          },
          payments: true
        }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      data: orders,
      pagination: {
        page: Number(page),
        per_page: Number(per_page),
        total,
        total_pages: Math.ceil(total / Number(per_page))
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /v1/admin/orders/:id/status
 * تغییر وضعیت سفارش
 */
router.put('/orders/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        items: {
          include: {
            variant: {
              include: { product: true }
            }
          }
        }
      }
    });

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// ==================== USERS ====================

/**
 * GET /v1/admin/users
 * لیست کاربران
 */
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, per_page = 10, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(per_page);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { phone: { contains: search as string } },
        { email: { contains: search as string } }
      ];
    }
    
    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(per_page),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          email: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: { orders: true }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      data: users,
      pagination: {
        page: Number(page),
        per_page: Number(per_page),
        total,
        total_pages: Math.ceil(total / Number(per_page))
      }
    });
  } catch (err) {
    next(err);
  }
});

// ==================== CATEGORIES ====================

/**
 * GET /v1/admin/categories
 * لیست دسته‌بندی‌ها
 */
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sort: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    res.json(categories);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /v1/admin/categories
 * ایجاد دسته‌بندی جدید
 */
router.post('/categories', async (req, res, next) => {
  try {
    const categorySchema = z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      isActive: z.boolean().default(true),
      sort: z.number().default(0),
      parentId: z.string().optional()
    });

    const data = categorySchema.parse(req.body);

    const category = await prisma.category.create({
      data
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

// ==================== PRICE FEEDS ====================

/**
 * GET /v1/admin/price-feeds
 * دریافت قیمت‌های طلا
 */
router.get('/price-feeds', async (req, res, next) => {
  try {
    const { symbol, limit = 10 } = req.query;

    const where: any = {};
    if (symbol) {
      where.symbol = symbol;
    }

    const priceFeeds = await prisma.priceFeed.findMany({
      where,
      take: Number(limit),
      orderBy: { fetchedAt: 'desc' }
    });

    res.json(priceFeeds);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /v1/admin/price-feeds/sync
 * همگام‌سازی قیمت‌های طلا از API خارجی
 */
router.post('/price-feeds/sync', async (req, res, next) => {
  try {
    const apiKey = process.env.BRS_API_KEY || 'FreeSV0E1LSgB9RDjuf0QorSLViX8pPG';
    const response = await fetch(`https://BrsApi.ir/Api/Market/Gold_Currency.php?key=${apiKey}`);
    const data = await response.json();

    if (data && Array.isArray(data)) {
      const priceFeeds = data.map((item: any) => ({
        symbol: item.symbol,
        name: item.name,
        url: `https://BrsApi.ir/Api/Market/Gold_Currency.php?key=${apiKey}`,
        nameEn: item.name_en,
        karat: item.karat || null,
        price: parseInt(item.price),
        changeValue: parseInt(item.change_value) || null,
        changePercent: parseFloat(item.change_percent) || null,
        unit: item.unit || 'تومان',
        source: 'BrsApi.ir',
        fetchedAt: new Date()
      }));

      // حذف قیمت‌های قدیمی و اضافه کردن جدید
      await prisma.priceFeed.deleteMany({
        where: { source: 'BrsApi.ir' }
      });

      await prisma.priceFeed.createMany({
        data: priceFeeds
      });

      res.json({ 
        message: 'قیمت‌ها با موفقیت همگام‌سازی شدند',
        count: priceFeeds.length
      });
    } else {
      throw new Error('خطا در دریافت داده‌های قیمت');
    }
  } catch (err) {
    next(err);
  }
});

// ==================== MOUNT ALL ADMIN MODULES ====================

// Mount all admin modules
router.use('/articles', articlesRouter);
router.use('/pages', pagesRouter);
router.use('/menus', menusRouter);
router.use('/banners', bannersRouter);
router.use('/reports', reportsRouter);
router.use('/coupons', couponsRouter);
router.use('/inventory', inventoryRouter);
router.use('/finance', financeRouter);
router.use('/notifications', notificationsRouter);
router.use('/seo', seoRouter);
router.use('/backup', backupRouter);
router.use('/api', apiRouter);
router.use('/analytics', analyticsRouter);

export default router;
