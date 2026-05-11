# 🏆 بارمن گلد - فروشگاه آنلاین طلا و جواهرات لوکس

<div align="center">
  <img src="apps/web/public/logo/hair-salon-logo-gold-png.png" alt="بارمن گلد" width="200" height="200" />
  
  <h3>فروشگاه آنلاین طلا و جواهرات با کیفیت عالی و قیمت مناسب</h3>
  
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io/)
</div>

## 📋 فهرست مطالب

- [معرفی پروژه](#معرفی-پروژه)
- [ویژگی‌ها](#ویژگی‌ها)
- [تکنولوژی‌ها](#تکنولوژی‌ها)
- [نصب و راه‌اندازی](#نصب-و-راه‌اندازی)
- [ساختار پروژه](#ساختار-پروژه)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [مشارکت](#مشارکت)
- [لایسنس](#لایسنس)

## 🎯 معرفی پروژه

**بارمن گلد** یک فروشگاه آنلاین مدرن و لوکس برای فروش طلا و جواهرات است که با استفاده از جدیدترین تکنولوژی‌های وب توسعه یافته است. این پروژه شامل یک پنل ادمین کامل و یک سایت فرانت‌اند زیبا و کاربرپسند است.

### ✨ ویژگی‌های کلیدی

- 🎨 **طراحی لوکس و مدرن** - تم دارک با رنگ‌های طلایی
- 📱 **Responsive Design** - سازگار با تمام دستگاه‌ها
- ⚡ **Performance بالا** - لود سریع و بهینه‌سازی شده
- 🔒 **امنیت بالا** - JWT Authentication و Validation
- 🌐 **PWA Support** - قابلیت نصب به عنوان اپلیکیشن
- 🔍 **SEO Optimized** - بهینه‌سازی شده برای موتورهای جستجو
- 📊 **Analytics Ready** - آماده برای Google Analytics
- 🌍 **RTL Support** - پشتیبانی کامل از راست به چپ

## 🚀 ویژگی‌ها

### 🛍️ فروشگاه آنلاین
- **34 صفحه کامل** شامل تمام صفحات مورد نیاز یک فروشگاه
- **سیستم جستجوی پیشرفته** با فیلترهای مختلف
- **سبد خرید هوشمند** با مدیریت کامل
- **سیستم پرداخت** با روش‌های مختلف
- **پیگیری سفارشات** در زمان واقعی
- **سیستم نظرات و امتیازدهی**

### 👤 پنل کاربری
- **ثبت نام و ورود** با ایمیل و شماره موبایل
- **مدیریت پروفایل** کامل
- **تاریخچه سفارشات** با جزئیات
- **لیست علاقه‌مندی‌ها**
- **مدیریت آدرس‌ها**

### 🔧 پنل ادمین
- **مدیریت محصولات** - CRUD کامل
- **مدیریت دسته‌بندی‌ها** - سلسله مراتبی
- **مدیریت سفارشات** - پیگیری و به‌روزرسانی
- **مدیریت کاربران** - کنترل دسترسی
- **مدیریت محتوا** - مقالات و صفحات
- **آمار و گزارشات** - تحلیل عملکرد
- **مدیریت بنرها** - تبلیغات
- **مدیریت کوپن‌ها** - تخفیف‌ها

## 🛠️ تکنولوژی‌ها

### Frontend
- **Next.js 15** - React Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI Components
- **Framer Motion** - Animations
- **React Hook Form** - Form Management
- **Zod** - Validation
- **TanStack Query** - Data Fetching

### Backend
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **TypeScript** - Type Safety
- **Prisma** - ORM
- **SQLite** - Database
- **JWT** - Authentication
- **bcryptjs** - Password Hashing
- **Zod** - Validation

### DevOps & Tools
- **Docker** - Containerization
- **ESLint** - Code Linting
- **Prettier** - Code Formatting
- **Husky** - Git Hooks
- **PWA** - Progressive Web App

## 📦 نصب و راه‌اندازی

### پیش‌نیازها
- Node.js 18+ 
- npm یا yarn
- Git

### 1. کلون کردن پروژه
```bash
git clone https://github.com/your-username/barman-gold.git
cd barman-gold
```

### 2. نصب وابستگی‌ها
```bash
# نصب وابستگی‌های root
npm install

# نصب وابستگی‌های API
cd apps/api
npm install

# نصب وابستگی‌های Web
cd ../web
npm install
```

### 3. تنظیم محیط
```bash
# کپی کردن فایل‌های محیط
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 4. تنظیم دیتابیس
```bash
cd apps/api
npx prisma generate
npx prisma db push
npx tsx src/scripts/create-admin.ts
```

### 5. راه‌اندازی سرورها
```bash
# Terminal 1 - API Server
cd apps/api
npm run dev

# Terminal 2 - Web Server
cd apps/web
npm run dev
```

### 6. دسترسی به سایت
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Admin Panel**: http://localhost:3000/admin

## 📁 ساختار پروژه

```
barman-gold/
├── apps/
│   ├── api/                 # Backend API
│   │   ├── src/
│   │   │   ├── modules/     # API Modules
│   │   │   ├── routes/      # Public Routes
│   │   │   ├── middleware/  # Middleware
│   │   │   └── scripts/     # Utility Scripts
│   │   └── prisma/          # Database Schema
│   └── web/                 # Frontend App
│       ├── src/
│       │   ├── app/         # Next.js App Router
│       │   ├── components/  # React Components
│       │   ├── contexts/    # React Contexts
│       │   ├── hooks/       # Custom Hooks
│       │   ├── lib/         # Utilities
│       │   └── config/      # Configuration
│       └── public/          # Static Assets
├── docs/                    # Documentation
└── README.md
```

## 📚 API Documentation

### Public Endpoints
- `GET /api/public/products` - لیست محصولات
- `GET /api/public/products/:id` - جزئیات محصول
- `GET /api/public/categories` - دسته‌بندی‌ها
- `GET /api/public/search` - جستجو
- `GET /api/public/gold-prices` - قیمت طلا

### User Endpoints
- `POST /api/user/register` - ثبت نام
- `POST /api/user/login` - ورود
- `GET /api/user/profile` - پروفایل
- `PUT /api/user/profile` - به‌روزرسانی پروفایل

### Order Endpoints
- `POST /api/order/create` - ایجاد سفارش
- `GET /api/order/:id` - جزئیات سفارش
- `PUT /api/order/:id/cancel` - لغو سفارش

## 🚀 Deployment

### Docker Deployment
```bash
# Build images
docker-compose build

# Run containers
docker-compose up -d
```

### Manual Deployment
```bash
# Build production
npm run build

# Start production
npm run start
```

## 🤝 مشارکت

1. Fork کنید
2. Branch جدید بسازید (`git checkout -b feature/amazing-feature`)
3. Commit کنید (`git commit -m 'Add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. Pull Request بسازید

## 📄 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است. برای جزئیات بیشتر فایل [LICENSE](LICENSE) را مطالعه کنید.

## 📞 تماس با ما

- **وب‌سایت**: https://barman-gold.ir
- **ایمیل**: info@barman-gold.ir
- **تلفن**: ۰۲۱-۱۲۳۴۵۶۷۸

---

<div align="center">
  <p>ساخته شده با ❤️ در ایران</p>
  <p>© 2024 بارمن گلد. تمام حقوق محفوظ است.</p>
</div>