'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="d-flex justify-content-center align-items-center" dir="rtl" style={{ backgroundColor: 'var(--barman-bg)' }}>
      <div className="error-card mt-5 d-flex flex-column justify-content-center align-items-center  h-100 ">
        <div className="error-logo mb-3">
          <Image src="/logo.png" alt="بارمن گلد" width={120}  height={100} />
        </div>
        <h1 className="error-title">۴۰۴</h1>
        <p className="error-subtitle">صفحه مورد نظر یافت نشد</p>
        <p className="error-text">ممکن است آدرس را اشتباه وارد کرده باشید یا صفحه حذف شده باشد.</p>
        <div className="d-flex gap-2 mt-3">
          <Link href="/" className="btn error-primary text-white">بازگشت به خانه</Link>
          <Link href="/products" className="btn error-outline text-white">مشاهده محصولات</Link>
        </div>
      </div>
    </div>
  );
}
