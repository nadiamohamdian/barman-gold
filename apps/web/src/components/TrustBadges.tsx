'use client';

import { Shield, Truck, Phone, Award } from 'lucide-react';

export default function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      title: 'پرداخت امن',
      description: 'پرداخت با امنیت کامل'
    },
    {
      icon: Award,
      title: 'ضمانت اصالت',
      description: 'ضمانت اصالت محصول'
    },
    {
      icon: Truck,
      title: 'ارسال بیمه‌شده',
      description: 'ارسال با بیمه کامل'
    },
    {
      icon: Phone,
      title: 'پشتیبانی تلفنی',
      description: 'پشتیبانی ۲۴ ساعته'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <div
            key={index}
            className="bg-[var(--barman-surface)] rounded-2xl p-6 border border-[var(--barman-border)] text-center hover:border-[var(--barman-gold)] transition-colors duration-200"
          >
            <div className="w-12 h-12 bg-[var(--barman-gold)] rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon className="w-6 h-6 text-[var(--barman-bg)]" />
            </div>
            <h3 className="font-bold text-[var(--barman-text)] mb-1">{badge.title}</h3>
            <p className="text-sm text-[var(--barman-muted)]">{badge.description}</p>
          </div>
        );
      })}
    </div>
  );
}
