import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../uploads/banners');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all banners
router.get('/banners', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type = '', status = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { linkText: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [banners, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { order: 'asc' }
      }),
      prisma.banner.count({ where })
    ]);

    res.json({
      success: true,
      data: banners,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت بنرها' });
  }
});

// Get single banner
router.get('/banners/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await prisma.banner.findUnique({
      where: { id }
    });

    if (!banner) {
      return res.status(404).json({ success: false, message: 'بنر یافت نشد' });
    }

    res.json({ success: true, data: banner });
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت بنر' });
  }
});

// Get banners by type
router.get('/banners/type/:type', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const { status = 'active' } = req.query;
    
    const where: any = { type };
    
    if (status) {
      where.status = status;
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    res.json({ success: true, data: banners });
  } catch (error) {
    console.error('Error fetching banners by type:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت بنرها' });
  }
});

// Create new banner
router.post('/banners', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      linkUrl,
      linkText,
      type,
      position,
      status,
      isActive,
      startDate,
      endDate,
      order,
      backgroundColor,
      textColor,
      buttonColor,
      buttonTextColor
    } = req.body;

    const image = req.file ? `/uploads/banners/${req.file.filename}` : '/uploads/banners/default.jpg';

    const banner = await prisma.banner.create({
      data: {
        title,
        description,
        image,
        link: linkUrl,
        position: position || 'home',
        isActive: isActive === 'true',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        order: order ? Number(order) : 0
      }
    });

    res.status(201).json({ success: true, data: banner, message: 'بنر با موفقیت ایجاد شد' });
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ success: false, message: 'خطا در ایجاد بنر' });
  }
});

// Update banner
router.put('/banners/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      linkUrl,
      linkText,
      type,
      position,
      status,
      isActive,
      startDate,
      endDate,
      order,
      backgroundColor,
      textColor,
      buttonColor,
      buttonTextColor
    } = req.body;

    const image = req.file ? `/uploads/banners/${req.file.filename}` : undefined;

    // Check if banner exists
    const existingBanner = await prisma.banner.findUnique({
      where: { id }
    });

    if (!existingBanner) {
      return res.status(404).json({ success: false, message: 'بنر یافت نشد' });
    }

    const updateData: any = {
      title,
      description,
      linkUrl,
      linkText,
      type,
      position,
      status,
      isActive: isActive === 'true',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      order: order ? Number(order) : 0,
      backgroundColor,
      textColor,
      buttonColor,
      buttonTextColor,
      updatedAt: new Date()
    };

    if (image) {
      // Delete old image if exists
      if (existingBanner.image) {
        const oldImagePath = path.join(__dirname, '../../../', existingBanner.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = image;
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, data: banner, message: 'بنر با موفقیت به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی بنر' });
  }
});

// Delete banner
router.delete('/banners/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await prisma.banner.findUnique({
      where: { id }
    });

    if (!banner) {
      return res.status(404).json({ success: false, message: 'بنر یافت نشد' });
    }

    // Delete image if exists
    if (banner.image) {
      const imagePath = path.join(__dirname, '../../../', banner.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await prisma.banner.delete({
      where: { id }
    });

    res.json({ success: true, message: 'بنر با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف بنر' });
  }
});

// Toggle banner status
router.patch('/banners/:id/toggle', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await prisma.banner.findUnique({
      where: { id }
    });

    if (!banner) {
      return res.status(404).json({ success: false, message: 'بنر یافت نشد' });
    }

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: {
        isActive: !banner.isActive
      }
    });

    res.json({ 
      success: true, 
      data: updatedBanner, 
      message: updatedBanner.isActive ? 'بنر فعال شد' : 'بنر غیرفعال شد' 
    });
  } catch (error) {
    console.error('Error toggling banner status:', error);
    res.status(500).json({ success: false, message: 'خطا در تغییر وضعیت بنر' });
  }
});

// Update banner order
router.patch('/banners/:id/order', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { order } = req.body;

    const banner = await prisma.banner.update({
      where: { id },
      data: { order: Number(order) }
    });

    res.json({ success: true, data: banner, message: 'ترتیب بنر به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating banner order:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی ترتیب بنر' });
  }
});

// Get banner types
router.get('/banners/types', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const types = [
      { id: 'banner', name: 'بنر', description: 'بنر معمولی' },
      { id: 'slider', name: 'اسلایدر', description: 'اسلایدر تصاویر' },
      { id: 'carousel', name: 'کاروسل', description: 'کاروسل محصولات' },
      { id: 'advertisement', name: 'تبلیغات', description: 'تبلیغات' },
      { id: 'promotion', name: 'تخفیف', description: 'بنر تخفیف' }
    ];

    res.json({ success: true, data: types });
  } catch (error) {
    console.error('Error fetching banner types:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت انواع بنر' });
  }
});

// Get banner positions
router.get('/banners/positions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const positions = [
      { id: 'home', name: 'صفحه اصلی', description: 'بالای صفحه اصلی' },
      { id: 'header', name: 'هدر', description: 'در هدر سایت' },
      { id: 'sidebar', name: 'نوار کناری', description: 'در نوار کناری' },
      { id: 'footer', name: 'فوتر', description: 'در فوتر سایت' },
      { id: 'product', name: 'صفحه محصول', description: 'در صفحات محصولات' },
      { id: 'category', name: 'دسته‌بندی', description: 'در صفحات دسته‌بندی' }
    ];

    res.json({ success: true, data: positions });
  } catch (error) {
    console.error('Error fetching banner positions:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت موقعیت‌های بنر' });
  }
});

export default router;
