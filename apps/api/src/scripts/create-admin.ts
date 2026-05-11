import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // ایجاد نقش ادمین
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'مدیر سیستم'
      }
    });

    // ایجاد مجوزهای ادمین
    const permissions = [
      { name: 'READ_PRODUCTS', description: 'مشاهده محصولات', resource: 'products', action: 'read' },
      { name: 'WRITE_PRODUCTS', description: 'مدیریت محصولات', resource: 'products', action: 'write' },
      { name: 'READ_ORDERS', description: 'مشاهده سفارشات', resource: 'orders', action: 'read' },
      { name: 'WRITE_ORDERS', description: 'مدیریت سفارشات', resource: 'orders', action: 'write' },
      { name: 'READ_USERS', description: 'مشاهده کاربران', resource: 'users', action: 'read' },
      { name: 'WRITE_USERS', description: 'مدیریت کاربران', resource: 'users', action: 'write' },
      { name: 'READ_DASHBOARD', description: 'مشاهده داشبورد', resource: 'dashboard', action: 'read' },
      { name: 'READ_SETTINGS', description: 'مشاهده تنظیمات', resource: 'settings', action: 'read' },
      { name: 'WRITE_SETTINGS', description: 'مدیریت تنظیمات', resource: 'settings', action: 'write' }
    ];

    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm
      });
    }

    // اختصاص مجوزها به نقش ادمین
    const allPermissions = await prisma.permission.findMany();
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });
    }

    // ایجاد کاربر ادمین
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@barmangold.ir' },
      update: {},
      create: {
        email: 'admin@barmangold.ir',
        password: hashedPassword,
        firstName: 'مدیر',
        lastName: 'سیستم',
        role: 'admin'
      }
    });

    console.log('✅ کاربر ادمین با موفقیت ایجاد شد:');
    console.log('📧 ایمیل: admin@barmangold.ir');
    console.log('🔑 رمز عبور: admin123');
    console.log('👤 نقش: admin');

  } catch (error) {
    console.error('❌ خطا در ایجاد کاربر ادمین:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
