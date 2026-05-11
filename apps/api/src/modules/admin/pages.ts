import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

// Get all pages
router.get('/pages', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
        { slug: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    const [pages, total] = await Promise.all([
      prisma.sitePage.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.sitePage.count({ where })
    ]);

    res.json({
      success: true,
      data: pages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت صفحات' });
  }
});

// Get single page
router.get('/pages/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const page = await prisma.sitePage.findUnique({
      where: { id }
    });

    if (!page) {
      return res.status(404).json({ success: false, message: 'صفحه یافت نشد' });
    }

    res.json({ success: true, data: page });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت صفحه' });
  }
});

// Get page by slug
router.get('/pages/slug/:slug', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;
    
    const page = await prisma.sitePage.findUnique({
      where: { slug }
    });

    if (!page) {
      return res.status(404).json({ success: false, message: 'صفحه یافت نشد' });
    }

    res.json({ success: true, data: page });
  } catch (error) {
    console.error('Error fetching page by slug:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت صفحه' });
  }
});

// Create new page
router.post('/pages', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      title,
      content,
      slug,
      metaTitle,
      metaDescription,
      status,
      isPublished,
      template,
      customFields
    } = req.body;

    // Check if slug already exists
    const existingPage = await prisma.sitePage.findUnique({
      where: { slug }
    });

    if (existingPage) {
      return res.status(400).json({ success: false, message: 'این آدرس قبلاً استفاده شده است' });
    }

    const page = await prisma.sitePage.create({
      data: {
        title,
        content,
        slug,
        metaTitle,
        metaDescription,
        status: status || 'draft',
        isPublished: isPublished === 'true',
        template: template || 'default',
        customFields: customFields ? JSON.parse(customFields) : {}
      }
    });

    res.status(201).json({ success: true, data: page, message: 'صفحه با موفقیت ایجاد شد' });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ success: false, message: 'خطا در ایجاد صفحه' });
  }
});

// Update page
router.put('/pages/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      slug,
      metaTitle,
      metaDescription,
      status,
      isPublished,
      template,
      customFields
    } = req.body;

    // Check if page exists
    const existingPage = await prisma.sitePage.findUnique({
      where: { id }
    });

    if (!existingPage) {
      return res.status(404).json({ success: false, message: 'صفحه یافت نشد' });
    }

    // Check if new slug conflicts with existing pages (excluding current page)
    if (slug !== existingPage.slug) {
      const slugConflict = await prisma.sitePage.findUnique({
        where: { slug }
      });

      if (slugConflict) {
        return res.status(400).json({ success: false, message: 'این آدرس قبلاً استفاده شده است' });
      }
    }

    const page = await prisma.sitePage.update({
      where: { id },
      data: {
        title,
        content,
        slug,
        metaTitle,
        metaDescription,
        status,
        isPublished: isPublished === 'true',
        template,
        customFields: customFields ? JSON.parse(customFields) : {},
        updatedAt: new Date()
      }
    });

    res.json({ success: true, data: page, message: 'صفحه با موفقیت به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی صفحه' });
  }
});

// Delete page
router.delete('/pages/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const page = await prisma.sitePage.findUnique({
      where: { id }
    });

    if (!page) {
      return res.status(404).json({ success: false, message: 'صفحه یافت نشد' });
    }

    await prisma.sitePage.delete({
      where: { id }
    });

    res.json({ success: true, message: 'صفحه با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف صفحه' });
  }
});

// Publish/Unpublish page
router.patch('/pages/:id/publish', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const page = await prisma.sitePage.update({
      where: { id },
      data: {
        isPublished: isPublished === true,
        publishedAt: isPublished === true ? new Date() : null
      }
    });

    res.json({ 
      success: true, 
      data: page, 
      message: isPublished ? 'صفحه منتشر شد' : 'صفحه از حالت انتشار خارج شد' 
    });
  } catch (error) {
    console.error('Error updating page status:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی وضعیت صفحه' });
  }
});

// Get page templates
router.get('/pages/templates', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const templates = [
      { id: 'default', name: 'قالب پیش‌فرض', description: 'قالب ساده برای صفحات عمومی' },
      { id: 'about', name: 'درباره ما', description: 'قالب مخصوص صفحه درباره ما' },
      { id: 'contact', name: 'تماس با ما', description: 'قالب مخصوص صفحه تماس' },
      { id: 'privacy', name: 'حریم خصوصی', description: 'قالب مخصوص صفحه حریم خصوصی' },
      { id: 'terms', name: 'قوانین و مقررات', description: 'قالب مخصوص صفحه قوانین' },
      { id: 'custom', name: 'قالب سفارشی', description: 'قالب قابل تنظیم' }
    ];

    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت قالب‌ها' });
  }
});

export default router;
