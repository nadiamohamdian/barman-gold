import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma';

const router = Router();

const featuredArticlesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(10).default(6),
});

// Price ticker endpoint
router.get('/price-ticker', async (req, res, next) => {
  try {
    // For now, return mock data - in production this would come from a real-time API
    const priceTicker = {
      goldPrice: 1250000, // Price per gram in Toman
      silverPrice: 15000, // Price per gram in Toman
      platinumPrice: 1800000, // Price per gram in Toman
      lastUpdated: new Date().toISOString(),
      currency: 'Toman',
      unit: 'gram'
    };

    res.json(priceTicker);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const result = featuredArticlesQuerySchema.safeParse(req.query);
    if (!result.success) return res.status(400).json({ error: 'Invalid query', details: result.error.flatten() });
    const { limit } = result.data;

    const featuredArticles = await prisma.article.findMany({
      where: { 
        status: 'PUBLISHED',
        publishedAt: { not: null }
      },
      take: limit,
      orderBy: [{ publishedAt: 'desc' }],
      include: {
        author: {
          select: { id: true, email: true }
        },
        media: {
          where: { type: 'cover' },
          take: 1,
          orderBy: { sort: 'asc' }
        },
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } }
          }
        },
        // tags is a JSON string field, not a relation
      }
    });

    res.json({
      featuredArticles: featuredArticles.map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.body.substring(0, 150) + (article.body.length > 150 ? '...' : ''),
        publishedAt: article.publishedAt,
        author: article.authorId,
        coverImage: article.image || null,
        categories: (article as any).categories?.map((ac: any) => ac.category) || [],
        tags: article.tags ? JSON.parse(article.tags) : [],
        readingTime: Math.ceil(article.body.split(' ').length / 200)
      }))
    });
  } catch (err) {
    next(err);
  }
});

export default router;
