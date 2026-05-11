import { Router } from 'express';
import { prisma } from '../../db/prisma';

const router = Router();

/**
 * GET /v1/meta/catalog
 * categories + distinct karats for active products
 */
router.get('/catalog', async (req, res) => {
  try {
    const [categories, karatRows] = await Promise.all([
      prisma.category.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { karat: true },
        distinct: ['karat'],
      }),
    ]);

    const karats = [...new Set(karatRows.map((r) => r.karat).filter((x) => x != null))] as number[];

    res.json({ categories, karats });
  } catch (err) {
    req.log.error(err, 'Error fetching catalog meta');
    res.status(500).json({ error: 'Internal' });
  }
});

/**
 * GET /v1/meta/tags
 * all tags for articles and products
 */
router.get('/tags', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    res.json({ tags });
  } catch (err) {
    req.log.error(err, 'Error fetching tags');
    res.status(500).json({ error: 'Internal' });
  }
});

export default router;


