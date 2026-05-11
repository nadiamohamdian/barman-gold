import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

// Get all coupons
router.get('/coupons', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', type = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { code: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.coupon.count({ where })
    ]);

    res.json({
      success: true,
      data: coupons,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت کوپن‌ها' });
  }
});

// Get single coupon
router.get('/coupons/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const coupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'کوپن یافت نشد' });
    }

    res.json({ success: true, data: coupon });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت کوپن' });
  }
});

// Create new coupon
router.post('/coupons', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      code,
      description,
      type,
      value,
      minimumAmount,
      maximumDiscount,
      usageLimit,
      usedCount = 0,
      isActive = true,
      startDate,
      endDate,
      applicableProducts = [],
      applicableCategories = [],
      applicableUsers = []
    } = req.body;

    // Check if code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code }
    });

    if (existingCoupon) {
      return res.status(400).json({ success: false, message: 'این کد کوپن قبلاً استفاده شده است' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        name: code, // use code as name
        description,
        type,
        value: Number(value),
        minimumAmount: minimumAmount ? Number(minimumAmount) : null,
        maximumDiscount: maximumDiscount ? Number(maximumDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        usedCount: Number(usedCount),
        isActive,
        startsAt: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        applicableProducts: JSON.stringify(applicableProducts),
        applicableCategories: JSON.stringify(applicableCategories),
        applicableUsers: JSON.stringify(applicableUsers)
      }
    });

    res.status(201).json({ success: true, data: coupon, message: 'کوپن با موفقیت ایجاد شد' });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ success: false, message: 'خطا در ایجاد کوپن' });
  }
});

// Update coupon
router.put('/coupons/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      type,
      value,
      minimumAmount,
      maximumDiscount,
      usageLimit,
      usedCount,
      isActive,
      startDate,
      endDate,
      applicableProducts,
      applicableCategories,
      applicableUsers
    } = req.body;

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!existingCoupon) {
      return res.status(404).json({ success: false, message: 'کوپن یافت نشد' });
    }

    // Check if new code conflicts with existing coupons (excluding current coupon)
    if (code !== existingCoupon.code) {
      const codeConflict = await prisma.coupon.findUnique({
        where: { code }
      });

      if (codeConflict) {
        return res.status(400).json({ success: false, message: 'این کد کوپن قبلاً استفاده شده است' });
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code,
        description,
        type,
        value: Number(value),
        minimumAmount: minimumAmount ? Number(minimumAmount) : null,
        maximumDiscount: maximumDiscount ? Number(maximumDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        usedCount: usedCount ? Number(usedCount) : existingCoupon.usedCount,
        isActive: isActive === 'true',
        startsAt: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        applicableProducts: applicableProducts ? JSON.stringify(applicableProducts) : existingCoupon.applicableProducts,
        applicableCategories: applicableCategories ? JSON.stringify(applicableCategories) : existingCoupon.applicableCategories,
        applicableUsers: applicableUsers ? JSON.stringify(applicableUsers) : existingCoupon.applicableUsers,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, data: coupon, message: 'کوپن با موفقیت به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی کوپن' });
  }
});

// Delete coupon
router.delete('/coupons/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'کوپن یافت نشد' });
    }

    await prisma.coupon.delete({
      where: { id }
    });

    res.json({ success: true, message: 'کوپن با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف کوپن' });
  }
});

// Toggle coupon status
router.patch('/coupons/:id/toggle', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'کوپن یافت نشد' });
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        isActive: !coupon.isActive
      }
    });

    res.json({ 
      success: true, 
      data: updatedCoupon, 
      message: updatedCoupon.isActive ? 'کوپن فعال شد' : 'کوپن غیرفعال شد' 
    });
  } catch (error) {
    console.error('Error toggling coupon status:', error);
    res.status(500).json({ success: false, message: 'خطا در تغییر وضعیت کوپن' });
  }
});

// Validate coupon
router.post('/coupons/validate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { code, userId, orderAmount, productIds = [], categoryIds = [] } = req.body;

    const coupon = await prisma.coupon.findUnique({
      where: { code }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'کوپن یافت نشد' });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'کوپن غیرفعال است' });
    }

    // Check if coupon is within date range
    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return res.status(400).json({ success: false, message: 'کوپن هنوز فعال نشده است' });
    }

    if (coupon.endDate && now > coupon.endDate) {
      return res.status(400).json({ success: false, message: 'کوپن منقضی شده است' });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'حد استفاده از کوپن تمام شده است' });
    }

    // Check minimum amount
    if (coupon.minimumAmount && orderAmount < coupon.minimumAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `حداقل مبلغ سفارش باید ${coupon.minimumAmount} تومان باشد` 
      });
    }

    // Check applicable products
    if (coupon.applicableProducts && coupon.applicableProducts !== '[]') {
      const applicableProducts = JSON.parse(coupon.applicableProducts);
      if (applicableProducts.length > 0) {
        const hasApplicableProduct = productIds.some((id: string) => applicableProducts.includes(id));
        if (!hasApplicableProduct) {
          return res.status(400).json({ success: false, message: 'کوپن برای این محصولات قابل استفاده نیست' });
        }
      }
    }

    // Check applicable categories
    if (coupon.applicableCategories && coupon.applicableCategories !== '[]') {
      const applicableCategories = JSON.parse(coupon.applicableCategories);
      if (applicableCategories.length > 0) {
        const hasApplicableCategory = categoryIds.some((id: string) => applicableCategories.includes(id));
        if (!hasApplicableCategory) {
          return res.status(400).json({ success: false, message: 'کوپن برای این دسته‌بندی‌ها قابل استفاده نیست' });
        }
      }
    }

    // Check applicable users
    if (coupon.applicableUsers && coupon.applicableUsers !== '[]') {
      const applicableUsers = JSON.parse(coupon.applicableUsers);
      if (applicableUsers.length > 0 && !applicableUsers.includes(userId)) {
        return res.status(400).json({ success: false, message: 'کوپن برای این کاربر قابل استفاده نیست' });
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (orderAmount * coupon.value) / 100;
      if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
        discount = coupon.maximumDiscount;
      }
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    }

    res.json({
      success: true,
      data: {
        coupon,
        discount,
        finalAmount: orderAmount - discount
      },
      message: 'کوپن معتبر است'
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ success: false, message: 'خطا در اعتبارسنجی کوپن' });
  }
});

// Get coupon usage statistics
router.get('/coupons/:id/usage', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const coupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'کوپن یافت نشد' });
    }

    // Get usage data
    const usageData = await prisma.order.findMany({
      where: {
        couponCode: coupon.code,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        user: {
          select: { id: true, email: true, phone: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalUsage = usageData.length;
    const totalDiscount = usageData.reduce((sum, order) => sum + (order.discountAmount || 0), 0);
    const totalRevenue = usageData.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({
      success: true,
      data: {
        coupon,
        usage: {
          totalUsage,
          totalDiscount,
          totalRevenue,
          averageOrderValue: totalUsage > 0 ? totalRevenue / totalUsage : 0
        },
        usageData,
        period: {
          start,
          end
        }
      }
    });
  } catch (error) {
    console.error('Error fetching coupon usage:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت آمار استفاده از کوپن' });
  }
});

// Get coupon types
router.get('/coupons/types', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const types = [
      { id: 'percentage', name: 'درصدی', description: 'تخفیف بر اساس درصد' },
      { id: 'fixed', name: 'مبلغی', description: 'تخفیف مبلغ ثابت' },
      { id: 'free_shipping', name: 'ارسال رایگان', description: 'ارسال رایگان' },
      { id: 'buy_one_get_one', name: 'خرید یک، دریافت یک', description: 'خرید یک محصول، دریافت یک محصول رایگان' }
    ];

    res.json({ success: true, data: types });
  } catch (error) {
    console.error('Error fetching coupon types:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت انواع کوپن' });
  }
});

export default router;
