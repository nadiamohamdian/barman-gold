'use client';

import { MessageCircle, Store, Star, Clock, RotateCcw } from 'lucide-react';

interface Seller {
  id: string;
  name: string;
  score: number;
}

interface SellerBoxProps {
  seller: Seller;
  productId: string;
}

export default function SellerBox({ seller, productId }: SellerBoxProps) {
  const handleViewStore = () => {
    // Navigate to seller store
    console.log('View store:', seller.id);
  };

  const handleAskQuestion = () => {
    // Open question modal
    console.log('Ask question for product:', productId);
  };

  const renderStars = (score: number) => {
    const stars = [];
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 !== 0;

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

    const remainingStars = 5 - Math.ceil(score);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">★</span>
      );
    }

    return stars;
  };

  return (
    <div className="bg-[var(--barman-surface)] rounded-2xl p-6 border border-[var(--barman-border)] sticky top-24">
      {/* Seller Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-[var(--barman-gold)] rounded-full flex items-center justify-center">
          <Store className="w-6 h-6 text-[var(--barman-bg)]" />
        </div>
        <div>
          <h3 className="font-bold text-[var(--barman-text)]">{seller.name}</h3>
          <div className="flex items-center gap-1">
            {renderStars(seller.score)}
            <span className="text-sm text-[var(--barman-muted)] mr-1">
              {seller.score}
            </span>
          </div>
        </div>
      </div>

      {/* Seller Info */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-[var(--barman-muted)]">
          <Clock className="w-4 h-4" />
          <span>ارسال ۱ تا ۳ روز کاری</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--barman-muted)]">
          <RotateCcw className="w-4 h-4" />
          <span>۷ روز ضمانت بازگشت</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--barman-muted)]">
          <Star className="w-4 h-4" />
          <span>فروشنده برتر</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleViewStore}
          className="w-full bg-[var(--barman-gold)] text-[var(--barman-bg)] py-3 px-4 rounded-xl font-bold hover:bg-opacity-90 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <Store className="w-4 h-4" />
          مشاهده فروشگاه
        </button>

        <button
          onClick={handleAskQuestion}
          className="w-full bg-[var(--barman-surface)] text-[var(--barman-text)] py-3 px-4 rounded-xl font-bold border border-[var(--barman-border)] hover:bg-[var(--barman-gold)] hover:text-[var(--barman-bg)] transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          سوال از فروشنده
        </button>
      </div>

      {/* Seller Stats */}
      <div className="mt-6 pt-4 border-t border-[var(--barman-border)]">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-[var(--barman-text)]">۴.۸</div>
            <div className="text-xs text-[var(--barman-muted)]">امتیاز</div>
          </div>
          <div>
            <div className="text-lg font-bold text-[var(--barman-text)]">۲۴۷</div>
            <div className="text-xs text-[var(--barman-muted)]">فروش</div>
          </div>
        </div>
      </div>
    </div>
  );
}
