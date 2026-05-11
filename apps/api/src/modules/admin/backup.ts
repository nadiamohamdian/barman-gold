import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = Router();
const prisma = new PrismaClient();
const execAsync = promisify(exec);

// Get backup list
router.get('/backup/list', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../../backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sql') || file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

    res.json({ success: true, data: files });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت لیست بک‌آپ‌ها' });
  }
});

// Create database backup
router.post('/backup/database', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type = 'full' } = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../../../backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `database-${type}-${timestamp}.sql`);

    // Get database connection details from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ success: false, message: 'تنظیمات دیتابیس یافت نشد' });
    }

    // Parse database URL
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || '3306';
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;

    // Create mysqldump command
    const command = `mysqldump -h ${host} -P ${port} -u ${username} -p${password} ${database} > ${backupFile}`;

    try {
      await execAsync(command);
      
      // Verify backup file was created
      if (fs.existsSync(backupFile)) {
        const stats = fs.statSync(backupFile);
        
        // Log backup creation
        await prisma.auditLog.create({
          data: {
            userId: (req as any).user.id,
            action: 'backup_created',
            resource: 'database',
            details: JSON.stringify({
              type,
              filename: path.basename(backupFile),
              size: stats.size
            })
          }
        });

        res.json({ 
          success: true, 
          data: {
            filename: path.basename(backupFile),
            size: stats.size,
            createdAt: stats.birthtime
          },
          message: 'بک‌آپ دیتابیس با موفقیت ایجاد شد' 
        });
      } else {
        throw new Error('فایل بک‌آپ ایجاد نشد');
      }
    } catch (error) {
      console.error('Error creating database backup:', error);
      res.status(500).json({ success: false, message: 'خطا در ایجاد بک‌آپ دیتابیس' });
    }
  } catch (error) {
    console.error('Error creating database backup:', error);
    res.status(500).json({ success: false, message: 'خطا در ایجاد بک‌آپ دیتابیس' });
  }
});

// Create data backup (JSON)
router.post('/backup/data', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { tables = [] } = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../../../backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `data-${timestamp}.json`);

    // Get all data from specified tables or all tables
    const allTables = [
      'User', 'Product', 'Category', 'Order', 'OrderItem', 'Article', 'SitePage', 
      'Banner', 'Menu', 'Coupon', 'PriceFeed', 'AdminSettings', 'Role', 'Permission',
      'UserRole', 'RolePermission', 'AuditLog', 'StockMovement', 'Notification'
    ];

    const tablesToBackup = tables.length > 0 ? tables : allTables;
    const backupData: any = {};

    for (const table of tablesToBackup) {
      try {
        const data = await (prisma as any)[table].findMany();
        backupData[table] = data;
      } catch (error) {
        console.warn(`Could not backup table ${table}:`, error);
        backupData[table] = [];
      }
    }

    // Write backup to file
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    // Log backup creation
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'backup_created',
        resource: 'data',
        details: JSON.stringify({
          tables: tablesToBackup,
          filename: path.basename(backupFile),
          size: fs.statSync(backupFile).size
        })
      }
    });

    res.json({ 
      success: true, 
      data: {
        filename: path.basename(backupFile),
        size: fs.statSync(backupFile).size,
        createdAt: new Date(),
        tables: tablesToBackup
      },
      message: 'بک‌آپ داده‌ها با موفقیت ایجاد شد' 
    });
  } catch (error) {
    console.error('Error creating data backup:', error);
    res.status(500).json({ success: false, message: 'خطا در ایجاد بک‌آپ داده‌ها' });
  }
});

// Restore database backup
router.post('/backup/restore/database', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { filename } = req.body;
    const backupDir = path.join(__dirname, '../../../backups');
    const backupFile = path.join(backupDir, filename);

    if (!fs.existsSync(backupFile)) {
      return res.status(404).json({ success: false, message: 'فایل بک‌آپ یافت نشد' });
    }

    // Get database connection details
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ success: false, message: 'تنظیمات دیتابیس یافت نشد' });
    }

    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || '3306';
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;

    // Create mysql command to restore
    const command = `mysql -h ${host} -P ${port} -u ${username} -p${password} ${database} < ${backupFile}`;

    try {
      await execAsync(command);
      
      // Log restore operation
      await prisma.auditLog.create({
        data: {
          userId: (req as any).user.id,
          action: 'backup_restored',
          resource: 'database',
          details: JSON.stringify({
            filename
          })
        }
      });

      res.json({ success: true, message: 'دیتابیس با موفقیت بازگردانی شد' });
    } catch (error) {
      console.error('Error restoring database backup:', error);
      res.status(500).json({ success: false, message: 'خطا در بازگردانی دیتابیس' });
    }
  } catch (error) {
    console.error('Error restoring database backup:', error);
    res.status(500).json({ success: false, message: 'خطا در بازگردانی دیتابیس' });
  }
});

// Restore data backup
router.post('/backup/restore/data', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { filename, tables = [] } = req.body;
    const backupDir = path.join(__dirname, '../../../backups');
    const backupFile = path.join(backupDir, filename);

    if (!fs.existsSync(backupFile)) {
      return res.status(404).json({ success: false, message: 'فایل بک‌آپ یافت نشد' });
    }

    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    // Restore specified tables or all tables
    const tablesToRestore = tables.length > 0 ? tables : Object.keys(backupData);
    const restoredTables = [];

    for (const table of tablesToRestore) {
      if (backupData[table] && Array.isArray(backupData[table])) {
        try {
          // Clear existing data
          await (prisma as any)[table].deleteMany();
          
          // Insert backup data
          if (backupData[table].length > 0) {
            await (prisma as any)[table].createMany({
              data: backupData[table]
            });
          }
          
          restoredTables.push(table);
        } catch (error) {
          console.warn(`Could not restore table ${table}:`, error);
        }
      }
    }

    // Log restore operation
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'backup_restored',
        resource: 'data',
        details: JSON.stringify({
          filename,
          tables: restoredTables
        })
      }
    });

    res.json({ 
      success: true, 
      data: { restoredTables },
      message: `داده‌های ${restoredTables.length} جدول با موفقیت بازگردانی شد` 
    });
  } catch (error) {
    console.error('Error restoring data backup:', error);
    res.status(500).json({ success: false, message: 'خطا در بازگردانی داده‌ها' });
  }
});

// Delete backup file
router.delete('/backup/:filename', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '../../../backups');
    const backupFile = path.join(backupDir, filename);

    if (!fs.existsSync(backupFile)) {
      return res.status(404).json({ success: false, message: 'فایل بک‌آپ یافت نشد' });
    }

    fs.unlinkSync(backupFile);

    // Log deletion
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'backup_deleted',
        resource: 'backup',
        details: JSON.stringify({ filename })
      }
    });

    res.json({ success: true, message: 'فایل بک‌آپ حذف شد' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف فایل بک‌آپ' });
  }
});

// Get audit logs
router.get('/audit-logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      action = '', 
      resource = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
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

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          action: true,
          resource: true,
          resourceId: true,
          details: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true
        }
      }),
      prisma.auditLog.count({ where })
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
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت لاگ‌های حسابرسی' });
  }
});

// Get security settings
router.get('/security/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const settings = await prisma.adminSettings.findMany({
      where: {
        key: {
          in: [
            'password_min_length',
            'password_require_uppercase',
            'password_require_lowercase',
            'password_require_numbers',
            'password_require_symbols',
            'session_timeout',
            'max_login_attempts',
            'lockout_duration',
            'two_factor_enabled',
            'ip_whitelist',
            'rate_limit_enabled',
            'rate_limit_requests',
            'rate_limit_window'
          ]
        }
      }
    });

    const securitySettings = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as any);

    res.json({ success: true, data: securitySettings });
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت تنظیمات امنیتی' });
  }
});

// Update security settings
router.post('/security/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      password_min_length,
      password_require_uppercase,
      password_require_lowercase,
      password_require_numbers,
      password_require_symbols,
      session_timeout,
      max_login_attempts,
      lockout_duration,
      two_factor_enabled,
      ip_whitelist,
      rate_limit_enabled,
      rate_limit_requests,
      rate_limit_window
    } = req.body;

    const settings = [
      { key: 'password_min_length', value: password_min_length },
      { key: 'password_require_uppercase', value: password_require_uppercase },
      { key: 'password_require_lowercase', value: password_require_lowercase },
      { key: 'password_require_numbers', value: password_require_numbers },
      { key: 'password_require_symbols', value: password_require_symbols },
      { key: 'session_timeout', value: session_timeout },
      { key: 'max_login_attempts', value: max_login_attempts },
      { key: 'lockout_duration', value: lockout_duration },
      { key: 'two_factor_enabled', value: two_factor_enabled },
      { key: 'ip_whitelist', value: ip_whitelist },
      { key: 'rate_limit_enabled', value: rate_limit_enabled },
      { key: 'rate_limit_requests', value: rate_limit_requests },
      { key: 'rate_limit_window', value: rate_limit_window }
    ];

    for (const setting of settings) {
      if (setting.value !== undefined) {
        await prisma.adminSettings.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value, group: 'backup' }
        });
      }
    }

    // Log security settings update
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'security_settings_updated',
        resource: 'settings',
        details: JSON.stringify({ settings: Object.keys(settings) })
      }
    });

    res.json({ success: true, message: 'تنظیمات امنیتی به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی تنظیمات امنیتی' });
  }
});

// Get system health
router.get('/system/health', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Check database connection
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbTime = Date.now() - dbStart;

    // Get system statistics
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.article.count()
    ]);

    const [userCount, productCount, orderCount, articleCount] = stats;

    // Check disk space
    const backupDir = path.join(__dirname, '../../../backups');
    let diskSpace = 0;
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir);
      diskSpace = files.reduce((total, file) => {
        const filePath = path.join(backupDir, file);
        return total + fs.statSync(filePath).size;
      }, 0);
    }

    res.json({
      success: true,
      data: {
        database: {
          connected: true,
          responseTime: dbTime
        },
        statistics: {
          users: userCount,
          products: productCount,
          orders: orderCount,
          articles: articleCount
        },
        diskSpace: {
          used: diskSpace,
          usedMB: Math.round(diskSpace / 1024 / 1024)
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({ success: false, message: 'خطا در بررسی وضعیت سیستم' });
  }
});

export default router;
