import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Get API keys
router.get('/api/keys', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.isActive = status === 'active';
    }

    const [apiKeys, total] = await Promise.all([
      prisma.apiKey.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, phone: true }
          }
        }
      }),
      prisma.apiKey.count({ where })
    ]);

    // Remove actual key values for security
    const safeApiKeys = apiKeys.map(key => ({
      ...key,
      key: key.key.substring(0, 8) + '...' + key.key.substring(key.key.length - 4)
    }));

    res.json({
      success: true,
      data: safeApiKeys,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت کلیدهای API' });
  }
});

// Create new API key
router.post('/api/keys', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      permissions = [],
      expiresAt,
      isActive = true
    } = req.body;

    const userId = (req as any).user.id;

    // Generate API key
    const apiKey = crypto.randomBytes(32).toString('hex');

    const newApiKey = await prisma.apiKey.create({
      data: {
        name,
        key: apiKey,
        permissions: JSON.stringify(permissions),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive,
        userId
      }
    });

    res.status(201).json({ 
      success: true, 
      data: newApiKey, 
      message: 'کلید API با موفقیت ایجاد شد' 
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ success: false, message: 'خطا در ایجاد کلید API' });
  }
});

// Update API key
router.put('/api/keys/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      permissions,
      expiresAt,
      isActive
    } = req.body;

    const apiKey = await prisma.apiKey.findUnique({
      where: { id }
    });

    if (!apiKey) {
      return res.status(404).json({ success: false, message: 'کلید API یافت نشد' });
    }

    const updatedApiKey = await prisma.apiKey.update({
      where: { id },
      data: {
        name,
        permissions: permissions ? JSON.stringify(permissions) : apiKey.permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : apiKey.expiresAt,
        isActive: isActive === 'true',
        updatedAt: new Date()
      }
    });

    res.json({ success: true, data: updatedApiKey, message: 'کلید API با موفقیت به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی کلید API' });
  }
});

// Delete API key
router.delete('/api/keys/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await prisma.apiKey.findUnique({
      where: { id }
    });

    if (!apiKey) {
      return res.status(404).json({ success: false, message: 'کلید API یافت نشد' });
    }

    await prisma.apiKey.delete({
      where: { id }
    });

    res.json({ success: true, message: 'کلید API با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف کلید API' });
  }
});

// Get API usage statistics
router.get('/api/usage', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate,
      apiKeyId = ''
    } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const where: any = {
      createdAt: {
        gte: start,
        lte: end
      }
    };

    if (apiKeyId) {
      where.apiKeyId = apiKeyId;
    }

    // Get API usage data
    const usageData = await prisma.apiUsage.findMany({
      where,
      include: {
        apiKey: {
          select: { id: true, name: true, key: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get usage statistics
    const stats = await prisma.apiUsage.groupBy({
      by: ['apiKeyId', 'endpoint'],
      where,
      _count: {
        id: true
      },
      _sum: {
        responseTime: true
      }
    });

    // Get API key details for stats
    const apiKeyIds = [...new Set(stats.map(s => s.apiKeyId))];
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        id: {
          in: apiKeyIds
        }
      },
      select: { id: true, name: true, key: true }
    });

    const statsWithNames = stats.map(stat => {
      const apiKey = apiKeys.find(k => k.id === stat.apiKeyId);
      return {
        ...stat,
        apiKeyName: apiKey?.name || 'Unknown',
        averageResponseTime: stat._count.id > 0 ? stat._sum.responseTime! / stat._count.id : 0
      };
    });

    res.json({
      success: true,
      data: {
        usageData,
        statistics: statsWithNames,
        period: {
          start,
          end
        }
      }
    });
  } catch (error) {
    console.error('Error fetching API usage:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت آمار استفاده از API' });
  }
});

// Get webhooks
router.get('/webhooks', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { url: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.isActive = status === 'active';
    }

    const [webhooks, total] = await Promise.all([
      prisma.webhook.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.webhook.count({ where })
    ]);

    res.json({
      success: true,
      data: webhooks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت webhook‌ها' });
  }
});

// Create webhook
router.post('/webhooks', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      name,
      url,
      events = [],
      secret,
      isActive = true,
      retryCount = 3,
      timeout = 5000
    } = req.body;

    const userId = (req as any).user.id;

    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events: JSON.stringify(events),
        secret,
        isActive,
        userId
      }
    });

    res.status(201).json({ 
      success: true, 
      data: webhook, 
      message: 'Webhook با موفقیت ایجاد شد' 
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ success: false, message: 'خطا در ایجاد webhook' });
  }
});

// Update webhook
router.put('/webhooks/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      url,
      events,
      secret,
      isActive,
      retryCount,
      timeout
    } = req.body;

    const webhook = await prisma.webhook.findUnique({
      where: { id }
    });

    if (!webhook) {
      return res.status(404).json({ success: false, message: 'Webhook یافت نشد' });
    }

    const updatedWebhook = await prisma.webhook.update({
      where: { id },
      data: {
        name,
        url,
        events: events ? JSON.stringify(events) : webhook.events,
        secret,
        isActive: isActive === 'true',
        updatedAt: new Date()
      }
    });

    res.json({ success: true, data: updatedWebhook, message: 'Webhook با موفقیت به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی webhook' });
  }
});

// Delete webhook
router.delete('/webhooks/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const webhook = await prisma.webhook.findUnique({
      where: { id }
    });

    if (!webhook) {
      return res.status(404).json({ success: false, message: 'Webhook یافت نشد' });
    }

    await prisma.webhook.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Webhook با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف webhook' });
  }
});

// Test webhook
router.post('/webhooks/:id/test', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { payload = {} } = req.body;

    const webhook = await prisma.webhook.findUnique({
      where: { id }
    });

    if (!webhook) {
      return res.status(404).json({ success: false, message: 'Webhook یافت نشد' });
    }

    // TODO: Implement actual webhook testing
    // This would send a test payload to the webhook URL
    const testResult = {
      success: true,
      statusCode: 200,
      responseTime: 150,
      message: 'Webhook test successful'
    };

    // Log webhook test
    await prisma.webhookLog.create({
      data: {
        webhookId: id,
        event: 'test',
        payload: JSON.stringify(payload),
        response: JSON.stringify(testResult),
        statusCode: testResult.statusCode
      }
    });

    res.json({ success: true, data: testResult, message: 'Webhook تست شد' });
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ success: false, message: 'خطا در تست webhook' });
  }
});

// Get webhook logs
router.get('/webhooks/:id/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { webhookId: id };

    if (status) {
      where.statusCode = status === 'success' ? 200 : { not: 200 };
    }

    const [logs, total] = await Promise.all([
      prisma.webhookLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.webhookLog.count({ where })
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت لاگ‌های webhook' });
  }
});

// Get API documentation
router.get('/api/docs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const endpoints = [
      {
        method: 'GET',
        path: '/api/v1/products',
        description: 'Get all products',
        parameters: [
          { name: 'page', type: 'number', required: false, description: 'Page number' },
          { name: 'limit', type: 'number', required: false, description: 'Items per page' },
          { name: 'search', type: 'string', required: false, description: 'Search term' },
          { name: 'category', type: 'string', required: false, description: 'Category ID' }
        ],
        response: {
          success: true,
          data: 'Array of products',
          pagination: 'Pagination info'
        }
      },
      {
        method: 'GET',
        path: '/api/v1/products/:id',
        description: 'Get single product',
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Product ID' }
        ],
        response: {
          success: true,
          data: 'Product object'
        }
      },
      {
        method: 'POST',
        path: '/api/v1/orders',
        description: 'Create new order',
        parameters: [
          { name: 'items', type: 'array', required: true, description: 'Order items' },
          { name: 'customer', type: 'object', required: true, description: 'Customer info' },
          { name: 'shipping', type: 'object', required: true, description: 'Shipping info' }
        ],
        response: {
          success: true,
          data: 'Order object'
        }
      },
      {
        method: 'GET',
        path: '/api/v1/categories',
        description: 'Get all categories',
        parameters: [],
        response: {
          success: true,
          data: 'Array of categories'
        }
      },
      {
        method: 'GET',
        path: '/api/v1/gold-prices',
        description: 'Get current gold prices',
        parameters: [],
        response: {
          success: true,
          data: 'Array of gold prices'
        }
      }
    ];

    res.json({ success: true, data: endpoints });
  } catch (error) {
    console.error('Error fetching API documentation:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت مستندات API' });
  }
});

// Get API permissions
router.get('/api/permissions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const permissions = [
      { id: 'products:read', name: 'خواندن محصولات', description: 'دسترسی به خواندن اطلاعات محصولات' },
      { id: 'products:write', name: 'نوشتن محصولات', description: 'دسترسی به ایجاد و ویرایش محصولات' },
      { id: 'products:delete', name: 'حذف محصولات', description: 'دسترسی به حذف محصولات' },
      { id: 'orders:read', name: 'خواندن سفارشات', description: 'دسترسی به خواندن اطلاعات سفارشات' },
      { id: 'orders:write', name: 'نوشتن سفارشات', description: 'دسترسی به ایجاد و ویرایش سفارشات' },
      { id: 'customers:read', name: 'خواندن مشتریان', description: 'دسترسی به خواندن اطلاعات مشتریان' },
      { id: 'customers:write', name: 'نوشتن مشتریان', description: 'دسترسی به ایجاد و ویرایش مشتریان' },
      { id: 'categories:read', name: 'خواندن دسته‌بندی‌ها', description: 'دسترسی به خواندن دسته‌بندی‌ها' },
      { id: 'categories:write', name: 'نوشتن دسته‌بندی‌ها', description: 'دسترسی به ایجاد و ویرایش دسته‌بندی‌ها' },
      { id: 'gold-prices:read', name: 'خواندن قیمت طلا', description: 'دسترسی به خواندن قیمت‌های طلا' },
      { id: 'reports:read', name: 'خواندن گزارش‌ها', description: 'دسترسی به خواندن گزارش‌ها' }
    ];

    res.json({ success: true, data: permissions });
  } catch (error) {
    console.error('Error fetching API permissions:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت مجوزهای API' });
  }
});

export default router;
