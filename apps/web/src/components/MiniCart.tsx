"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

export type CartItem = {
  id: string;
  title: string;
  price: number; // in IRT
  quantity: number;
  image: string; // public path
};

type MiniCartProps = {
  isOpen: boolean;
  onClose: () => void;
  onGoToCart?: () => void;
  variant?: 'drawer' | 'inline';
};

export default function MiniCart({ isOpen, onClose, onGoToCart, variant = 'drawer' }: MiniCartProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cartItems");
      if (raw) {
        setItems(JSON.parse(raw));
      } else {
        // Fallback sample items so UI is visible
        setItems([
          {
            id: "ring-1",
            title: "انگشتر طلا ۱۸ عیار زنانه",
            price: 12500000,
            quantity: 1,
            image: "/public/imgs/3c514297-7ee8-4c9a-a506-084c5cbc6247.jpeg".replace("/public", ""),
          },
          {
            id: "necklace-1",
            title: "گردنبند ظریف طلا",
            price: 21800000,
            quantity: 1,
            image: "/public/imgs/4aeaf3ee-c48b-40f2-b300-9ee3272a4f27.jpeg".replace("/public", ""),
          },
        ]);
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  const total = useMemo(() => items.reduce((sum, it) => sum + it.price * it.quantity, 0), [items]);

  if (variant === 'inline') {
    return (
      <div className={`mini-cart-inline ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
        <div className="mini-cart-popover" role="dialog" aria-label="سبد خرید">
          <div className="mini-cart-header d-flex justify-content-between align-items-center">
            <div className="title fs-4 mt-3">سبد خرید</div>
            <button className="close-btn mb-2 " onClick={onClose} aria-label="بستن سبد">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="mini-cart-items">
            {items.length === 0 ? (
              <div className="empty">سبد خرید شما خالی است.</div>
            ) : (
              items.map((it) => (
                <div key={it.id} className="mini-cart-item">
                  <div className="thumb">
                    <Image src={it.image} alt={it.title} fill className="object-fit-cover" />
                  </div>
                  <div className="info">
                    <div className="name" title={it.title}>{it.title}</div>
                    <div className="meta">
                      <span className="qty">x{it.quantity}</span>
                      <span className="price">{(it.price).toLocaleString("fa-IR")} تومان</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mini-cart-footer">
            <div className="total">
              <span>جمع کل</span>
              <strong>{total.toLocaleString("fa-IR")} تومان</strong>
            </div>
            <button className="btn mini-cart-cta" onClick={onGoToCart} aria-label="رفتن به سبد خرید">
              مشاهده سبد خرید
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mini-cart-container ${isOpen ? "open" : ""}`} aria-hidden={!isOpen}>
      <div className="mini-cart-panel" role="dialog" aria-label="سبد خرید">
        <div className="mini-cart-header">
          <div className="title">سبد خرید</div>
          <button className="close-btn" onClick={onClose} aria-label="بستن سبد">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="mini-cart-items">
          {items.length === 0 ? (
            <div className="empty">سبد خرید شما خالی است.</div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="mini-cart-item">
                <div className="thumb">
                  <Image src={it.image} alt={it.title} fill className="object-fit-cover" />
                </div>
                <div className="info">
                  <div className="name" title={it.title}>{it.title}</div>
                  <div className="meta">
                    <span className="qty">تعداد: {it.quantity}</span>
                    <span className="price">{(it.price).toLocaleString("fa-IR")} تومان</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mini-cart-footer">
          <div className="total">
            <span>جمع کل</span>
            <strong>{total.toLocaleString("fa-IR")} تومان</strong>
          </div>
          <button className="btn mini-cart-cta" onClick={onGoToCart} aria-label="رفتن به سبد خرید">
            مشاهده سبد خرید
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <div className="mini-cart-backdrop" onClick={onClose} />
    </div>
  );
}
