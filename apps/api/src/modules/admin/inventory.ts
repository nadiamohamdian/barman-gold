import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

// Get inventory overview
router.get('/inventory/overview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get total products
    const totalProducts = await prisma.product.count();

    // Get products by stock status
    const stockStatus = await prisma.product.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    // Get low stock products (stock <= 10)
    const lowStockProducts = await prisma.product.count({
      where: {
        stock: {
          lte: 10
        }
      }
    });

    // Get out of stock products
    const outOfStockProducts = await prisma.product.count({
      where: {
        stock: 0
      }
    });

    // Get total inventory value
    const inventoryValue = await prisma.product.aggregate({
      _sum: {
        price: true
      }
    });

    // Get total stock quantity
    const totalStock = await prisma.product.aggregate({
      _sum: {
        stock: true
      }
    });

    // Get recent stock movements
    const recentMovements = await prisma.stockMovement.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        product: {
          select: { id: true, title: true, sku: true }
        },
        user: {
          select: { id: true, email: true }
        }
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
          totalInventoryValue: inventoryValue._sum.price || 0,
          totalStock: totalStock._sum.stock || 0
        },
        stockStatus,
        recentMovements
      }
    });
  } catch (error) {
    console.error('Error fetching inventory overview:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت نمای کلی موجودی' });
  }
});

// Get all products with inventory details
router.get('/inventory/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category = '', 
      stockStatus = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    if (stockStatus) {
      switch (stockStatus) {
        case 'in_stock':
          where.stock = { gt: 10 };
          break;
        case 'low_stock':
          where.stock = { lte: 10, gt: 0 };
          break;
        case 'out_of_stock':
          where.stock = 0;
          break;
      }
    }

    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        include: {
          categories: {
            include: {
              category: {
                select: { id: true, name: true }
              }
            }
          },
          stockMovements: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { id: true, email: true }
              }
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching inventory products:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت محصولات موجودی' });
  }
});

// Update product stock
router.patch('/inventory/products/:id/stock', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      quantity, 
      type, 
      reason, 
      notes 
    } = req.body;

    const userId = (req as any).user.id;

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'محصول یافت نشد' });
    }

    let newStock = product.stock;
    
    if (type === 'add') {
      newStock += Number(quantity);
    } else if (type === 'subtract') {
      newStock -= Number(quantity);
      if (newStock < 0) {
        return res.status(400).json({ success: false, message: 'موجودی نمی‌تواند منفی باشد' });
      }
    } else if (type === 'set') {
      newStock = Number(quantity);
    }

    // Update product stock
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        stock: newStock
      }
    });

    // Create stock movement record
    await prisma.stockMovement.create({
      data: {
        productId: id,
        userId,
        type,
        quantity: Number(quantity),
        previousStock: product.stock,
        newStock,
        reason,
        notes
      }
    });

    res.json({ 
      success: true, 
      data: updatedProduct, 
      message: 'موجودی محصول به‌روزرسانی شد' 
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی موجودی' });
  }
});

// Get stock movements
router.get('/inventory/movements', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      productId = '',
      type = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, title: true, sku: true }
          },
          user: {
            select: { id: true, email: true, phone: true }
          }
        }
      }),
      prisma.stockMovement.count({ where })
    ]);

    res.json({
      success: true,
      data: movements,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت حرکات موجودی' });
  }
});

// Get low stock alerts
router.get('/inventory/alerts', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: Number(threshold)
        }
      },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: {
        stock: 'asc'
      }
    });

    const outOfStockProducts = await prisma.product.findMany({
      where: {
        stock: 0
      },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
        threshold: Number(threshold)
      }
    });
  } catch (error) {
    console.error('Error fetching stock alerts:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت هشدارهای موجودی' });
  }
});

// Bulk stock update
router.post('/inventory/bulk-update', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { updates } = req.body;
    const userId = (req as any).user.id;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: 'لیست به‌روزرسانی‌ها خالی است' });
    }

    const results = [];

    for (const update of updates) {
      const { productId, quantity, type, reason, notes } = update;

      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        results.push({
          productId,
          success: false,
          message: 'محصول یافت نشد'
        });
        continue;
      }

      let newStock = product.stock;
      
      if (type === 'add') {
        newStock += Number(quantity);
      } else if (type === 'subtract') {
        newStock -= Number(quantity);
        if (newStock < 0) {
          results.push({
            productId,
            success: false,
            message: 'موجودی نمی‌تواند منفی باشد'
          });
          continue;
        }
      } else if (type === 'set') {
        newStock = Number(quantity);
      }

      try {
        // Update product stock
        await prisma.product.update({
          where: { id: productId },
          data: {
            stock: newStock
          }
        });

        // Create stock movement record
        await prisma.stockMovement.create({
          data: {
            productId,
            userId,
            type,
            quantity: Number(quantity),
            previousStock: product.stock,
            newStock,
            reason,
            notes
          }
        });

        results.push({
          productId,
          success: true,
          message: 'موجودی به‌روزرسانی شد'
        });
      } catch (error) {
        results.push({
          productId,
          success: false,
          message: 'خطا در به‌روزرسانی موجودی'
        });
      }
    }

    res.json({
      success: true,
      data: results,
      message: 'به‌روزرسانی دسته‌جمعی انجام شد'
    });
  } catch (error) {
    console.error('Error bulk updating stock:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی دسته‌جمعی موجودی' });
  }
});

// Get inventory reports
router.get('/inventory/reports', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate,
      groupBy = 'category'
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get inventory value by category
    const inventoryByCategory = await prisma.category.findMany({
      include: {
        products: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        }
      }
    });

    const categoriesWithValue = inventoryByCategory.map(category => {
      const totalValue = category.products?.reduce((sum: number, product: any) => 
        sum + (product.price * product.stock), 0
      ) || 0;
      const totalStock = category.products?.reduce((sum: number, product: any) => sum + product.stock, 0) || 0;
      const productCount = category.products?.length || 0;

      return {
        ...category,
        inventory: {
          totalValue,
          totalStock,
          productCount,
          averageValue: productCount > 0 ? totalValue / productCount : 0
        }
      };
    });

    // Get stock movements summary
    const movementsSummary = await prisma.stockMovement.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        quantity: true
      },
      _count: {
        id: true
      }
    });

    // Get top products by stock value
    const topProductsByValue = await prisma.product.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        price: 'desc'
      },
      take: 10,
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        categories: categoriesWithValue,
        movementsSummary,
        topProductsByValue,
        period: {
          start,
          end
        }
      }
    });
  } catch (error) {
    console.error('Error generating inventory reports:', error);
    res.status(500).json({ success: false, message: 'خطا در تولید گزارش موجودی' });
  }
});

// Set stock alert threshold
router.post('/inventory/alerts/threshold', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { threshold } = req.body;

    if (threshold < 0) {
      return res.status(400).json({ success: false, message: 'آستانه هشدار نمی‌تواند منفی باشد' });
    }

    // Update admin settings
    await prisma.adminSettings.upsert({
      where: { key: 'stock_alert_threshold' },
      update: { value: threshold.toString() },
      create: { key: 'stock_alert_threshold', value: threshold.toString(), group: 'inventory' }
    });

    res.json({ 
      success: true, 
      message: 'آستانه هشدار موجودی به‌روزرسانی شد' 
    });
  } catch (error) {
    console.error('Error setting stock alert threshold:', error);
    res.status(500).json({ success: false, message: 'خطا در تنظیم آستانه هشدار' });
  }
});

export default router;
