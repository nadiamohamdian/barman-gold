import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().min(1),
    price: z.number().min(0)
  })).min(1, 'حداقل یک محصول باید انتخاب شود'),
  shippingAddress: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    phone: z.string().regex(/^09\d{9}$/),
    address: z.string().min(10),
    city: z.string().min(2),
    postalCode: z.string().min(5),
    notes: z.string().optional()
  }),
  paymentMethod: z.enum(['online', 'cash', 'bank_transfer']),
  notes: z.string().optional()
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  trackingNumber: z.string().optional(),
  notes: z.string().optional()
});

// Create order
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const data = createOrderSchema.parse(req.body);

    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = 50000; // Fixed shipping cost
    const total = subtotal + shippingCost;

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: (req as any).userId,
        status: 'pending',
        subtotal,
        shippingCost,
        total,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        shippingAddress: JSON.stringify(data.shippingAddress),
        items: {
          create: data.items.map(item => ({
            productId: item.productId.toString(),
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            totalPrice: item.price * item.quantity
          }))
        }
      },
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
    });

    // Update product stock
    for (const item of data.items) {
      await prisma.product.update({
        where: { id: item.productId.toString() },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'سفارش با موفقیت ایجاد شد',
      data: order
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات وارد شده نامعتبر است',
        errors: error.issues
      });
    }

    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد سفارش'
    });
  }
});

// Get order by ID
router.get('/:id', authMiddleware, async (req, res) => {
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
                title: true,
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

// Update order status (admin only)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateOrderStatusSchema.parse(req.body);

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (req as any).userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'دسترسی غیرمجاز'
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'سفارش یافت نشد'
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: id },
      data: {
        status: data.status,
        // trackingNumber: data.trackingNumber,
        notes: data.notes,
        updatedAt: new Date()
      },
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
    });

    res.json({
      success: true,
      message: 'وضعیت سفارش به‌روزرسانی شد',
      data: updatedOrder
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات وارد شده نامعتبر است',
        errors: error.issues
      });
    }

    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی وضعیت سفارش'
    });
  }
});

// Cancel order
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: id,
        userId: (req as any).userId
      },
      include: {
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'سفارش یافت نشد'
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'سفارش قبلاً لغو شده است'
      });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'نمی‌توان سفارش تحویل داده شده را لغو کرد'
      });
    }

    // Update order status
    await prisma.order.update({
      where: { id: id },
      data: {
        status: 'cancelled',
        updatedAt: new Date()
      }
    });

    // Restore product stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId.toString() },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'سفارش با موفقیت لغو شد'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در لغو سفارش'
    });
  }
});

// Get order tracking
router.get('/:id/tracking', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: id,
        userId: (req as any).userId
      },
      select: {
        id: true,
        status: true,
        // trackingNumber: true,
        createdAt: true,
        updatedAt: true,
        shippingAddress: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'سفارش یافت نشد'
      });
    }

    // Mock tracking status updates
    const trackingUpdates = [
      {
        status: 'pending',
        message: 'سفارش ثبت شد',
        date: order.createdAt,
        location: 'تهران'
      }
    ];

    if (order.status === 'processing') {
      trackingUpdates.push({
        status: 'processing',
        message: 'سفارش در حال پردازش',
        date: order.updatedAt,
        location: 'تهران'
      });
    }

    if (order.status === 'shipped') {
      trackingUpdates.push(
        {
          status: 'processing',
          message: 'سفارش در حال پردازش',
          date: order.updatedAt,
          location: 'تهران'
        },
        {
          status: 'shipped',
          message: 'سفارش ارسال شد',
          date: order.updatedAt,
          location: 'تهران'
        }
      );
    }

    if (order.status === 'delivered') {
      trackingUpdates.push(
        {
          status: 'processing',
          message: 'سفارش در حال پردازش',
          date: order.updatedAt,
          location: 'تهران'
        },
        {
          status: 'shipped',
          message: 'سفارش ارسال شد',
          date: order.updatedAt,
          location: 'تهران'
        },
        {
          status: 'delivered',
          message: 'سفارش تحویل داده شد',
          date: order.updatedAt,
          location: JSON.parse(order.shippingAddress as string).city
        }
      );
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        trackingNumber: order.id,
        currentStatus: order.status,
        updates: trackingUpdates
      }
    });
  } catch (error) {
    console.error('Get order tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت وضعیت پیگیری'
    });
  }
});

// Get orders by tracking number (public)
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const order = await prisma.order.findFirst({
      where: { id: trackingNumber },
      select: {
        id: true,
        status: true,
        // trackingNumber: true,
        createdAt: true,
        updatedAt: true,
        shippingAddress: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'سفارش با این کد پیگیری یافت نشد'
      });
    }

    // Mock tracking status updates
    const trackingUpdates = [
      {
        status: 'pending',
        message: 'سفارش ثبت شد',
        date: order.createdAt,
        location: 'تهران'
      }
    ];

    if (order.status === 'processing') {
      trackingUpdates.push({
        status: 'processing',
        message: 'سفارش در حال پردازش',
        date: order.updatedAt,
        location: 'تهران'
      });
    }

    if (order.status === 'shipped') {
      trackingUpdates.push(
        {
          status: 'processing',
          message: 'سفارش در حال پردازش',
          date: order.updatedAt,
          location: 'تهران'
        },
        {
          status: 'shipped',
          message: 'سفارش ارسال شد',
          date: order.updatedAt,
          location: 'تهران'
        }
      );
    }

    if (order.status === 'delivered') {
      trackingUpdates.push(
        {
          status: 'processing',
          message: 'سفارش در حال پردازش',
          date: order.updatedAt,
          location: 'تهران'
        },
        {
          status: 'shipped',
          message: 'سفارش ارسال شد',
          date: order.updatedAt,
          location: 'تهران'
        },
        {
          status: 'delivered',
          message: 'سفارش تحویل داده شد',
          date: order.updatedAt,
          location: JSON.parse(order.shippingAddress as string).city
        }
      );
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        trackingNumber: order.id,
        currentStatus: order.status,
        updates: trackingUpdates
      }
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در پیگیری سفارش'
    });
  }
});

export default router;
