'use client';

import { useState } from 'react';
import { Star, MessageSquare, HelpCircle, FileText } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  attributes: Record<string, string>;
  description: string;
  rating: { value: number; count: number };
}

interface ProductTabsProps {
  product: Product;
}

export default function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState('specs');

  const tabs = [
    {
      id: 'specs',
      label: 'مشخصات',
      icon: FileText,
      content: <SpecificationsTab attributes={product.attributes} />
    },
    {
      id: 'description',
      label: 'توضیحات',
      icon: FileText,
      content: <DescriptionTab description={product.description} />
    },
    {
      id: 'reviews',
      label: 'دیدگاه‌ها',
      icon: Star,
      content: <ReviewsTab productId={product.id} rating={product.rating} />
    },
    {
      id: 'qa',
      label: 'پرسش و پاسخ',
      icon: HelpCircle,
      content: <QATab productId={product.id} />
    }
  ];

  return (
    <div className="mt-12">
      {/* Tab Headers */}
      <div className="border-b border-[var(--barman-border)] mb-8">
        <nav className="flex space-x-8 space-x-reverse">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-[var(--barman-gold)] text-[var(--barman-gold)]'
                    : 'border-transparent text-[var(--barman-muted)] hover:text-[var(--barman-text)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}

// Specifications Tab Component
function SpecificationsTab({ attributes }: { attributes: Record<string, string> }) {
  return (
    <div className="bg-[var(--barman-surface)] rounded-2xl p-6 border border-[var(--barman-border)]">
      <h3 className="text-lg font-bold text-[var(--barman-text)] mb-6">مشخصات فنی</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(attributes).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center py-3 border-b border-[var(--barman-border)] last:border-b-0">
            <span className="text-[var(--barman-muted)]">{key}</span>
            <span className="font-medium text-[var(--barman-text)]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Description Tab Component
function DescriptionTab({ description }: { description: string }) {
  return (
    <div className="bg-[var(--barman-surface)] rounded-2xl p-6 border border-[var(--barman-border)]">
      <h3 className="text-lg font-bold text-[var(--barman-text)] mb-6">توضیحات محصول</h3>
      <div className="prose prose-invert max-w-none">
        <p className="text-[var(--barman-text)] leading-relaxed mb-6">{description}</p>
        
        <div className="bg-[var(--barman-bg)] rounded-xl p-6 border border-[var(--barman-border)]">
          <h4 className="text-lg font-bold text-[var(--barman-gold)] mb-4">نکات نگهداری</h4>
          <ul className="space-y-2 text-[var(--barman-text)]">
            <li className="flex items-start gap-2">
              <span className="text-[var(--barman-gold)]">•</span>
              <span>از تماس با مواد شیمیایی و عطر خودداری کنید</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--barman-gold)]">•</span>
              <span>برای تمیز کردن از پارچه نرم استفاده کنید</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--barman-gold)]">•</span>
              <span>در جعبه مخصوص نگهداری کنید</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Reviews Tab Component
function ReviewsTab({ productId, rating }: { productId: string; rating: { value: number; count: number } }) {
  const [reviews] = useState([
    {
      id: 1,
      name: 'علی احمدی',
      rating: 5,
      comment: 'کیفیت عالی و بسته‌بندی زیبا. کاملاً راضی هستم.',
      date: '۱۴۰۳/۰۱/۱۵',
      verified: true
    },
    {
      id: 2,
      name: 'فاطمه محمدی',
      rating: 4,
      comment: 'محصول خوبی بود ولی کمی کوچک بود.',
      date: '۱۴۰۳/۰۱/۱۰',
      verified: true
    }
  ]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
      );
    }
    return stars;
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-[var(--barman-surface)] rounded-2xl p-6 border border-[var(--barman-border)]">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl font-bold text-[var(--barman-text)]">{rating.value}</div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              {renderStars(Math.floor(rating.value))}
            </div>
            <div className="text-sm text-[var(--barman-muted)]">
              بر اساس {rating.count} نظر
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-[var(--barman-surface)] rounded-2xl p-6 border border-[var(--barman-border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--barman-gold)] rounded-full flex items-center justify-center text-[var(--barman-bg)] font-bold">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-[var(--barman-text)]">{review.name}</div>
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                </div>
              </div>
              <div className="text-sm text-[var(--barman-muted)]">{review.date}</div>
            </div>
            <p className="text-[var(--barman-text)]">{review.comment}</p>
            {review.verified && (
              <div className="mt-2 text-xs text-green-500">✓ خرید تایید شده</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Q&A Tab Component
function QATab({ productId }: { productId: string }) {
  const [questions] = useState([
    {
      id: 1,
      question: 'آیا این محصول گارانتی دارد؟',
      answer: 'بله، این محصول دارای ۲ سال گارانتی اصالت و کیفیت است.',
      answered: true,
      votes: 5
    },
    {
      id: 2,
      question: 'آیا امکان تعویض سایز وجود دارد؟',
      answer: 'بله، در صورت عدم رضایت می‌توانید تا ۷ روز محصول را تعویض کنید.',
      answered: true,
      votes: 3
    }
  ]);

  return (
    <div className="space-y-4">
      {questions.map((qa) => (
        <div key={qa.id} className="bg-[var(--barman-surface)] rounded-2xl p-6 border border-[var(--barman-border)]">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-medium text-[var(--barman-text)]">{qa.question}</h4>
            <div className="flex items-center gap-2 text-sm text-[var(--barman-muted)]">
              <span>{qa.votes} مفید</span>
              <button className="text-[var(--barman-gold)] hover:text-opacity-80">↑</button>
            </div>
          </div>
          {qa.answered && (
            <div className="bg-[var(--barman-bg)] rounded-lg p-4 border-r-4 border-[var(--barman-gold)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-[var(--barman-gold)]">پاسخ فروشنده</span>
                <span className="text-xs text-[var(--barman-muted)]">✓</span>
              </div>
              <p className="text-[var(--barman-text)]">{qa.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
