'use client';

import Image from 'next/image';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  return (
    <html lang="fa-IR" dir="rtl">
      <body className="d-flex justify-content-center align-items-center " style={{ backgroundColor: 'var(--barman-bg)' }}>
        <div className="error-card d-flex justify-content-center align-items-center ">
          <div className="error-logo">
            <Image src="/logo.png" alt="بارمن گلد" width={100} height={100} />
          </div>
          <h1 className="error-title">خطای غیرمنتظره</h1>
          <p className="error-subtitle">مشکلی در بارگذاری صفحه رخ داد</p>
          <p className="error-text">اگر مشکل ادامه داشت، کمی بعد دوباره تلاش کنید.</p>
          <div className="d-flex gap-2 mt-3">
            <button className="btn error-primary" onClick={() => reset()}>تلاش مجدد</button>
            <a className="btn error-outline  " href="/">بازگشت به خانه</a>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <p className="error-digest">{error?.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
