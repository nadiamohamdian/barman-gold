'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav 
      className="mb-8" 
      aria-label="breadcrumb"
    >
      <ol className="flex items-center space-x-2 space-x-reverse text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronLeft 
                className="w-4 h-4 text-[var(--barman-muted)] mx-2" 
                aria-hidden="true"
              />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-[var(--barman-muted)] hover:text-[var(--barman-gold)] transition-colors duration-200"
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className="text-[var(--barman-text)] font-medium"
                aria-current="page"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
