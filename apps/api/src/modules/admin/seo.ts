import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

// Get SEO settings
router.get('/seo/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const settings = await prisma.adminSettings.findMany({
      where: {
        key: {
          in: [
            'site_title',
            'site_description',
            'site_keywords',
            'site_author',
            'site_language',
            'site_robots',
            'google_analytics',
            'google_search_console',
            'facebook_pixel',
            'twitter_card',
            'og_image',
            'canonical_url',
            'sitemap_enabled',
            'sitemap_priority',
            'sitemap_changefreq'
          ]
        }
      }
    });

    const seoSettings = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as any);

    res.json({ success: true, data: seoSettings });
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت تنظیمات SEO' });
  }
});

// Update SEO settings
router.post('/seo/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      site_title,
      site_description,
      site_keywords,
      site_author,
      site_language,
      site_robots,
      google_analytics,
      google_search_console,
      facebook_pixel,
      twitter_card,
      og_image,
      canonical_url,
      sitemap_enabled,
      sitemap_priority,
      sitemap_changefreq
    } = req.body;

    const settings = [
      { key: 'site_title', value: site_title },
      { key: 'site_description', value: site_description },
      { key: 'site_keywords', value: site_keywords },
      { key: 'site_author', value: site_author },
      { key: 'site_language', value: site_language },
      { key: 'site_robots', value: site_robots },
      { key: 'google_analytics', value: google_analytics },
      { key: 'google_search_console', value: google_search_console },
      { key: 'facebook_pixel', value: facebook_pixel },
      { key: 'twitter_card', value: twitter_card },
      { key: 'og_image', value: og_image },
      { key: 'canonical_url', value: canonical_url },
      { key: 'sitemap_enabled', value: sitemap_enabled },
      { key: 'sitemap_priority', value: sitemap_priority },
      { key: 'sitemap_changefreq', value: sitemap_changefreq }
    ];

    for (const setting of settings) {
      if (setting.value !== undefined) {
        await prisma.adminSettings.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value, group: 'seo' }
        });
      }
    }

    res.json({ success: true, message: 'تنظیمات SEO به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating SEO settings:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی تنظیمات SEO' });
  }
});

// Generate sitemap
router.get('/seo/sitemap', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { format = 'xml' } = req.query;

    // Get site settings
    const siteSettings = await prisma.adminSettings.findMany({
      where: {
        key: {
          in: ['canonical_url', 'sitemap_priority', 'sitemap_changefreq']
        }
      }
    });

    const settings = siteSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as any);

    const baseUrl = settings.canonical_url || 'https://barmangold.ir';
    const priority = settings.sitemap_priority || '0.8';
    const changefreq = settings.sitemap_changefreq || 'daily';

    // Get all pages
    const pages = await prisma.sitePage.findMany({
      where: {
        isPublished: true
      },
      select: {
        slug: true,
        updatedAt: true
      }
    });

    // Get all products
    const products = await prisma.product.findMany({
      where: {
        status: 'active'
      },
      select: {
        slug: true,
        updatedAt: true
      }
    });

    // Get all categories
    const categories = await prisma.category.findMany({
      where: {
        isActive: true
      },
      select: {
        slug: true,
        updatedAt: true
      }
    });

    // Get all articles
    const articles = await prisma.article.findMany({
      where: {
        isPublished: true
      },
      select: {
        slug: true,
        updatedAt: true
      }
    });

    const urls = [
      { url: baseUrl, lastmod: new Date().toISOString(), priority: '1.0', changefreq: 'daily' },
      { url: `${baseUrl}/products`, lastmod: new Date().toISOString(), priority: '0.9', changefreq: 'daily' },
      { url: `${baseUrl}/about`, lastmod: new Date().toISOString(), priority: '0.7', changefreq: 'monthly' },
      { url: `${baseUrl}/contact`, lastmod: new Date().toISOString(), priority: '0.7', changefreq: 'monthly' },
      ...pages.map(page => ({
        url: `${baseUrl}/pages/${page.slug}`,
        lastmod: page.updatedAt.toISOString(),
        priority,
        changefreq
      })),
      ...products.map(product => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastmod: product.updatedAt.toISOString(),
        priority: '0.8',
        changefreq: 'weekly'
      })),
      ...categories.map(category => ({
        url: `${baseUrl}/categories/${category.slug}`,
        lastmod: category.updatedAt.toISOString(),
        priority: '0.7',
        changefreq: 'weekly'
      })),
      ...articles.map(article => ({
        url: `${baseUrl}/articles/${article.slug}`,
        lastmod: article.updatedAt.toISOString(),
        priority: '0.6',
        changefreq: 'monthly'
      }))
    ];

    if (format === 'xml') {
      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      urls.forEach(url => {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${url.url}</loc>\n`;
        sitemap += `    <lastmod>${url.lastmod}</lastmod>\n`;
        sitemap += `    <changefreq>${url.changefreq}</changefreq>\n`;
        sitemap += `    <priority>${url.priority}</priority>\n`;
        sitemap += '  </url>\n';
      });
      
      sitemap += '</urlset>';

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', 'inline; filename="sitemap.xml"');
      return res.send(sitemap);
    }

    res.json({ success: true, data: urls });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ success: false, message: 'خطا در تولید sitemap' });
  }
});

// Generate robots.txt
router.get('/seo/robots', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const settings = await prisma.adminSettings.findMany({
      where: {
        key: {
          in: ['site_robots', 'canonical_url']
        }
      }
    });

    const siteSettings = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as any);

    const baseUrl = siteSettings.canonical_url || 'https://barmangold.ir';
    const robotsContent = siteSettings.site_robots || `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'inline; filename="robots.txt"');
    res.send(robotsContent);
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.status(500).json({ success: false, message: 'خطا در تولید robots.txt' });
  }
});

// Get SEO analysis for pages
router.get('/seo/analysis', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type = 'all' } = req.query;

    let analysis: any[] = [];

    if (type === 'all' || type === 'pages') {
      const pages = await prisma.sitePage.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          metaTitle: true,
          metaDescription: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const pageAnalysis = pages.map(page => {
        const issues = [];
        
        if (!page.metaTitle) issues.push('عنوان متا ندارد');
        if (!page.metaDescription) issues.push('توضیحات متا ندارد');
        if (page.metaTitle && page.metaTitle.length > 60) issues.push('عنوان متا خیلی طولانی است');
        if (page.metaDescription && page.metaDescription.length > 160) issues.push('توضیحات متا خیلی طولانی است');
        if (page.metaDescription && page.metaDescription.length < 120) issues.push('توضیحات متا خیلی کوتاه است');
        if (!page.isPublished) issues.push('صفحه منتشر نشده است');

        return {
          type: 'page',
          id: page.id,
          title: page.title,
          slug: page.slug,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          isPublished: page.isPublished,
          issues,
          score: Math.max(0, 100 - (issues.length * 20)),
          lastUpdated: page.updatedAt
        };
      });

      analysis = [...analysis, ...pageAnalysis];
    }

    if (type === 'all' || type === 'products') {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          metaTitle: true,
          metaDescription: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const productAnalysis = products.map(product => {
        const issues = [];
        
        if (!product.metaTitle) issues.push('عنوان متا ندارد');
        if (!product.metaDescription) issues.push('توضیحات متا ندارد');
        if (product.metaTitle && product.metaTitle.length > 60) issues.push('عنوان متا خیلی طولانی است');
        if (product.metaDescription && product.metaDescription.length > 160) issues.push('توضیحات متا خیلی طولانی است');
        if (product.metaDescription && product.metaDescription.length < 120) issues.push('توضیحات متا خیلی کوتاه است');
        if (product.status !== 'active') issues.push('محصول غیرفعال است');

        return {
          type: 'product',
          id: product.id,
          title: product.title,
          slug: product.slug,
          metaTitle: product.metaTitle,
          metaDescription: product.metaDescription,
          status: product.status,
          issues,
          score: Math.max(0, 100 - (issues.length * 20)),
          lastUpdated: product.updatedAt
        };
      });

      analysis = [...analysis, ...productAnalysis];
    }

    if (type === 'all' || type === 'articles') {
      const articles = await prisma.article.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          metaTitle: true,
          metaDescription: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const articleAnalysis = articles.map(article => {
        const issues = [];
        
        if (!article.metaTitle) issues.push('عنوان متا ندارد');
        if (!article.metaDescription) issues.push('توضیحات متا ندارد');
        if (article.metaTitle && article.metaTitle.length > 60) issues.push('عنوان متا خیلی طولانی است');
        if (article.metaDescription && article.metaDescription.length > 160) issues.push('توضیحات متا خیلی طولانی است');
        if (article.metaDescription && article.metaDescription.length < 120) issues.push('توضیحات متا خیلی کوتاه است');
        if (!article.isPublished) issues.push('مقاله منتشر نشده است');

        return {
          type: 'article',
          id: article.id,
          title: article.title,
          slug: article.slug,
          metaTitle: article.metaTitle,
          metaDescription: article.metaDescription,
          isPublished: article.isPublished,
          issues,
          score: Math.max(0, 100 - (issues.length * 20)),
          lastUpdated: article.updatedAt
        };
      });

      analysis = [...analysis, ...articleAnalysis];
    }

    // Sort by score (lowest first)
    analysis.sort((a, b) => a.score - b.score);

    // Calculate overall statistics
    const totalItems = analysis.length;
    const averageScore = totalItems > 0 ? analysis.reduce((sum, item) => sum + item.score, 0) / totalItems : 0;
    const criticalIssues = analysis.filter(item => item.score < 50).length;
    const goodItems = analysis.filter(item => item.score >= 80).length;

    res.json({
      success: true,
      data: {
        analysis,
        statistics: {
          totalItems,
          averageScore: Math.round(averageScore),
          criticalIssues,
          goodItems,
          needsAttention: totalItems - goodItems - criticalIssues
        }
      }
    });
  } catch (error) {
    console.error('Error analyzing SEO:', error);
    res.status(500).json({ success: false, message: 'خطا در تحلیل SEO' });
  }
});

// Get keyword suggestions
router.get('/seo/keywords', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { search = '', limit = 10 } = req.query;

    // Get keywords from products
    const productKeywords = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: search as string } },
          { description: { contains: search as string } },
          { tags: { some: { tag: { contains: search as string } } } }
        ]
      },
      select: {
        title: true,
        tags: {
          include: {
            tagRef: {
              select: { name: true }
            }
          }
        }
      },
      take: Number(limit)
    });

    // Get keywords from articles
    const articleKeywords = await prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: search as string } },
          { content: { contains: search as string } },
          { tags: { contains: search as string } }
        ]
      },
      select: {
        title: true,
        tags: true
      },
      take: Number(limit)
    });

    // Extract keywords
    const keywords = new Set<string>();
    
    productKeywords.forEach(product => {
      if ((product as any).tags) {
        (product as any).tags.forEach((productTag: any) => {
          if (productTag.tagRef?.name) {
            keywords.add(productTag.tagRef.name);
          }
        });
      }
      // Extract words from title
      product.title.split(' ').forEach(word => {
        if (word.length > 2) keywords.add(word.toLowerCase());
      });
    });

    articleKeywords.forEach(article => {
      if (article.tags) {
        try {
          const tags = JSON.parse(article.tags);
          if (Array.isArray(tags)) {
            tags.forEach((tag: string) => keywords.add(tag));
          }
        } catch (e) {
          // If not JSON, treat as comma-separated string
          article.tags.split(',').forEach(tag => keywords.add(tag.trim()));
        }
      }
      // Extract words from title
      article.title.split(' ').forEach(word => {
        if (word.length > 2) keywords.add(word.toLowerCase());
      });
    });

    const keywordList = Array.from(keywords)
      .filter(keyword => keyword.includes(search as string))
      .slice(0, Number(limit));

    res.json({ success: true, data: keywordList });
  } catch (error) {
    console.error('Error fetching keywords:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت کلمات کلیدی' });
  }
});

// Update meta tags for content
router.post('/seo/meta/:type/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { metaTitle, metaDescription, metaKeywords } = req.body;

    let updatedItem;

    switch (type) {
      case 'page':
        updatedItem = await prisma.sitePage.update({
          where: { id },
          data: {
            metaTitle,
            metaDescription,
            metaKeywords
          }
        });
        break;

      case 'product':
        updatedItem = await prisma.product.update({
          where: { id },
          data: {
            metaTitle,
            metaDescription,
            metaKeywords
          }
        });
        break;

      case 'article':
        updatedItem = await prisma.article.update({
          where: { id },
          data: {
            metaTitle,
            metaDescription,
            metaKeywords
          }
        });
        break;

      default:
        return res.status(400).json({ success: false, message: 'نوع محتوا نامعتبر است' });
    }

    res.json({ success: true, data: updatedItem, message: 'برچسب‌های متا به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating meta tags:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی برچسب‌های متا' });
  }
});

export default router;
