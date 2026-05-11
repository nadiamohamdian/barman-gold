'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import ProductCard from './ProductCard';

interface Product {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: number;
  image: string;
  weight?: string;
  rating?: number;
  reviews?: number;
  specs?: string;
  delivery?: string;
  stock?: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

interface ProductCarouselProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onAddToCart?: (productId: number) => void;
  onViewDetails?: (productId: number) => void;
}

export default function ProductCarousel({
  products,
  title = "محصولات ویژه",
  subtitle = "بهترین طلا و جواهرات را از ما بخرید",
  autoPlay = true,
  autoPlayInterval = 10000,
  onAddToCart,
  onViewDetails
}: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate items per view based on screen size
  const [itemsPerView, setItemsPerView] = useState(4);
  const maxIndex = useMemo(() => Math.max(products.length - itemsPerView, 0), [products.length, itemsPerView]);

  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width >= 1400) {
        setItemsPerView(5);
      } else if (width >= 1200) {
        setItemsPerView(4);
      } else if (width >= 992) {
        setItemsPerView(3);
      } else if (width >= 768) {
        setItemsPerView(2);
      } else {
        setItemsPerView(1);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Clamp index when itemsPerView or products length changes
  useEffect(() => {
    setCurrentIndex(prev => Math.min(prev, maxIndex));
  }, [maxIndex]);

  // Infinite auto-play functionality
  useEffect(() => {
    if (autoPlay && !isHovered && !isDragging) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
      }, autoPlayInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, isHovered, isDragging, autoPlayInterval, products.length]);

  const nextSlide = () => {
    setCurrentIndex(prev => (prev >= maxIndex ? maxIndex : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev <= 0 ? 0 : prev - 1));
  };

  // Smooth mouse drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDragging) return;
    setIsDragging(true);
    setDragStart(e.clientX);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const currentX = e.clientX;
    const diff = dragStart - currentX;
    setDragOffset(diff);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const threshold = 50;
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 px-3">
        <div className="flex-grow-1">
          <h2 className="modern-carousel-title mb-2">{title}</h2>
          <p className="modern-carousel-subtitle mb-0">{subtitle}</p>
        </div>
      </div>

      {/* Carousel */}
      <div 
        className="modern-carousel-wrapper position-relative overflow-hidden rounded-3 mx-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          handleMouseLeave();
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={(e) => { 
          setIsDragging(true); 
          setDragStart(e.touches[0].clientX); 
          setDragOffset(0); 
        }}
        onTouchMove={(e) => { 
          if (!isDragging) return; 
          const diff = dragStart - e.touches[0].clientX; 
          setDragOffset(diff); 
        }}
        onTouchEnd={() => { 
          const threshold = 50; 
          if (Math.abs(dragOffset) > threshold) { 
            if (dragOffset > 0) nextSlide(); 
            else prevSlide(); 
          } 
          setIsDragging(false); 
          setDragOffset(0); 
        }}
      >
        {/* Navigation Buttons */}
        <button 
          className={`modern-carousel-arrow modern-carousel-prev position-absolute top-50 start-0 translate-middle-y ${currentIndex === 0 ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={prevSlide}
          aria-label="محصول قبلی"
        >
          <i className="bi bi-chevron-right"></i>
        </button>
        <button 
          className={`modern-carousel-arrow modern-carousel-next position-absolute top-50 end-0 translate-middle-y ${currentIndex === maxIndex ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={nextSlide}
          aria-label="محصول بعدی"
        >
          <i className="bi bi-chevron-left"></i>
        </button>
        <div 
          className="modern-carousel-track d-flex"
          ref={carouselRef}
          style={{
            transform: `translateX(calc(-${currentIndex * (100 / itemsPerView)}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {products.map((product, index) => (
            <div 
              key={product.id} 
              className="modern-carousel-item d-flex justify-content-center"
              style={{ width: `${100 / itemsPerView}%` }}
            >
              <ProductCard
                {...product}
                onAddToCart={onAddToCart}
                onViewDetails={onViewDetails}
              />
            </div>
          ))}
        </div>

        {/* Gradient Overlays */}
        <div className="modern-carousel-gradient modern-carousel-gradient-left"></div>
        <div className="modern-carousel-gradient modern-carousel-gradient-right"></div>
      </div>
    </div>
  );
}