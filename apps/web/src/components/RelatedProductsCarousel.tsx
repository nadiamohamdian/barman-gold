'use client';

import { useState, useRef } from 'react';
import ProductCard from './ProductCard';

interface RelatedProductsCarouselProps {
  productId: string;
  category: string;
}

export default function RelatedProductsCarousel({ productId, category }: RelatedProductsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Sample related products
  const relatedProducts = [
    {
      id: 1,
      name: 'گردنبند طلای کلاسیک',
      price: '2,500,000',
      originalPrice: '3,000,000',
      image: '0397fc2c-ff19-42e9-86fe-5dd26e171548.jpeg',
      weight: '15 گرم',
      discount: 17,
      rating: 4.5,
      isNew: true
    },
    {
      id: 2,
      name: 'انگشتر الماس',
      price: '1,800,000',
      image: '13f2a810-f9fd-4eea-9a3b-b492be813350.jpeg',
      weight: '8 گرم',
      rating: 4.8,
      isFeatured: true
    },
    {
      id: 3,
      name: 'دستبند طلای زنانه',
      price: '1,200,000',
      originalPrice: '1,500,000',
      image: '339798d7-433e-4a74-b6d5-3ba6863478b1.jpeg',
      weight: '12 گرم',
      discount: 20,
      rating: 4.3
    },
    {
      id: 4,
      name: 'گوشواره مروارید',
      price: '800,000',
      image: '3c514297-7ee8-4c9a-a506-084c5cbc6247.jpeg',
      weight: '6 گرم',
      rating: 4.6
    },
    {
      id: 5,
      name: 'ساعت طلای مردانه',
      price: '3,500,000',
      image: '4aeaf3ee-c48b-40f2-b300-9ee3272a4f27.jpeg',
      weight: '25 گرم',
      rating: 4.9,
      isFeatured: true
    }
  ];

  const itemsPerView = 4;
  const maxIndex = Math.max(0, relatedProducts.length - itemsPerView);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart(e.clientX);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.clientX;
    const walk = (x - dragStart) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const handleProductClick = (productId: number) => {
    console.log('Product clicked:', productId);
  };

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[var(--barman-text)]">محصولات مرتبط</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg border border-[var(--barman-border)] bg-[var(--barman-surface)] text-[var(--barman-text)] hover:bg-[var(--barman-gold)] hover:text-[var(--barman-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            ←
          </button>
          <button
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            className="p-2 rounded-lg border border-[var(--barman-border)] bg-[var(--barman-surface)] text-[var(--barman-text)] hover:bg-[var(--barman-gold)] hover:text-[var(--barman-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            →
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={carouselRef}
          className="flex gap-6 overflow-hidden"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {relatedProducts.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-80"
              onClick={() => handleProductClick(product.id)}
            >
              <ProductCard
                id={product.id}
                name={product.name}
                price={product.price}
                originalPrice={product.originalPrice}
                image={product.image}
                weight={product.weight}
                discount={product.discount}
                rating={product.rating}
                isNew={product.isNew}
                isFeatured={product.isFeatured}
                onViewDetails={() => handleProductClick(product.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
