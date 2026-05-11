'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type CartItem = {
  id: string;
  title: string;
  desc?: string;
  price: number; // per unit
  qty: number;
  image: string;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  // Load items from localStorage or fallback
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cartItems');
      if (raw) {
        const parsed = JSON.parse(raw) as any[];
        setItems(parsed.map(p => ({
          id: p.id || String(Math.random()),
          title: p.title || p.name || 'محصول',
          desc: p.description || '',
          price: Number(p.price || p.unitPrice || 1200000),
          qty: Number(p.quantity || 1),
          image: (p.image || p.thumbnail || '/imgs/3c514297-7ee8-4c9a-a506-084c5cbc6247.jpeg').replace('/public',''),
        })));
      } else {
        setItems([
          { id: '1', title: 'گردنبند طلای کلاسیک', desc: '۱۸ عیار • 12 گرم', price: 2500000, qty: 1, image: '/imgs/339798d7-433e-4a74-b6d5-3ba6863478b1.jpeg' },
          { id: '2', title: 'انگشتر الماس', desc: '۱۸ عیار • 2.5 گرم', price: 1800000, qty: 2, image: '/imgs/13f2a810-f9fd-4eea-9a3b-b492be813350.jpeg' },
        ]);
      }
    } catch {
      // ignore
    }
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const discount = Math.round(subtotal * appliedDiscount);
    const final = subtotal - discount;
    const count = items.reduce((c, it) => c + it.qty, 0);
    return { subtotal, discount, final, count };
  }, [items, appliedDiscount]);

  const updateLocal = (next: CartItem[]) => {
    setItems(next);
    try { localStorage.setItem('cartItems', JSON.stringify(next)); } catch {}
  };

  const inc = (id: string) => updateLocal(items.map(it => it.id === id ? { ...it, qty: it.qty + 1 } : it));
  const dec = (id: string) => updateLocal(items.map(it => it.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it));
  const removeItem = (id: string) => updateLocal(items.filter(it => it.id !== id));

  const applyDiscount = () => {
    // simple demo: GOLD10 => 10%
    if (discountCode.trim().toUpperCase() === 'GOLD10') setAppliedDiscount(0.1);
    else setAppliedDiscount(0);
  };

  return (
    <div dir="rtl" className="cart-page " style={{ backgroundColor: 'var(--barman-bg)' }}>
      <div className="container py-4  "  style={{marginTop: '5.5rem'}} >
        {/* Breadcrumb */}
        <nav className="small mb-3" aria-label="breadcrumb">
          <ol className="breadcrumb m-0">
            <li className="breadcrumb-item"><Link href="/" className="text-decoration-none" style={{ color: 'var(--barman-text-dark)' }}>صفحه اصلی</Link></li>
            <li className="breadcrumb-item active" aria-current="page" style={{ color: 'var(--barman-text)' }}>سبد خرید</li>
          </ol>
        </nav>

        {/* Two-column layout */}
        <div className="row g-4 align-items-start">
          {/* Summary (right on desktop) */}
          <div className="col-12 col-lg-4 order-lg-1 order-2">
            <div className="card cart-summary sticky-top" style={{ top: '96px' }}>
              <div className="card-body">
                <h5 className="mb-3" style={{ color: 'var(--barman-text)' }}>صورتحساب</h5>
                <div className="summary-row"><span>هزینه سفارش</span><span>{totals.subtotal.toLocaleString('fa-IR')} تومان</span></div>
                <div className="summary-row"><span>تعداد اقلام سفارش</span><span>{totals.count}</span></div>
                <div className="summary-row"><span>تخفیف</span><span>{totals.discount.toLocaleString('fa-IR')} تومان</span></div>
                <div className="summary-row total"><span>هزینه نهایی</span><span>{totals.final.toLocaleString('fa-IR')} تومان</span></div>
                <button className="btn cart-primary w-100 mt-3">تایید و ادامه</button>
                <p className="small  text-white  mt-2">هزینه حمل و نقل در مرحله بعد به مبلغ سفارش اضافه خواهد شد.</p>
              </div>
            </div>
          </div>

          {/* Cart items */}
          <div className="col-12 col-lg-7 order-lg-2 order-1 cart-items-col">
            <div className="card cart-card">
              <div className="card-body p-0">
                {items.length === 0 ? (
                  <div className="p-4 text-center" style={{ color: 'var(--barman-text-dark)' }}>سبد خرید شما خالی است.</div>
                ) : (
                  items.map((it) => (
                    <div key={it.id} className="cart-item">
                      <div className="thumb">
                        <Image src={it.image} alt={it.title} fill className="object-fit-cover" />
                      </div>
                      <div className="info">
                        <div className="title">{it.title}</div>
                        <div className="desc">{it.desc}</div>
                        <div className="price">{it.price.toLocaleString('fa-IR')} تومان</div>
                      </div>
                      <div className="controls">
                        <div className="qty">
                          <button className="btn qty-btn" onClick={() => inc(it.id)}>+</button>
                          <span className="qty-value">{it.qty}</span>
                          <button className="btn qty-btn" onClick={() => dec(it.id)}>-</button>
                        </div>
                        <button className="btn remove-btn" onClick={() => removeItem(it.id)} aria-label="حذف">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                      <div className="line-total">{(it.price * it.qty).toLocaleString('fa-IR')} تومان</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Discount code */}
            <div className="card cart-card mt-3">
              <div className="card-body d-flex flex-wrap gap-2 align-items-center">
                <div className="section-title m-0" style={{fontSize: '16px'}} >کد تخفیف</div>
                <input
                  className="form-control cart-input"
                  placeholder="کد تخفیف شما"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  style={{ maxWidth: 220 }}
                />
                <button className="btn cart-secondary" onClick={applyDiscount}>ثبت کد تخفیف</button>
                {appliedDiscount > 0 && (
                  <span className="ms-auto" style={{ color: 'var(--barman-gold)' }}>تخفیف اعمال شد: {(appliedDiscount*100).toFixed(0)}%</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
