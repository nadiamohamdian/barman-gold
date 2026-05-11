'use client';

import { useState, useEffect } from 'react';
import { Heart, Share2, BarChart3, ShoppingCart, Zap, Shield, Truck } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  subtitle?: string;
  brand?: string;
  category: string[];
  rating: { value: number; count: number };
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
  attributes: Record<string, string>;
}

interface ProductSummaryProps {
  product: Product;
  goldRate: number;
}

export default function ProductSummary({ product, goldRate }: ProductSummaryProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-400">★</span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400">☆</span>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">★</span>
      );
    }

    return stars;
  };

  const handleAddToCart = () => {
    // Add to cart logic
    console.log('Added to cart:', product.id);
  };

  const handleQuickBuy = () => {
    // Quick buy logic
    console.log('Quick buy:', product.id);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const handleCompare = () => {
    setIsComparing(!isComparing);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.subtitle,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {product.brand && (
            <span className="text-sm text-[var(--barman-muted)]">{product.brand}</span>
          )}
          <span className="text-sm text-[var(--barman-muted)]">•</span>
          <span className="text-sm text-[var(--barman-muted)]">{product.category[0]}</span>
        </div>
        
        <h1 className="text-2xl font-bold text-[var(--barman-text)] mb-2">
          {product.title}
        </h1>
        
        {product.subtitle && (
          <p className="text-[var(--barman-muted)] mb-4">{product.subtitle}</p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            {renderStars(product.rating.value)}
          </div>
          <span className="text-sm text-[var(--barman-muted)]">
            {product.rating.value} ({product.rating.count} نظر)
          </span>
        </div>
      </div>

      {/* Price Section */}
      <div className="bg-[var(--barman-surface)] rounded-2xl p-6 border border-[var(--barman-border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-bold text-[var(--barman-gold)]">
              {formatPrice(calculatedPrice)} تومان
            </div>
            <div className="text-sm text-[var(--barman-muted)]">
              بر اساس نرخ لحظه‌ای طلا
            </div>
          </div>
          {product.pricing.discountPercent > 0 && (
            <div className="bg-[var(--barman-gold)] text-[var(--barman-bg)] px-3 py-1 rounded-full text-sm font-bold">
              {Math.round(product.pricing.discountPercent * 100)}% تخفیف
            </div>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${
            product.stock.status === 'in_stock' ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm font-medium">
            {product.stock.status === 'in_stock' ? 'موجود' : 'ناموجود'}
          </span>
          {product.stock.qty && (
            <span className="text-sm text-[var(--barman-muted)]">
              ({product.stock.qty} عدد باقی‌مانده)
            </span>
          )}
        </div>

        {/* Key Attributes */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {Object.entries(product.attributes).slice(0, 4).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="text-sm text-[var(--barman-muted)]">{key}</div>
              <div className="font-medium text-[var(--barman-text)]">{value}</div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAddToCart}
            disabled={product.stock.status !== 'in_stock'}
            className="w-full bg-[var(--barman-gold)] text-[var(--barman-bg)] py-3 px-6 rounded-xl font-bold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            افزودن به سبد خرید
          </button>

          <button
            onClick={handleQuickBuy}
            disabled={product.stock.status !== 'in_stock'}
            className="w-full bg-[var(--barman-surface)] text-[var(--barman-text)] py-3 px-6 rounded-xl font-bold border border-[var(--barman-border)] hover:bg-[var(--barman-gold)] hover:text-[var(--barman-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            خرید سریع
          </button>
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleWishlist}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-200 ${
            isWishlisted
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-[var(--barman-surface)] text-[var(--barman-text)] border-[var(--barman-border)] hover:bg-red-50 hover:text-red-600 hover:border-red-200'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          {isWishlisted ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
        </button>

        <button
          onClick={handleCompare}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-200 ${
            isComparing
              ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'bg-[var(--barman-surface)] text-[var(--barman-text)] border-[var(--barman-border)] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          {isComparing ? 'حذف از مقایسه' : 'مقایسه'}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--barman-border)] bg-[var(--barman-surface)] text-[var(--barman-text)] hover:bg-[var(--barman-gold)] hover:text-[var(--barman-bg)] transition-colors duration-200"
        >
          <Share2 className="w-4 h-4" />
          اشتراک‌گذاری
        </button>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 text-sm text-[var(--barman-muted)]">
          <Shield className="w-4 h-4" />
          ضمانت اصالت
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--barman-muted)]">
          <Truck className="w-4 h-4" />
          ارسال رایگان
        </div>
      </div>
    </div>
  );
}
