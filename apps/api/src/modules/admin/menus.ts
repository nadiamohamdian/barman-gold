import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

// Get all menus
router.get('/menus', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', location = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (location) {
      where.location = location;
    }

    const [menus, total] = await Promise.all([
      prisma.menu.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          menuItems: {
            orderBy: { order: 'asc' }
          }
        }
      }),
      prisma.menu.count({ where })
    ]);

    res.json({
      success: true,
      data: menus,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching menus:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت منوها' });
  }
});

// Get single menu
router.get('/menus/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        menuItems: {
          orderBy: { order: 'asc' },
          include: {
            children: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!menu) {
      return res.status(404).json({ success: false, message: 'منو یافت نشد' });
    }

    res.json({ success: true, data: menu });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت منو' });
  }
});

// Get menu by location
router.get('/menus/location/:location', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { location } = req.params;
    
    const menu = await prisma.menu.findFirst({
      where: { 
        location,
        isActive: true
      },
      include: {
        menuItems: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!menu) {
      return res.status(404).json({ success: false, message: 'منو یافت نشد' });
    }

    res.json({ success: true, data: menu });
  } catch (error) {
    console.error('Error fetching menu by location:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت منو' });
  }
});

// Create new menu
router.post('/menus', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      isActive,
      items
    } = req.body;

    // Check if location already exists
    const existingMenu = await prisma.menu.findFirst({
      where: { location }
    });

    if (existingMenu) {
      return res.status(400).json({ success: false, message: 'منو برای این مکان قبلاً ایجاد شده است' });
    }

    const menu = await prisma.menu.create({
      data: {
        name,
        description,
        location,
        isActive: isActive === 'true',
        items: items ? JSON.parse(items) : []
      }
    });

    res.status(201).json({ success: true, data: menu, message: 'منو با موفقیت ایجاد شد' });
  } catch (error) {
    console.error('Error creating menu:', error);
    res.status(500).json({ success: false, message: 'خطا در ایجاد منو' });
  }
});

// Update menu
router.put('/menus/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      location,
      isActive,
      items
    } = req.body;

    // Check if menu exists
    const existingMenu = await prisma.menu.findUnique({
      where: { id }
    });

    if (!existingMenu) {
      return res.status(404).json({ success: false, message: 'منو یافت نشد' });
    }

    // Check if new location conflicts with existing menus (excluding current menu)
    if (location !== existingMenu.location) {
      const locationConflict = await prisma.menu.findFirst({
        where: { location }
      });

      if (locationConflict) {
        return res.status(400).json({ success: false, message: 'منو برای این مکان قبلاً ایجاد شده است' });
      }
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        name,
        description,
        location,
        isActive: isActive === 'true',
        items: items ? JSON.parse(items) : [],
        updatedAt: new Date()
      }
    });

    res.json({ success: true, data: menu, message: 'منو با موفقیت به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating menu:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی منو' });
  }
});

// Delete menu
router.delete('/menus/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const menu = await prisma.menu.findUnique({
      where: { id }
    });

    if (!menu) {
      return res.status(404).json({ success: false, message: 'منو یافت نشد' });
    }

    await prisma.menu.delete({
      where: { id }
    });

    res.json({ success: true, message: 'منو با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting menu:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف منو' });
  }
});

// Toggle menu status
router.patch('/menus/:id/toggle', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const menu = await prisma.menu.findUnique({
      where: { id }
    });

    if (!menu) {
      return res.status(404).json({ success: false, message: 'منو یافت نشد' });
    }

    const updatedMenu = await prisma.menu.update({
      where: { id },
      data: {
        isActive: !menu.isActive
      }
    });

    res.json({ 
      success: true, 
      data: updatedMenu, 
      message: updatedMenu.isActive ? 'منو فعال شد' : 'منو غیرفعال شد' 
    });
  } catch (error) {
    console.error('Error toggling menu status:', error);
    res.status(500).json({ success: false, message: 'خطا در تغییر وضعیت منو' });
  }
});

// Get menu locations
router.get('/menus/locations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const locations = [
      { id: 'header', name: 'هدر', description: 'منوی اصلی در بالای سایت' },
      { id: 'footer', name: 'فوتر', description: 'منوی فوتر سایت' },
      { id: 'sidebar', name: 'نوار کناری', description: 'منوی نوار کناری' },
      { id: 'mobile', name: 'موبایل', description: 'منوی مخصوص موبایل' },
      { id: 'admin', name: 'ادمین', description: 'منوی پنل ادمین' }
    ];

    res.json({ success: true, data: locations });
  } catch (error) {
    console.error('Error fetching menu locations:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت مکان‌های منو' });
  }
});

// Update menu items order
router.patch('/menus/:id/items/order', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    const menu = await prisma.menu.findUnique({
      where: { id }
    });

    if (!menu) {
      return res.status(404).json({ success: false, message: 'منو یافت نشد' });
    }

    const updatedMenu = await prisma.menu.update({
      where: { id },
      data: {
        items: items
      }
    });

    res.json({ success: true, data: updatedMenu, message: 'ترتیب آیتم‌های منو به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating menu items order:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی ترتیب آیتم‌ها' });
  }
});

export default router;
