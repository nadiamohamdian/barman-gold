import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Seed Categories
  console.log('📁 Seeding categories...');
  const categories = await seedCategories();
  console.log(`✅ Created ${categories.length} categories\n`);

  // Seed Tags
  console.log('🏷️ Seeding tags...');
  const tags = await seedTags();
  console.log(`✅ Created ${tags.length} tags\n`);

  // Seed Users
  console.log('👥 Seeding users...');
  const users = await seedUsers();
  console.log(`✅ Created ${users.length} users\n`);

  // Seed Products
  console.log('💍 Seeding products...');
  const products = await seedProducts();
  console.log(`✅ Created ${products.length} products\n`);

  // Seed Articles
  console.log('📰 Seeding articles...');
  const articles = await seedArticles();
  console.log(`✅ Created ${articles.length} articles\n`);

  // Seed Price Rules
  console.log('💰 Seeding price rules...');
  const priceRules = await seedPriceRules();
  console.log(`✅ Created ${priceRules.length} price rules\n`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Tags: ${tags.length}`);
  console.log(`   Users: ${users.length}`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Articles: ${articles.length}`);
  console.log(`   Price Rules: ${priceRules.length}`);
}

async function seedCategories() {
  const categoryData = [
    { name: 'دستبند', slug: 'bracelets', description: 'دستبندهای طلا و جواهرات' },
    { name: 'گردنبند', slug: 'necklaces', description: 'گردنبندهای طلا و جواهرات' },
    { name: 'انگشتر', slug: 'rings', description: 'انگشترهای طلا و جواهرات' },
    { name: 'گوشواره', slug: 'earrings', description: 'گوشواره‌های طلا و جواهرات' },
    { name: 'ساعت', slug: 'watches', description: 'ساعت‌های طلا و جواهرات' },
    { name: 'پیرسینگ', slug: 'piercings', description: 'پیرسینگ‌های طلا و جواهرات' },
  ];

  const categories = [];
  for (const data of categoryData) {
    const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (!existing) {
      const category = await prisma.category.create({ data });
      categories.push(category);
    } else {
      categories.push(existing);
    }
  }
  return categories;
}

async function seedTags() {
  const tagData = [
    { name: 'کلاسیک', description: 'طراحی کلاسیک و سنتی' },
    { name: 'مدرن', description: 'طراحی مدرن و معاصر' },
    { name: 'عروسی', description: 'مناسب مراسم عروسی' },
    { name: 'مجلس', description: 'مناسب مراسم و مجالس' },
    { name: 'روزمره', description: 'مناسب استفاده روزانه' },
    { name: 'لوکس', description: 'محصولات لوکس و گران‌قیمت' },
    { name: 'مینیمال', description: 'طراحی مینیمال و ساده' },
    { name: 'رنگارنگ', description: 'محصولات رنگارنگ و شاد' },
  ];

  const tags = [];
  for (const data of tagData) {
    const existing = await prisma.tag.findUnique({ where: { name: data.name } });
    if (!existing) {
      const tag = await prisma.tag.create({ data });
      tags.push(tag);
    } else {
      tags.push(existing);
    }
  }
  return tags;
}

async function seedUsers() {
  const userData = [
    {
      phone: '+989123456789',
      email: 'admin@mahan-gold.ir',
      password: '$2b$10$hashedpassword123', // In production, use proper hashing
      status: 'ACTIVE' as const,
    },
    {
      phone: '+989876543210',
      email: 'user@example.com',
      password: '$2b$10$hashedpassword456',
      status: 'ACTIVE' as const,
    },
  ];

  const users = [];
  for (const data of userData) {
    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (!existing) {
      const user = await prisma.user.create({ data });
      users.push(user);
    } else {
      users.push(existing);
    }
  }
  return users;
}

async function seedProducts() {
  const products = [];
  
  // Check if products already exist
  const existingCount = await prisma.product.count();
  if (existingCount > 0) {
    console.log(`   ⚠️  ${existingCount} products already exist, skipping...`);
    return await prisma.product.findMany({ take: 5 });
  }

  const productData = [
    {
      title: 'دستبند طلا 18 عیار',
      slug: 'gold-bracelet-18k',
      description: 'دستبند زیبای طلا با طراحی کلاسیک و کیفیت عالی',
      karat: 18,
      brand: 'طلای ماهان',
    },
    {
      title: 'گردنبند طلا 21 عیار',
      slug: 'gold-necklace-21k',
      description: 'گردنبند لوکس طلا با سنگ‌های قیمتی',
      karat: 21,
      brand: 'طلای ماهان',
    },
    {
      title: 'انگشتر الماس',
      slug: 'diamond-ring',
      description: 'انگشتر الماس با طراحی مدرن و زیبا',
      karat: 18,
      brand: 'طلای ماهان',
    },
  ];

  for (const data of productData) {
    const product = await prisma.product.create({ data });
    products.push(product);

    // Create variants for each product
    const variants = [
      { weight_g: 3.5, makingFee: 500000, stoneCost: 200000, stockQty: 10 },
      { weight_g: 5.2, makingFee: 750000, stoneCost: 300000, stockQty: 8 },
      { weight_g: 7.8, makingFee: 1000000, stoneCost: 500000, stockQty: 5 },
    ];

    for (const variantData of variants) {
      const sku = `${product.slug}-${variantData.weight_g}g`;
      await prisma.productVariant.create({
        data: {
          ...variantData,
          productId: product.id,
          sku,
          barcode: `IR${Date.now()}${Math.floor(Math.random() * 1000)}`,
        },
      });
    }

    // Create media for each product
    await prisma.media.create({
      data: {
        productId: product.id,
        url: `/images/products/${product.slug}.jpg`,
        alt: product.title,
        type: 'cover',
        sort: 0,
      },
    });

    // Assign categories (first 2 categories)
    const categories = await prisma.category.findMany({ take: 2 });
    for (const category of categories) {
      await prisma.productCategory.create({
        data: {
          productId: product.id,
          categoryId: category.id,
        },
      });
    }

    // Assign tags (first 3 tags)
    const tags = await prisma.tag.findMany({ take: 3 });
    for (const tag of tags) {
      await prisma.productTag.create({
        data: {
          productId: product.id,
          tagId: tag.id,
        },
      });
    }
  }

  return products;
}

async function seedArticles() {
  const articles = [];
  
  // Check if articles already exist
  const existingCount = await prisma.article.count();
  if (existingCount > 0) {
    console.log(`   ⚠️  ${existingCount} articles already exist, skipping...`);
    return await prisma.article.findMany({ take: 3 });
  }

  const users = await prisma.user.findMany({ take: 1 });
  if (users.length === 0) {
    console.log('   ⚠️  No users found, skipping articles...');
    return [];
  }

  const articleData = [
    {
      title: 'راهنمای خرید طلا و جواهرات',
      slug: 'gold-jewelry-buying-guide',
      body: 'در این مقاله به شما آموزش می‌دهیم که چگونه طلا و جواهرات با کیفیت خریداری کنید...',
      authorId: users[0].id,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
    },
    {
      title: 'مراقبت از طلا و جواهرات',
      slug: 'gold-jewelry-care',
      body: 'نکات مهم برای نگهداری و مراقبت از طلا و جواهرات شما...',
      authorId: users[0].id,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
    },
    {
      title: 'تاریخچه طلا در ایران',
      slug: 'gold-history-iran',
      body: 'نگاهی به تاریخچه غنی طلا و جواهرات در فرهنگ ایرانی...',
      authorId: users[0].id,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
    },
  ];

  for (const data of articleData) {
    const article = await prisma.article.create({ data });
    articles.push(article);

    // Create media for each article
    await prisma.media.create({
      data: {
        articleId: article.id,
        url: `/images/articles/${article.slug}.jpg`,
        alt: article.title,
        type: 'cover',
        sort: 0,
      },
    });

    // Assign categories (first 2 categories)
    const categories = await prisma.category.findMany({ take: 2 });
    for (const category of categories) {
      await prisma.articleCategory.create({
        data: {
          articleId: article.id,
          categoryId: category.id,
        },
      });
    }

    // Assign tags (first 3 tags)
    const tags = await prisma.tag.findMany({ take: 3 });
    for (const tag of tags) {
      await prisma.articleTag.create({
        data: {
          articleId: article.id,
          tagId: tag.id,
        },
      });
    }
  }

  return articles;
}

async function seedPriceRules() {
  const priceRules = [];
  
  // Check if price rules already exist
  const existingCount = await prisma.priceRule.count();
  if (existingCount > 0) {
    console.log(`   ⚠️  ${existingCount} price rules already exist, skipping...`);
    return await prisma.priceRule.findMany();
  }

  const priceRuleData = [
    {
      margin: 15, // 15% margin
      taxPercent: 9, // 9% tax
      minRange: 1000000, // 1M Toman
      maxRange: 10000000, // 10M Toman
      activeFrom: new Date(),
      isActive: true,
    },
    {
      margin: 20, // 20% margin
      taxPercent: 9, // 9% tax
      minRange: 10000000, // 10M Toman
      maxRange: 50000000, // 50M Toman
      activeFrom: new Date(),
      isActive: true,
    },
  ];

  for (const data of priceRuleData) {
    const priceRule = await prisma.priceRule.create({ data });
    priceRules.push(priceRule);
  }

  return priceRules;
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
