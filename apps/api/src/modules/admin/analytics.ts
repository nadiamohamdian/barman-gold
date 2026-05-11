import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

// Get dashboard analytics
router.get('/analytics/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate 
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get basic statistics
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      newUsers,
      newOrders,
      newRevenue
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: { in: ['completed', 'delivered'] } },
        _sum: { totalAmount: true }
      }),
      prisma.user.count({
        where: {
          role: 'customer',
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.order.count({
        where: { createdAt: { gte: start, lte: end } }
      }),
      prisma.order.aggregate({
        where: {
          status: { in: ['completed', 'delivered'] },
          createdAt: { gte: start, lte: end }
        },
        _sum: { totalAmount: true }
      })
    ]);

    // Get sales trend data
    const salesTrend = await prisma.$queryRaw`
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

    // Get top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: start, lte: end },
          status: { in: ['completed', 'delivered'] }
        }
      },
      _sum: { quantity: true, price: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    // Get product details for top products
    const productIds = topProducts.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, price: true, image: true }
    });

    const topProductsWithDetails = topProducts.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        product: product || { id: item.productId, title: 'Unknown Product' }
      };
    });

    // Get order status distribution
    const orderStatuses = await prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { id: true }
    });

    // Get user registration trend
    const userTrend = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as registrations
      FROM \`User\`
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      AND role = 'customer'
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          newUsers,
          newOrders,
          newRevenue: newRevenue._sum.totalAmount || 0
        },
        salesTrend,
        topProducts: topProductsWithDetails,
        orderStatuses,
        userTrend,
        period: { start, end }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت آمار داشبورد' });
  }
});

// Get sales analytics
router.get('/analytics/sales', authMiddleware, adminMiddleware, async (req, res) => {
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
    }

    // Get sales data
    const salesData = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(createdAt, ${dateFormat}) as period,
        COUNT(*) as orders,
        SUM(totalAmount) as revenue,
        AVG(totalAmount) as averageOrderValue,
        COUNT(DISTINCT userId) as uniqueCustomers
      FROM \`Order\`
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      AND status IN ('completed', 'delivered')
      GROUP BY ${groupByClause}
      ORDER BY period ASC
    `;

    // Get sales by payment method
    const salesByPaymentMethod = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: { gte: start, lte: end },
        status: { in: ['completed', 'delivered'] }
      },
      _sum: { totalAmount: true },
      _count: { id: true }
    });

    // Get sales by category
    const salesByCategory = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: start, lte: end },
          status: { in: ['completed', 'delivered'] }
        }
      },
      _sum: { price: true, quantity: true },
      _count: { id: true }
    });

    // Get product details for category sales
    const productIds = salesByCategory.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { categories: { include: { category: { select: { name: true } } } } }
    });

    const categorySales = salesByCategory.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        category: product?.categories?.[0]?.category?.name || 'Unknown',
        productName: product?.title || 'Unknown Product'
      };
    });

    res.json({
      success: true,
      data: {
        salesData,
        salesByPaymentMethod,
        categorySales,
        period: { start, end, groupBy }
      }
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت آمار فروش' });
  }
});

// Get user analytics
router.get('/analytics/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate 
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get user registration data
    const userRegistrations = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as registrations
      FROM \`User\`
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      AND role = 'customer'
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    // Get user activity data
    const userActivity = await prisma.user.findMany({
      where: {
        role: 'customer',
        createdAt: { gte: start, lte: end }
      },
      include: {
        orders: {
          where: {
            createdAt: { gte: start, lte: end }
          }
        }
      }
    });

    // Calculate user metrics
    const userMetrics = userActivity.map(user => {
      const totalOrders = user.orders.length;
      const totalSpent = user.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrderDate = totalOrders > 0 ? 
        user.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt : 
        null;

      return {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate,
        registrationDate: user.createdAt
      };
    });

    // Get user segments
    const segments = {
      new: userMetrics.filter(u => u.totalOrders === 0).length,
      regular: userMetrics.filter(u => u.totalOrders >= 1 && u.totalOrders < 5).length,
      loyal: userMetrics.filter(u => u.totalOrders >= 5).length
    };

    // Get top customers
    const topCustomers = userMetrics
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Get user retention data
    const retentionData = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as registration_date,
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN EXISTS(
          SELECT 1 FROM \`Order\` o 
          WHERE o.userId = u.id 
          AND o.createdAt >= u.createdAt 
          AND o.createdAt <= DATE_ADD(u.createdAt, INTERVAL 7 DAY)
        ) THEN 1 END) as week_1_orders,
        COUNT(CASE WHEN EXISTS(
          SELECT 1 FROM \`Order\` o 
          WHERE o.userId = u.id 
          AND o.createdAt >= u.createdAt 
          AND o.createdAt <= DATE_ADD(u.createdAt, INTERVAL 30 DAY)
        ) THEN 1 END) as month_1_orders
      FROM \`User\` u
      WHERE u.createdAt >= ${start} AND u.createdAt <= ${end}
      AND u.role = 'customer'
      GROUP BY DATE(createdAt)
      ORDER BY registration_date ASC
    `;

    res.json({
      success: true,
      data: {
        userRegistrations,
        userMetrics,
        segments,
        topCustomers,
        retentionData,
        period: { start, end }
      }
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت آمار کاربران' });
  }
});

// Get product analytics
router.get('/analytics/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate 
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get product performance
    const productPerformance = await prisma.product.findMany({
      include: {
        orderItems: {
          where: {
            order: {
              createdAt: { gte: start, lte: end },
              status: { in: ['completed', 'delivered'] }
            }
          }
        },
        categories: { include: { category: { select: { name: true } } } }
      }
    });

    // Calculate metrics for each product
    const productsWithMetrics = productPerformance.map(product => {
      const totalSold = (product as any).orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      const totalRevenue = (product as any).orderItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
      const orderCount = new Set((product as any).orderItems?.map((item: any) => item.orderId) || []).size;
      const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

      return {
        ...product,
        metrics: {
          totalSold,
          totalRevenue,
          orderCount,
          averageOrderValue,
          conversionRate: product.views > 0 ? (orderCount / product.views) * 100 : 0
        }
      };
    });

    // Sort by revenue
    productsWithMetrics.sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue);

    // Get category performance
    const categoryPerformance = await prisma.category.findMany({
      include: {
        products: {
          include: {
            product: {
              include: {
                orderItems: {
                  where: {
                    order: {
                      createdAt: { gte: start, lte: end },
                      status: { in: ['completed', 'delivered'] }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const categoriesWithMetrics = categoryPerformance.map(category => {
      const totalSold = (category as any).products?.reduce((sum: number, productCategory: any) => 
        sum + (productCategory.product?.orderItems?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0), 0
      ) || 0;
      const totalRevenue = (category as any).products?.reduce((sum: number, productCategory: any) => 
        sum + (productCategory.product?.orderItems?.reduce((itemSum: number, item: any) => itemSum + (item.price * item.quantity), 0) || 0), 0
      ) || 0;
      const productCount = (category as any).products?.length || 0;

      return {
        ...category,
        metrics: {
          totalSold,
          totalRevenue,
          productCount,
          averageValue: productCount > 0 ? totalRevenue / productCount : 0
        }
      };
    });

    // Get inventory alerts
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lte: 10 } },
      select: { id: true, title: true, stock: true, price: true }
    });

    res.json({
      success: true,
      data: {
        products: productsWithMetrics,
        categories: categoriesWithMetrics,
        lowStockProducts,
        period: { start, end }
      }
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت آمار محصولات' });
  }
});

// Get conversion analytics
router.get('/analytics/conversion', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate 
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get conversion funnel data
    const funnelData = await prisma.$queryRaw`
      SELECT 
        'visitors' as stage,
        COUNT(DISTINCT sessionId) as count
      FROM \`PageView\`
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      
      UNION ALL
      
      SELECT 
        'product_views' as stage,
        COUNT(DISTINCT sessionId) as count
      FROM \`PageView\`
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      AND path LIKE '/products/%'
      
      UNION ALL
      
      SELECT 
        'cart_adds' as stage,
        COUNT(DISTINCT userId) as count
      FROM \`CartItem\`
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      
      UNION ALL
      
      SELECT 
        'checkouts' as stage,
        COUNT(DISTINCT userId) as count
      FROM \`Order\`
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      AND status IN ('pending', 'processing', 'completed', 'delivered')
      
      UNION ALL
      
      SELECT 
        'purchases' as stage,
        COUNT(DISTINCT userId) as count
      FROM \`Order\`
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      AND status IN ('completed', 'delivered')
    `;

    // Get conversion rates by source
    const conversionBySource = await prisma.$queryRaw`
      SELECT 
        pv.source,
        COUNT(DISTINCT pv.sessionId) as visitors,
        COUNT(DISTINCT o.userId) as purchasers,
        ROUND(COUNT(DISTINCT o.userId) / COUNT(DISTINCT pv.sessionId) * 100, 2) as conversion_rate
      FROM \`PageView\` pv
      LEFT JOIN \`Order\` o ON pv.userId = o.userId 
        AND o.createdAt >= ${start} 
        AND o.createdAt <= ${end}
        AND o.status IN ('completed', 'delivered')
      WHERE pv.createdAt >= ${start} AND pv.createdAt <= ${end}
      GROUP BY pv.source
      ORDER BY conversion_rate DESC
    `;

    // Get conversion rates by device
    const conversionByDevice = await prisma.$queryRaw`
      SELECT 
        pv.device,
        COUNT(DISTINCT pv.sessionId) as visitors,
        COUNT(DISTINCT o.userId) as purchasers,
        ROUND(COUNT(DISTINCT o.userId) / COUNT(DISTINCT pv.sessionId) * 100, 2) as conversion_rate
      FROM \`PageView\` pv
      LEFT JOIN \`Order\` o ON pv.userId = o.userId 
        AND o.createdAt >= ${start} 
        AND o.createdAt <= ${end}
        AND o.status IN ('completed', 'delivered')
      WHERE pv.createdAt >= ${start} AND pv.createdAt <= ${end}
      GROUP BY pv.device
      ORDER BY conversion_rate DESC
    `;

    res.json({
      success: true,
      data: {
        funnelData,
        conversionBySource,
        conversionByDevice,
        period: { start, end }
      }
    });
  } catch (error) {
    console.error('Error fetching conversion analytics:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت آمار تبدیل' });
  }
});

// Get real-time analytics
router.get('/analytics/realtime', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get real-time data
    const [
      activeUsers,
      currentOrders,
      recentSales,
      topPages
    ] = await Promise.all([
      prisma.pageView.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: oneHourAgo }
        },
        _count: { userId: true }
      }).then(result => result.length),
      prisma.order.count({
        where: {
          status: { in: ['pending', 'processing'] }
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: oneHourAgo },
          status: { in: ['completed', 'delivered'] }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),
      prisma.pageView.groupBy({
        by: ['page'],
        where: {
          createdAt: { gte: oneHourAgo }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        activeUsers,
        currentOrders,
        recentSales: {
          count: recentSales._count.id || 0,
          revenue: recentSales._sum.totalAmount || 0
        },
        topPages,
        timestamp: now
      }
    });
  } catch (error) {
    console.error('Error fetching real-time analytics:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت آمار لحظه‌ای' });
  }
});

// Export analytics data
router.get('/analytics/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      type = 'sales',
      startDate, 
      endDate,
      format = 'csv'
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'sales':
        data = await prisma.$queryRaw`
          SELECT 
            DATE(createdAt) as date,
            COUNT(*) as orders,
            SUM(totalAmount) as revenue,
            AVG(totalAmount) as average_order_value
          FROM \`Order\`
          WHERE createdAt >= ${start} AND createdAt <= ${end}
          AND status IN ('completed', 'delivered')
          GROUP BY DATE(createdAt)
          ORDER BY date ASC
        `;
        filename = `sales-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'users':
        data = await prisma.$queryRaw`
          SELECT 
            DATE(createdAt) as date,
            COUNT(*) as registrations
          FROM \`User\`
          WHERE createdAt >= ${start} AND createdAt <= ${end}
          AND role = 'customer'
          GROUP BY DATE(createdAt)
          ORDER BY date ASC
        `;
        filename = `user-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'products':
        const products = await prisma.product.findMany({
          include: {
            categories: { include: { category: { select: { name: true } } } },
            orderItems: {
              where: {
                order: {
                  createdAt: { gte: start, lte: end },
                  status: { in: ['completed', 'delivered'] }
                }
              }
            }
          }
        });

        data = products.map(product => {
          const totalSold = (product as any).orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
          const totalRevenue = (product as any).orderItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
          
          return {
            name: product.title,
            category: (product as any).categories?.[0]?.category?.name || 'Unknown',
            price: product.price,
            stock: product.stock,
            total_sold: totalSold,
            total_revenue: totalRevenue
          };
        });
        filename = `product-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        return res.status(400).json({ success: false, message: 'نوع داده نامعتبر است' });
    }

    if (format === 'csv') {
      const csvData = Object.keys(data[0] || {}).join(',') + '\n' + 
        data.map(row => Object.values(row).join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csvData);
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ success: false, message: 'خطا در صادرات آمار' });
  }
});

export default router;
