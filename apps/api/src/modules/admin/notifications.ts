import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

// Get all notifications
router.get('/notifications', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type = '', 
      status = '',
      search = ''
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { message: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, phone: true, firstName: true, lastName: true }
          }
        }
      }),
      prisma.notification.count({ where })
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت اعلان‌ها' });
  }
});

// Get single notification
router.get('/notifications/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, phone: true, firstName: true, lastName: true }
        }
      }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'اعلان یافت نشد' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت اعلان' });
  }
});

// Create new notification
router.post('/notifications', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      priority = 'medium',
      targetUsers = [],
      targetRoles = [],
      scheduledAt,
      isActive = true
    } = req.body;

    const userId = (req as any).user.id;

    // If no target users or roles specified, send to all users
    let targetUserIds = targetUsers;
    
    if (targetRoles.length > 0) {
      const usersWithRoles = await prisma.user.findMany({
        where: {
          role: {
            in: targetRoles
          }
        },
        select: { id: true }
      });
      
      targetUserIds = [...new Set([...targetUserIds, ...usersWithRoles.map(u => u.id)])];
    }

    if (targetUserIds.length === 0) {
      // Send to all users
      const allUsers = await prisma.user.findMany({
        select: { id: true }
      });
      targetUserIds = allUsers.map(u => u.id);
    }

    // Create notifications for each target user
    const notifications = await Promise.all(
      targetUserIds.map((userId: string) => 
        prisma.notification.create({
          data: {
            title,
            message,
            type,
            priority,
            userId,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            isActive,
            status: scheduledAt ? 'scheduled' : 'pending'
          }
        })
      )
    );

    res.status(201).json({ 
      success: true, 
      data: notifications, 
      message: `اعلان برای ${notifications.length} کاربر ارسال شد` 
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'خطا در ایجاد اعلان' });
  }
});

// Update notification
router.put('/notifications/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      message,
      type,
      priority,
      isActive,
      status
    } = req.body;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'اعلان یافت نشد' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        title,
        message,
        type,
        priority,
        isActive: isActive === 'true',
        status
      }
    });

    res.json({ success: true, data: updatedNotification, message: 'اعلان با موفقیت به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی اعلان' });
  }
});

// Delete notification
router.delete('/notifications/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'اعلان یافت نشد' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({ success: true, message: 'اعلان با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف اعلان' });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'اعلان یافت نشد' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        status: 'read',
        readAt: new Date()
      }
    });

    res.json({ success: true, data: updatedNotification, message: 'اعلان به عنوان خوانده شده علامت‌گذاری شد' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'خطا در علامت‌گذاری اعلان' });
  }
});

// Send email notification
router.post('/notifications/email', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      subject,
      message,
      targetUsers = [],
      targetRoles = [],
      template = 'default'
    } = req.body;

    // Get target users
    let targetUserIds = targetUsers;
    
    if (targetRoles.length > 0) {
      const usersWithRoles = await prisma.user.findMany({
        where: {
          role: {
            in: targetRoles
          }
        },
        select: { id: true, email: true }
      });
      
      targetUserIds = [...new Set([...targetUserIds, ...usersWithRoles.map(u => u.id)])];
    }

    if (targetUserIds.length === 0) {
      return res.status(400).json({ success: false, message: 'هیچ کاربری برای ارسال ایمیل انتخاب نشده است' });
    }

    // Get user emails
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: targetUserIds
        }
      },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    // Create email notifications
    const emailNotifications = await Promise.all(
      users.map(user => 
        prisma.notification.create({
          data: {
            title: subject,
            message,
            type: 'email',
            priority: 'high',
            userId: user.id,
            isActive: true,
            status: 'pending'
          }
        })
      )
    );

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    // For now, just mark as sent
    await prisma.notification.updateMany({
      where: {
        id: {
          in: emailNotifications.map(n => n.id)
        }
      },
      data: {
        status: 'sent',
        sentAt: new Date()
      }
    });

    res.json({ 
      success: true, 
      data: emailNotifications, 
      message: `ایمیل برای ${users.length} کاربر ارسال شد` 
    });
  } catch (error) {
    console.error('Error sending email notification:', error);
    res.status(500).json({ success: false, message: 'خطا در ارسال ایمیل' });
  }
});

// Send SMS notification
router.post('/notifications/sms', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      message,
      targetUsers = [],
      targetRoles = []
    } = req.body;

    // Get target users
    let targetUserIds = targetUsers;
    
    if (targetRoles.length > 0) {
      const usersWithRoles = await prisma.user.findMany({
        where: {
          role: {
            in: targetRoles
          }
        },
        select: { id: true, phone: true }
      });
      
      targetUserIds = [...new Set([...targetUserIds, ...usersWithRoles.map(u => u.id)])];
    }

    if (targetUserIds.length === 0) {
      return res.status(400).json({ success: false, message: 'هیچ کاربری برای ارسال پیامک انتخاب نشده است' });
    }

    // Get user phones
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: targetUserIds
        },
        phone: {
          not: null
        }
      },
      select: { id: true, phone: true, firstName: true, lastName: true }
    });

    // Create SMS notifications
    const smsNotifications = await Promise.all(
      users.map(user => 
        prisma.notification.create({
          data: {
            title: 'پیامک',
            message,
            type: 'sms',
            priority: 'high',
            userId: user.id,
            isActive: true,
            status: 'pending'
          }
        })
      )
    );

    // TODO: Integrate with SMS service (Kavenegar, etc.)
    // For now, just mark as sent
    await prisma.notification.updateMany({
      where: {
        id: {
          in: smsNotifications.map(n => n.id)
        }
      },
      data: {
        status: 'sent',
        sentAt: new Date()
      }
    });

    res.json({ 
      success: true, 
      data: smsNotifications, 
      message: `پیامک برای ${users.length} کاربر ارسال شد` 
    });
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    res.status(500).json({ success: false, message: 'خطا در ارسال پیامک' });
  }
});

// Get notification statistics
router.get('/notifications/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get notification counts by type
    const notificationsByType = await prisma.notification.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _count: {
        id: true
      }
    });

    // Get notification counts by status
    const notificationsByStatus = await prisma.notification.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _count: {
        id: true
      }
    });

    // Get notification counts by priority
    const notificationsByPriority = await prisma.notification.groupBy({
      by: ['priority'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _count: {
        id: true
      }
    });

    // Get total counts
    const totalNotifications = await prisma.notification.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const unreadNotifications = await prisma.notification.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        status: 'unread'
      }
    });

    res.json({
      success: true,
      data: {
        totalNotifications,
        unreadNotifications,
        byType: notificationsByType,
        byStatus: notificationsByStatus,
        byPriority: notificationsByPriority,
        period: {
          start,
          end
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notification statistics:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت آمار اعلان‌ها' });
  }
});

// Get notification types
router.get('/notifications/types', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const types = [
      { id: 'info', name: 'اطلاعاتی', description: 'اعلان‌های اطلاعاتی' },
      { id: 'warning', name: 'هشدار', description: 'اعلان‌های هشدار' },
      { id: 'error', name: 'خطا', description: 'اعلان‌های خطا' },
      { id: 'success', name: 'موفقیت', description: 'اعلان‌های موفقیت' },
      { id: 'email', name: 'ایمیل', description: 'اعلان‌های ایمیل' },
      { id: 'sms', name: 'پیامک', description: 'اعلان‌های پیامک' },
      { id: 'push', name: 'اعلان فوری', description: 'اعلان‌های فوری' }
    ];

    res.json({ success: true, data: types });
  } catch (error) {
    console.error('Error fetching notification types:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت انواع اعلان' });
  }
});

// Get notification priorities
router.get('/notifications/priorities', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const priorities = [
      { id: 'low', name: 'کم', description: 'اولویت کم' },
      { id: 'medium', name: 'متوسط', description: 'اولویت متوسط' },
      { id: 'high', name: 'بالا', description: 'اولویت بالا' },
      { id: 'urgent', name: 'فوری', description: 'اولویت فوری' }
    ];

    res.json({ success: true, data: priorities });
  } catch (error) {
    console.error('Error fetching notification priorities:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت اولویت‌های اعلان' });
  }
});

export default router;
