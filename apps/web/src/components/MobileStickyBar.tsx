'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Zap } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  pricing: {
    goldRatePerGram: number;
    weightGram: number;
    makingFeeRate: number;
    stonePrice: number;
    taxRate: number;
    discountPercent: number;
    final: number;
  };
  stock: { status: 'in_stock' | 'out_of_stock'; qty?: number };
}

interface MobileStickyBarProps {
  product: Product;
  goldRate: number;
}

export default function MobileStickyBar({ product, goldRate }: MobileStickyBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  // Calculate price based on gold rate
  useEffect(() => {
    const { weightGram, makingFeeRate, stonePrice, taxRate, discountPercent } = product.pricing;
    const goldValue = goldRate * weightGram;
    const makingFee = goldValue * makingFeeRate;
    const subtotal = goldValue + makingFee + stonePrice;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    const finalPrice = total * (1 - discountPercent);
    setCalculatedPrice(Math.round(finalPrice));
  }, [goldRate, product.pricing]);

  // Show/hide sticky bar based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show when scrolled past 50% of the page
      setIsVisible(scrollY > windowHeight * 0.5 && scrollY < documentHeight - windowHeight - 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const handleAddToCart = () => {
    console.log('Added to cart:', product.id);
  };

  const handleQuickBuy = () => {
    console.log('Quick buy:', product.id);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--barman-surface)] border-t border-[var(--barman-border)] p-4 shadow-lg lg:hidden">
      <div className="flex items-center gap-4">
        {/* Price */}
        <div className="flex-1">
          <div className="text-lg font-bold text-[var(--barman-gold)]">
            {formatPrice(calculatedPrice)} تومان
          </div>
          <div className="text-xs text-[var(--barman-muted)]">
            {product.stock.status === 'in_stock' ? 'موجود' : 'ناموجود'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={product.stock.status !== 'in_stock'}
            className="flex items-center gap-2 bg-[var(--barman-gold)] text-[var(--barman-bg)] px-4 py-2 rounded-lg font-bold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ShoppingCart className="w-4 h-4" />
            افزودن
          </button>

          <button
            onClick={handleQuickBuy}
            disabled={product.stock.status !== 'in_stock'}
            className="flex items-center gap-2 bg-[var(--barman-surface)] text-[var(--barman-text)] px-4 py-2 rounded-lg font-bold border border-[var(--barman-border)] hover:bg-[var(--barman-gold)] hover:text-[var(--barman-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Zap className="w-4 h-4" />
            خرید
          </button>
        </div>
      </div>
    </div>
  );
}
