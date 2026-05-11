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
    const uploadPath = path.join(__dirname, '../../../uploads/articles');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'article-' + uniqueSuffix + path.extname(file.originalname));
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
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all articles with pagination and search
router.get('/articles', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', category = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
        { excerpt: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, email: true, phone: true }
          },
          categories: {
            include: {
              category: true
            }
          }
        }
      }),
      prisma.article.count({ where })
    ]);

    res.json({
      success: true,
      data: articles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت مقالات' });
  }
});

// Get single article
router.get('/articles/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, email: true, phone: true }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    if (!article) {
      return res.status(404).json({ success: false, message: 'مقاله یافت نشد' });
    }

    res.json({ success: true, data: article });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت مقاله' });
  }
});

// Create new article
router.post('/articles', authMiddleware, adminMiddleware, upload.single('featuredImage'), async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      status,
      category,
      tags,
      metaTitle,
      metaDescription,
      featuredImageAlt,
      isPublished,
      publishedAt
    } = req.body;

    const userId = (req as any).user.id;
    const featuredImage = req.file ? `/uploads/articles/${req.file.filename}` : null;

    const article = await prisma.article.create({
      data: {
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, ''),
        content,
        body: content, // duplicate for compatibility
        excerpt,
        status: status || 'draft',
        category,
        tags: tags ? JSON.stringify(tags.split(',').map((tag: string) => tag.trim())) : '[]',
        metaTitle,
        metaDescription,
        featuredImage,
        featuredImageAlt,
        isPublished: isPublished === 'true',
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        authorId: userId
      }
    });

    res.status(201).json({ success: true, data: article, message: 'مقاله با موفقیت ایجاد شد' });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ success: false, message: 'خطا در ایجاد مقاله' });
  }
});

// Update article
router.put('/articles/:id', authMiddleware, adminMiddleware, upload.single('featuredImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      status,
      category,
      tags,
      metaTitle,
      metaDescription,
      featuredImageAlt,
      isPublished,
      publishedAt
    } = req.body;

    const userId = (req as any).user.id;
    const featuredImage = req.file ? `/uploads/articles/${req.file.filename}` : undefined;

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id }
    });

    if (!existingArticle) {
      return res.status(404).json({ success: false, message: 'مقاله یافت نشد' });
    }

    const updateData: any = {
      title,
      content,
      excerpt,
      status,
      category,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      metaTitle,
      metaDescription,
      featuredImageAlt,
      isPublished: isPublished === 'true',
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      updatedAt: new Date()
    };

    if (featuredImage) {
      updateData.featuredImage = featuredImage;
    }

    const article = await prisma.article.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, data: article, message: 'مقاله با موفقیت به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی مقاله' });
  }
});

// Delete article
router.delete('/articles/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { id }
    });

    if (!article) {
      return res.status(404).json({ success: false, message: 'مقاله یافت نشد' });
    }

    // Delete featured image if exists
    if (article.featuredImage) {
      const imagePath = path.join(__dirname, '../../../', article.featuredImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await prisma.article.delete({
      where: { id }
    });

    res.json({ success: true, message: 'مقاله با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف مقاله' });
  }
});

// Get article categories
router.get('/articles/categories', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const categories = await prisma.article.findMany({
      select: { category: true },
      distinct: ['category']
    });

    const uniqueCategories = [...new Set(categories.map(c => c.category))].filter(Boolean);

    res.json({ success: true, data: uniqueCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت دسته‌بندی‌ها' });
  }
});

// Publish/Unpublish article
router.patch('/articles/:id/publish', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const article = await prisma.article.update({
      where: { id },
      data: {
        isPublished: isPublished === true,
        publishedAt: isPublished === true ? new Date() : null
      }
    });

    res.json({ 
      success: true, 
      data: article, 
      message: isPublished ? 'مقاله منتشر شد' : 'مقاله از حالت انتشار خارج شد' 
    });
  } catch (error) {
    console.error('Error updating article status:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی وضعیت مقاله' });
  }
});

export default router;
