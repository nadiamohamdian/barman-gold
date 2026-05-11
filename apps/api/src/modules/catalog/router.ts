import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma';

const router = Router();

/**
 * اسکیما‌ی امن برای کوئری لیست
 */
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(12),
  q: z.string().trim().min(1).optional(),
  category: z.string().trim().optional(), // slug دسته
});

/**
 * GET /v1/products
 * ?page=1&per_page=12&q=ring&category=rings
 */
router.get('/', async (req, res, next) => {
  try {
    const result = listQuerySchema.safeParse(req.query);
    if (!result.success) return res.status(400).json({ error: 'Invalid query', details: result.error.flatten() });
    const { page, per_page, q, category } = result.data;
    const skip = (page - 1) * per_page;

    // فیلترها
    const where: any = { isActive: true };

    if (q) {
      // در MySQL با collation پیش‌فرض، contains به‌صورت case-insensitive عمل می‌کند؛ نیازی به mode نیست
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    if (category) {
      // رابطهٔ صحیح: Product.categories (پیوت) ← include: { category: {...} }
      where.categories = {
        some: { category: { slug: category } },
      };
    }

    const total = await prisma.product.count({ where });

    const items = await prisma.product.findMany({
      where,
      skip,
      take: per_page,
      orderBy: [{ createdAt: 'desc' }], // سورت ساده و ایمن
      include: {
        variants: {
          select: {
            id: true,
            sku: true,
            weight_g: true,
            makingFee: true,
            stoneCost: true,
            stockQty: true,
          },
          orderBy: { weight_g: 'asc' },
        },
        media: {
          orderBy: { sort: 'asc' },
          take: 1, // کاور
        },
        // توجه: اینجا خودِ Category را از داخل پیوت include می‌کنیم
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    res.json({
      page,
      per_page,
      total,
      items: items.map((p) => ({
        id: p.id,
        slug: (p as any).slug,
        title: p.title,
        description: p.description,
        karat: p.karat,
        media: p.media,
        categories: p.categories.map((pc) => pc.category),
        variants: p.variants,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /v1/products/:slug
 * برگرداندن محصول با واریانت‌ها، مدیا و دسته‌ها
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug);

    const product = await prisma.product.findFirst({
      where: { isActive: true, slug },
      include: {
        variants: {
          select: {
            id: true,
            sku: true,
            weight_g: true,
            makingFee: true,
            stoneCost: true,
            stockQty: true,
          },
          orderBy: { weight_g: 'asc' },
        },
        media: {
          orderBy: { sort: 'asc' },
        },
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        reviews: {
          where: { isApproved: true },
          select: {
            id: true,
            rating: true,
            body: true,
            userId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json({
      id: product.id,
      slug: (product as any).slug,
      title: product.title,
      description: product.description,
      karat: product.karat,
      media: product.media,
      categories: product.categories.map((pc) => pc.category),
      variants: product.variants,
      reviews: product.reviews,
    });
  } catch (err) {
    next(err);
  }
});

export default router;


