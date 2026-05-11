import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

// Get financial overview
router.get('/finance/overview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate 
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get revenue data
    const revenueData = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        status: {
          in: ['completed', 'delivered']
        }
      },
      _sum: {
        totalAmount: true,
        discountAmount: true
      },
      _count: {
        id: true
      }
    });

    // Get previous period for comparison
    const previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
    const previousRevenueData = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: previousStart,
          lt: start
        },
        status: {
          in: ['completed', 'delivered']
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    // Calculate growth rates
    const currentRevenue = revenueData._sum.totalAmount || 0;
    const previousRevenue = previousRevenueData._sum.totalAmount || 0;
    const revenueGrowth = previousRevenue > 0 ? 
      ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const currentOrders = revenueData._count.id || 0;
    const previousOrders = previousRevenueData._count.id || 0;
    const orderGrowth = previousOrders > 0 ? 
      ((currentOrders - previousOrders) / previousOrders) * 100 : 0;

    // Get payment method breakdown
    const paymentMethods = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        status: {
          in: ['completed', 'delivered']
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    // Get order status breakdown
    const orderStatuses = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    // Get top customers by revenue
    const topCustomers = await prisma.user.findMany({
      where: {
        role: 'customer',
        orders: {
          some: {
            createdAt: {
              gte: start,
              lte: end
            },
            status: {
              in: ['completed', 'delivered']
            }
          }
        }
      },
      include: {
        orders: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            },
            status: {
              in: ['completed', 'delivered']
            }
          }
        }
      }
    });

    const customersWithRevenue = topCustomers.map(customer => {
      const totalRevenue = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const orderCount = customer.orders.length;
      return {
        ...customer,
        totalRevenue,
        orderCount,
        averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);

    res.json({
      success: true,
      data: {
        overview: {
          totalRevenue: currentRevenue,
          totalOrders: currentOrders,
          averageOrderValue: currentOrders > 0 ? currentRevenue / currentOrders : 0,
          totalDiscount: revenueData._sum.discountAmount || 0,
          revenueGrowth,
          orderGrowth
        },
        paymentMethods,
        orderStatuses,
        topCustomers: customersWithRevenue,
        period: {
          start,
          end
        }
      }
    });
  } catch (error) {
    console.error('Error fetching financial overview:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت نمای کلی مالی' });
  }
});

// Get revenue analytics
router.get('/finance/revenue', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate,
      groupBy = 'day'
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    let dateFormat = '%Y-%m-%d';
    let groupByClause = 'DATE(createdAt)';

    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        groupByClause = 'DATE(createdAt), HOUR(createdAt)';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        groupByClause = 'DATE(createdAt)';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        groupByClause = 'YEAR(createdAt), WEEK(createdAt)';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        groupByClause = 'YEAR(createdAt), MONTH(createdAt)';
        break;
      case 'year':
        dateFormat = '%Y';
        groupByClause = 'YEAR(createdAt)';
        break;
    }

    // Get revenue data
    const revenueData = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(createdAt, ${dateFormat}) as period,
        SUM(totalAmount) as revenue,
        COUNT(*) as orders,
        AVG(totalAmount) as averageOrderValue,
        SUM(discountAmount) as totalDiscount
      FROM \`Order\`
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      AND status IN ('completed', 'delivered')
      GROUP BY ${groupByClause}
      ORDER BY period ASC
    `;

    // Get revenue by category
    const revenueByCategory = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: {
            gte: start,
            lte: end
          },
          status: {
            in: ['completed', 'delivered']
          }
        }
      },
      _sum: {
        price: true
      },
      _count: {
        id: true
      }
    });

    // Get product details for category revenue
    const productIds = revenueByCategory.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
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
      }
    });

    const categoryRevenue = products.map(product => {
      const revenueData = revenueByCategory.find(item => item.productId === product.id);
      return {
        productId: product.id,
        productName: product.title,
        category: product.categories?.[0]?.category?.name || 'بدون دسته‌بندی',
        revenue: revenueData?._sum.price || 0,
        orderCount: revenueData?._count.id || 0
      };
    });

    res.json({
      success: true,
      data: {
        revenueData,
        categoryRevenue,
        period: {
          start,
          end,
          groupBy
        }
      }
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت تحلیل درآمد' });
  }
});

// Get transaction history
router.get('/finance/transactions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      startDate = '', 
      endDate = '',
      status = '',
      paymentMethod = '',
      search = ''
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    if (status) {
      where.status = status;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (search) {
      where.OR = [
        { id: { contains: search as string, mode: 'insensitive' } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
        { user: { phone: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, phone: true, firstName: true, lastName: true }
          },
          items: {
            include: {
              product: {
                select: { id: true, title: true, sku: true }
              }
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت تراکنش‌ها' });
  }
});

// Get payment analytics
router.get('/finance/payments', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate 
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get payment method breakdown
    const paymentMethods = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        status: {
          in: ['completed', 'delivered']
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    // Get payment status breakdown
    const paymentStatuses = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    // Get daily payment trends
    const dailyPayments = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        paymentMethod,
        COUNT(*) as count,
        SUM(totalAmount) as amount
      FROM \`Order\`
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      AND status IN ('completed', 'delivered')
      GROUP BY DATE(createdAt), paymentMethod
      ORDER BY date ASC
    `;

    // Get failed payments
    const failedPayments = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        status: 'failed'
      },
      include: {
        user: {
          select: { id: true, email: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      data: {
        paymentMethods,
        paymentStatuses,
        dailyPayments,
        failedPayments,
        period: {
          start,
          end
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت تحلیل پرداخت‌ها' });
  }
});

// Get tax reports
router.get('/finance/taxes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate 
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get tax settings
    const taxSettings = await prisma.adminSettings.findMany({
      where: {
        key: {
          in: ['tax_rate', 'tax_enabled', 'tax_inclusive']
        }
      }
    });

    const settings = taxSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as any);

    // Calculate tax data
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        status: {
          in: ['completed', 'delivered']
        }
      }
    });

    const taxRate = parseFloat(settings.tax_rate || '0') / 100;
    const isTaxInclusive = settings.tax_inclusive === 'true';

    let totalTax = 0;
    let totalRevenue = 0;

    orders.forEach(order => {
      totalRevenue += order.totalAmount;
      if (isTaxInclusive) {
        // Tax is already included in the total amount
        totalTax += order.totalAmount * taxRate / (1 + taxRate);
      } else {
        // Tax needs to be calculated
        totalTax += order.totalAmount * taxRate;
      }
    });

    res.json({
      success: true,
      data: {
        settings,
        summary: {
          totalRevenue,
          totalTax,
          netRevenue: totalRevenue - totalTax,
          taxRate: taxRate * 100
        },
        period: {
          start,
          end
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tax reports:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت گزارش مالیات' });
  }
});

// Update tax settings
router.post('/finance/taxes/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      taxRate, 
      taxEnabled, 
      taxInclusive 
    } = req.body;

    const settings = [
      { key: 'tax_rate', value: taxRate.toString() },
      { key: 'tax_enabled', value: taxEnabled.toString() },
      { key: 'tax_inclusive', value: taxInclusive.toString() }
    ];

    for (const setting of settings) {
      await prisma.adminSettings.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
          create: { key: setting.key, value: setting.value, group: 'finance' }
      });
    }

    res.json({ 
      success: true, 
      message: 'تنظیمات مالیات به‌روزرسانی شد' 
    });
  } catch (error) {
    console.error('Error updating tax settings:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی تنظیمات مالیات' });
  }
});

// Export financial data
router.get('/finance/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      type = 'transactions',
      startDate, 
      endDate,
      format = 'csv'
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'transactions':
        data = await prisma.order.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            user: {
              select: { email: true, phone: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        if (format === 'csv') {
          const csvData = 'ID,User Email,User Phone,Total Amount,Status,Payment Method,Created At\n' + 
            data.map(order => 
              `"${order.id}","${order.user.email}","${order.user.phone || ''}",${order.totalAmount},"${order.status}","${order.paymentMethod}","${order.createdAt.toISOString()}"`
            ).join('\n');
          
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`);
          return res.send(csvData);
        }
        filename = `transactions-${new Date().toISOString().split('T')[0]}.json`;
        break;

      case 'revenue':
        const revenueData = await prisma.$queryRaw`
          SELECT 
            DATE(createdAt) as date,
            COUNT(*) as orders,
            SUM(totalAmount) as revenue
          FROM \`Order\`
          WHERE createdAt >= ${start} AND createdAt <= ${end}
          AND status IN ('completed', 'delivered')
          GROUP BY DATE(createdAt)
          ORDER BY date ASC
        `;

        if (format === 'csv') {
          const csvData = 'Date,Orders,Revenue\n' + 
            (revenueData as any[]).map(row => `${row.date},${row.orders},${row.revenue}`).join('\n');
          
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="revenue-${new Date().toISOString().split('T')[0]}.csv"`);
          return res.send(csvData);
        }
        data = revenueData as any[];
        filename = `revenue-${new Date().toISOString().split('T')[0]}.json`;
        break;

      default:
        return res.status(400).json({ success: false, message: 'نوع داده نامعتبر است' });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.json({ success: true, data });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error exporting financial data:', error);
    res.status(500).json({ success: false, message: 'خطا در صادرات داده‌های مالی' });
  }
});

export default router;
