'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function CheckoutPage() {
  const [shipping, setShipping] = useState<'normal'|'express'>('normal');

  const shippingCost = shipping === 'normal' ? 32000 : 82000;
  const subtotal = 15800000; // demo
  const discountPercent = 0.15;
  const discount = Math.round(subtotal * discountPercent);
  const final = subtotal - discount + shippingCost;

  const changeShip = (v: 'normal'|'express') => setShipping(v);

  return (
    <div dir="rtl" className="checkout-page" style={{ backgroundColor: 'var(--barman-bg)' }}>
      <div className="container py-4">
        {/* breadcrumb + title */}
        <div className="d-flex align-items-center gap-2 small mb-3" style={{ color: 'var(--barman-text-dark)' }}>
          <Link href="/" className="text-decoration-none" style={{ color: 'var(--barman-text-dark)' }}>صفحه اصلی</Link>
          <i className="bi bi-chevron-left"></i>
          <span style={{ color: 'var(--barman-text)' }}>ثبت سفارش</span>
        </div>

        <div className="row g-4 align-items-start">
          {/* Summary right (sticky) */}
          <div className="col-12 col-lg-4 order-lg-1 order-2">
            <div className="card checkout-summary sticky-top" style={{ top: '96px' }}>
              <div className="card-body">
                <h5 className="mb-3" style={{ color: 'var(--barman-text)' }}>صورتحساب</h5>
                <div className="summary-row"><span>هزینه سفارش</span><span>{subtotal.toLocaleString('fa-IR')} تومان</span></div>
                <div className="summary-row"><span>تعداد اقلام سفارش</span><span>4</span></div>
                <div className="summary-row"><span>تخفیف</span><span>15٪</span></div>
                <div className="summary-row"><span>ارسال عادی</span>
                  <div className="form-check form-check-inline ms-2">
                    <input className="form-check-input" type="radio" name="ship" checked={shipping==='normal'} onChange={()=>changeShip('normal')} />
                    <label className="form-check-label small">{(32000).toLocaleString('fa-IR')} تومان</label>
                  </div>
                </div>
                <div className="summary-row"><span>ارسال فوری</span>
                  <div className="form-check form-check-inline ms-2">
                    <input className="form-check-input" type="radio" name="ship" checked={shipping==='express'} onChange={()=>changeShip('express')} />
                    <label className="form-check-label small">{(82000).toLocaleString('fa-IR')} تومان</label>
                  </div>
                </div>
                <div className="summary-row total"><span>هزینه نهایی</span><span>{final.toLocaleString('fa-IR')} تومان</span></div>
                <button className="btn cart-primary w-100 mt-3">ادامه و پرداخت</button>
                <p className="small text-muted mt-2">پرداخت از تمامی درگاه‌های عضو شتاب امکان‌پذیر است.</p>
              </div>
            </div>
          </div>

          {/* Forms */}
          <div className="col-12 col-lg-8 order-lg-2 order-1">
            <div className="card cart-card mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-person"></i>
                  <h5 className="m-0" style={{ color: 'var(--barman-text)' }}>اطلاعات شخصی</h5>
                </div>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small">نام *</label>
                    <input className="form-control cart-input" placeholder="آیار" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small">نام خانوادگی *</label>
                    <input className="form-control cart-input" placeholder="ابراهیمی" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small">ایمیل</label>
                    <input className="form-control cart-input" placeholder="AynazEbrahimi@gmail.com" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small">شماره تماس *</label>
                    <input className="form-control cart-input" placeholder="0912 345 6789" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card cart-card mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-geo-alt"></i>
                  <h5 className="m-0" style={{ color: 'var(--barman-text)' }}>آدرس (صورتحساب)</h5>
                </div>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small">کد پستی *</label>
                    <input className="form-control cart-input" placeholder="123456789" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small">نام و نام خانوادگی</label>
                    <input className="form-control cart-input" placeholder="آیار ابراهیمی" />
                  </div>
                  <div className="col-12">
                    <label className="form-label small">آدرس *</label>
                    <textarea className="form-control cart-input" rows={3} placeholder="ایران، تهران، میدان آزادی، کوچه 24، پلاک 30" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small">شماره تماس</label>
                    <input className="form-control cart-input" placeholder="0912 345 6789" />
                  </div>
                </div>
                <div className="mt-2">
                  <a href="#" className="text-decoration-none" style={{ color: 'var(--barman-gold)' }}>ویرایش</a>
                </div>
              </div>
            </div>

            <div className="card cart-card mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-truck"></i>
                  <h5 className="m-0" style={{ color: 'var(--barman-text)' }}>آدرس حمل و نقل</h5>
                </div>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small">کد پستی *</label>
                    <input className="form-control cart-input" placeholder="123456789" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small">نام و نام خانوادگی</label>
                    <input className="form-control cart-input" placeholder="آیار ابراهیمی" />
                  </div>
                  <div className="col-12">
                    <label className="form-label small">آدرس *</label>
                    <textarea className="form-control cart-input" rows={3} placeholder="ایران، تهران، میدان آزادی، کوچه 24، پلاک 30" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small">شماره تماس</label>
                    <input className="form-control cart-input" placeholder="0912 345 6789" />
                  </div>
                </div>
                <div className="mt-2">
                  <a href="#" className="text-decoration-none" style={{ color: 'var(--barman-gold)' }}>ویرایش</a>
                </div>
              </div>
            </div>

            <div className="card cart-card">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-calendar-event"></i>
                  <h5 className="m-0" style={{ color: 'var(--barman-text)' }}>تاریخ ارسال</h5>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {["شنبه","یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه"].map((d,i) => (
                    <button key={i} className={`btn chip ${i===6? 'active':''}`}>{d}</button>
                  ))}
                </div>
                <div className="mt-2">
                  <a href="#" className="text-decoration-none" style={{ color: 'var(--barman-gold)' }}>افزودن تاریخ جدید</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
