import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const productQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('12'),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sortBy: z.enum(['newest', 'price-low', 'price-high', 'rating', 'popular']).optional().default('newest'),
  inStock: z.string().optional()
});

const productParamsSchema = z.object({
  id: z.string()
});

// Get all products (public)
router.get('/products', async (req, res) => {
  try {
    const query = productQuerySchema.parse(req.query);
    const skip = (Number(query.page) - 1) * Number(query.limit);

    const where: any = {
      isActive: true
    };

    // Search filter
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    // Category filter
    if (query.category) {
      where.category = { slug: query.category };
    }

    // Price range filter
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = Number(query.minPrice);
      if (query.maxPrice) where.price.lte = Number(query.maxPrice);
    }

    // Stock filter
    if (query.inStock === 'true') {
      where.stock = { gt: 0 };
    }

    // Sort options
    let orderBy: any = { createdAt: 'desc' };
    switch (query.sortBy) {
      case 'price-low':
        orderBy = { price: 'asc' };
        break;
      case 'price-high':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'popular':
        orderBy = { views: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Number(query.limit),
        orderBy,
        include: {
          categories: {
            include: {
              category: {
                select: { id: true, name: true, slug: true }
              }
            }
          },
          media: {
            select: { id: true, url: true, alt: true, sort: true }
          },
          reviews: {
            select: { id: true, rating: true, comment: true, createdAt: true }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    // Calculate average rating for each product
    const productsWithRating = products.map(product => {
      const avgRating = product.reviews.length > 0 
        ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length
        : 0;
      
      return {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: product.reviews.length
      };
    });

    res.json({
      success: true,
      data: productsWithRating,
      pagination: {
        page: Number(query.page),
        limit: Number(query.limit),
        total,
        pages: Math.ceil(total / Number(query.limit))
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت محصولات'
    });
  }
});

// Get single product (public)
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = productParamsSchema.parse(req.params);

    const product = await prisma.product.findFirst({
      where: {
        id: id,
        isActive: true
      },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        media: {
          select: { id: true, url: true, alt: true, sort: true }
        },
        reviews: {
          select: { 
            id: true, 
            rating: true, 
            comment: true, 
            createdAt: true,
            user: {
              select: { firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'محصول یافت نشد'
      });
    }

    // Calculate average rating
    const avgRating = product.reviews.length > 0 
      ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length
      : 0;

    // Increment view count
    await prisma.product.update({
      where: { id: id },
      data: { views: { increment: 1 } }
    });

    res.json({
      success: true,
      data: {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: product.reviews.length
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت محصول'
    });
  }
});

// Get categories (public)
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        _count: {
          select: { 
            products: { 
              where: { 
                // isActive: true 
              } 
            } 
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت دسته‌بندی‌ها'
    });
  }
});

// Get banners (public)
router.get('/banners', async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { 
        // status: 'active',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      orderBy: { order: 'asc' }
    });

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت بنرها'
    });
  }
});

// Get articles (public)
router.get('/articles', async (req, res) => {
  try {
    const { page = 1, limit = 10, category = '', search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      isPublished: true,
      publishedAt: { lte: new Date() }
    };

    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category
          }
        }
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { content: { contains: search as string } },
        { tags: { contains: search as string } }
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { publishedAt: 'desc' },
        include: {
          author: {
            select: { firstName: true, lastName: true }
          },
          categories: {
            include: {
              category: {
                select: { name: true, slug: true }
              }
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
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت مقالات'
    });
  }
});

// Get single article (public)
router.get('/articles/:id', async (req, res) => {
  try {
    const { id } = productParamsSchema.parse(req.params);

    const article = await prisma.article.findFirst({
      where: {
        id: id,
        isPublished: true,
        publishedAt: { lte: new Date() }
      },
      include: {
        author: {
          select: { firstName: true, lastName: true }
        },
        categories: {
          include: {
            category: {
              select: { name: true, slug: true }
            }
          }
        }
      }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'مقاله یافت نشد'
      });
    }

    // Increment view count
    await prisma.article.update({
      where: { id: id },
      data: { views: { increment: 1 } }
    });

    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت مقاله'
    });
  }
});

// Get pages (public)
router.get('/pages', async (req, res) => {
  try {
    const pages = await prisma.page.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        metaTitle: true,
        metaDescription: true
      },
      orderBy: { order: 'asc' }
    });

    res.json({
      success: true,
      data: pages
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت صفحات'
    });
  }
});

// Get single page (public)
router.get('/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const page = await prisma.page.findFirst({
      where: {
        slug,
        isPublished: true
      }
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'صفحه یافت نشد'
      });
    }

    res.json({
      success: true,
      data: page
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت صفحه'
    });
  }
});

// Get gold prices (public)
router.get('/gold-prices', async (req, res) => {
  try {
    // TODO: Integrate with BrsApi.ir
    const mockPrices = {
      gold18: { price: 1250000, change: 15000, changePercent: 1.22 },
      gold21: { price: 1450000, change: 18000, changePercent: 1.26 },
      gold24: { price: 1650000, change: 20000, changePercent: 1.23 },
      halfCoin: { price: 8500000, change: 100000, changePercent: 1.19 },
      fullCoin: { price: 17000000, change: 200000, changePercent: 1.19 },
      lastUpdate: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockPrices
    });
  } catch (error) {
    console.error('Error fetching gold prices:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت قیمت طلا'
    });
  }
});

// Search (public)
router.get('/search', async (req, res) => {
  try {
    const { q: query, type = 'all', limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'کلمه جستجو الزامی است'
      });
    }

    const results: any = {
      products: [],
      articles: [],
      pages: []
    };

    if (type === 'all' || type === 'products') {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query as string } },
            { description: { contains: query as string } },
            { tags: { some: { tag: { contains: query as string } } } }
          ]
        },
        take: Number(limit),
        select: {
          id: true,
          name: true,
          price: true,
          image: true,
          slug: true,
          categories: {
            include: {
              category: { select: { name: true } }
            }
          }
        }
      });
      results.products = products;
    }

    if (type === 'all' || type === 'articles') {
      const articles = await prisma.article.findMany({
        where: {
          isPublished: true,
          publishedAt: { lte: new Date() },
          OR: [
            { title: { contains: query as string } },
            { content: { contains: query as string } },
            { tags: { contains: query as string } }
          ]
        },
        take: Number(limit),
        select: {
          id: true,
          title: true,
          excerpt: true,
          image: true,
          slug: true,
          publishedAt: true
        }
      });
      results.articles = articles;
    }

    if (type === 'all' || type === 'pages') {
      const pages = await prisma.page.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: query as string } },
            { content: { contains: query as string } }
          ]
        },
        take: Number(limit),
        select: {
          id: true,
          title: true,
          slug: true
        }
      });
      results.pages = pages;
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در جستجو'
    });
  }
});

export default router;
