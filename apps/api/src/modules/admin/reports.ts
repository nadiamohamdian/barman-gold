import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

// Sales report
router.get('/reports/sales', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      period = 'daily',
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

    // Get sales data
    const salesData = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(createdAt, ${dateFormat}) as period,
        COUNT(*) as totalOrders,
        SUM(totalAmount) as totalRevenue,
        AVG(totalAmount) as averageOrderValue,
        COUNT(DISTINCT userId) as uniqueCustomers
      FROM \`Order\`
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      GROUP BY ${groupByClause}
      ORDER BY period ASC
    `;

    // Get top selling products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: {
            gte: start,
            lte: end
          }
        }
      },
      _sum: {
        quantity: true,
        price: true
      },
      _count: {
        productId: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 10
    });

    // Get sales by status
    const salesByStatus = await prisma.order.groupBy({
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

    // Calculate totals
    const totals = await prisma.order.aggregate({
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

    res.json({
      success: true,
      data: {
        salesData,
        topProducts,
        salesByStatus,
        totals: {
          totalRevenue: totals._sum.totalAmount || 0,
          totalOrders: totals._count.id || 0,
          averageOrderValue: totals._count.id > 0 ? (totals._sum.totalAmount || 0) / totals._count.id : 0
        },
        period: {
          start,
          end,
          groupBy
        }
      }
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ success: false, message: 'خطا در تولید گزارش فروش' });
  }
});

// Products report
router.get('/reports/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate,
      category,
      status = 'all'
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const where: any = {
      createdAt: {
        gte: start,
        lte: end
      }
    };

    if (category) {
      where.category = category;
    }

    if (status !== 'all') {
      where.status = status;
    }

    // Get product performance data
    const productPerformance = await prisma.product.findMany({
      where,
      include: {
        orderItems: {
          where: {
            order: {
              createdAt: {
                gte: start,
                lte: end
              }
            }
          },
          include: {
            order: true
          }
        },
        categories: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate metrics for each product
    const productsWithMetrics = productPerformance.map(product => {
      const totalSold = product.orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      const totalRevenue = product.orderItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
      const orderCount = new Set(product.orderItems?.map((item: any) => item.orderId) || []).size;

      return {
        ...product,
        metrics: {
          totalSold,
          totalRevenue,
          orderCount,
          averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0
        }
      };
    });

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
                      createdAt: {
                        gte: start,
                        lte: end
                      }
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

      return {
        ...category,
        metrics: {
          totalSold,
          totalRevenue,
          productCount: (category as any).products?.length || 0
        }
      };
    });

    res.json({
      success: true,
      data: {
        products: productsWithMetrics,
        categories: categoriesWithMetrics,
        period: {
          start,
          end
        }
      }
    });
  } catch (error) {
    console.error('Error generating products report:', error);
    res.status(500).json({ success: false, message: 'خطا در تولید گزارش محصولات' });
  }
});

// Customers report
router.get('/reports/customers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate,
      groupBy = 'month'
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get customer registration data
    const customerRegistrations = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        role: 'customer'
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get customer activity data
    const customerActivity = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        role: 'customer'
      },
      include: {
        orders: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        }
      }
    });

    // Calculate customer metrics
    const customersWithMetrics = customerActivity.map(customer => {
      const totalOrders = customer.orders.length;
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrderDate = customer.orders.length > 0 ? 
        customer.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt : 
        null;

      return {
        ...customer,
        metrics: {
          totalOrders,
          totalSpent,
          averageOrderValue,
          lastOrderDate
        }
      };
    });

    // Get top customers by spending
    const topCustomers = customersWithMetrics
      .sort((a, b) => b.metrics.totalSpent - a.metrics.totalSpent)
      .slice(0, 10);

    // Get customer segments
    const segments = {
      new: customersWithMetrics.filter(c => c.metrics.totalOrders === 0).length,
      regular: customersWithMetrics.filter(c => c.metrics.totalOrders >= 1 && c.metrics.totalOrders < 5).length,
      loyal: customersWithMetrics.filter(c => c.metrics.totalOrders >= 5).length
    };

    res.json({
      success: true,
      data: {
        registrations: customerRegistrations,
        customers: customersWithMetrics,
        topCustomers,
        segments,
        period: {
          start,
          end
        }
      }
    });
  } catch (error) {
    console.error('Error generating customers report:', error);
    res.status(500).json({ success: false, message: 'خطا در تولید گزارش مشتریان' });
  }
});

// Inventory report
router.get('/reports/inventory', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: 10 // Products with stock <= 10
        }
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        stock: 'asc'
      }
    });

    // Get out of stock products
    const outOfStockProducts = await prisma.product.findMany({
      where: {
        stock: 0
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    // Get inventory value by category
    const inventoryByCategory = await prisma.category.findMany({
      include: {
        products: true
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

    // Get total inventory value
    const totalInventoryValue = await prisma.product.aggregate({
      _sum: {
        price: true
      }
    });

    const totalProducts = await prisma.product.count();
    const totalStock = await prisma.product.aggregate({
      _sum: {
        stock: true
      }
    });

    res.json({
      success: true,
      data: {
        lowStockProducts,
        outOfStockProducts,
        categories: categoriesWithValue,
        summary: {
          totalInventoryValue: totalInventoryValue._sum.price || 0,
          totalProducts,
          totalStock: totalStock._sum.stock || 0,
          averageValue: totalProducts > 0 ? (totalInventoryValue._sum.price || 0) / totalProducts : 0
        }
      }
    });
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({ success: false, message: 'خطا در تولید گزارش موجودی' });
  }
});

// Financial report
router.get('/reports/financial', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate,
      groupBy = 'month'
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    let dateFormat = '%Y-%m';
    let groupByClause = 'YEAR(createdAt), MONTH(createdAt)';

    switch (groupBy) {
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
        COUNT(*) as orderCount,
        AVG(totalAmount) as averageOrderValue
      FROM \`Order\`
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      AND status IN ('completed', 'delivered')
      GROUP BY ${groupByClause}
      ORDER BY period ASC
    `;

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

    // Calculate totals
    const totals = await prisma.order.aggregate({
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

    res.json({
      success: true,
      data: {
        revenueData,
        paymentMethods,
        orderStatuses,
        totals: {
          totalRevenue: totals._sum.totalAmount || 0,
          totalOrders: totals._count.id || 0,
          averageOrderValue: totals._count.id > 0 ? (totals._sum.totalAmount || 0) / totals._count.id : 0
        },
        period: {
          start,
          end,
          groupBy
        }
      }
    });
  } catch (error) {
    console.error('Error generating financial report:', error);
    res.status(500).json({ success: false, message: 'خطا در تولید گزارش مالی' });
  }
});

// Export report to CSV
router.get('/reports/export/:type', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    let csvData = '';
    let filename = '';

    switch (type) {
      case 'sales':
        const salesData = await prisma.$queryRaw`
          SELECT 
            DATE(createdAt) as date,
            COUNT(*) as orders,
            SUM(totalAmount) as revenue
          FROM \`Order\`
          WHERE createdAt >= ${start} AND createdAt <= ${end}
          GROUP BY DATE(createdAt)
          ORDER BY date ASC
        `;
        
        csvData = 'Date,Orders,Revenue\n' + 
          (salesData as any[]).map(row => `${row.date},${row.orders},${row.revenue}`).join('\n');
        filename = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'products':
        const productsData = await prisma.product.findMany({
          include: {
            categories: {
          include: {
            category: true
          }
        }
          }
        });
        
        csvData = 'Name,Category,Price,Stock,Status\n' + 
          productsData.map(product => 
            `"${product.title}","${(product as any).categories?.[0]?.category?.name || ''}",${product.price},${product.stock},"${product.status}"`
          ).join('\n');
        filename = `products-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'customers':
        const customersData = await prisma.user.findMany({
          where: { role: 'customer' },
          include: {
            orders: {
              where: {
                createdAt: {
                  gte: start,
                  lte: end
                }
              }
            }
          }
        });
        
        csvData = 'Email,Phone,Orders,Total Spent,Last Order\n' + 
          customersData.map(customer => {
            const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
            const lastOrder = customer.orders.length > 0 ? 
              customer.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt.toISOString().split('T')[0] : 
              'Never';
            return `"${customer.email}","${customer.phone || ''}",${customer.orders.length},${totalSpent},"${lastOrder}"`;
          }).join('\n');
        filename = `customers-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        return res.status(400).json({ success: false, message: 'نوع گزارش نامعتبر است' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ success: false, message: 'خطا در صادرات گزارش' });
  }
});

export default router;
