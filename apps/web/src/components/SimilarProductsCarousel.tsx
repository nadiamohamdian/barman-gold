'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  weight?: string;
  discount?: number;
  rating?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  slug?: string;
}

interface SimilarProductsCarouselProps {
  products?: Product[];
  onProductClick?: (productId: number) => void;
  onViewAllClick?: () => void;
}

export default function SimilarProductsCarousel({ 
  products = [], 
  onProductClick,
  onViewAllClick 
}: SimilarProductsCarouselProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sample products if none provided
  const sampleProducts: Product[] = [
    {
      id: 1,
      name: 'گردنبند طلای کلاسیک',
      price: '2,500,000',
      originalPrice: '3,000,000',
      image: '0397fc2c-ff19-42e9-86fe-5dd26e171548.jpeg',
      weight: '15 گرم',
      discount: 17,
      rating: 4.5,
      isNew: true,
      slug: 'گردنبند-طلای-کلاسیک-15-گرم'
    },
    {
      id: 2,
      name: 'انگشتر الماس',
      price: '1,800,000',
      image: '13f2a810-f9fd-4eea-9a3b-b492be813350.jpeg',
      weight: '8 گرم',
      rating: 4.8,
      isFeatured: true,
      slug: 'انگشتر-الماس-8-گرم'
    },
    {
      id: 3,
      name: 'دستبند طلای زنانه',
      price: '1,200,000',
      originalPrice: '1,500,000',
      image: '339798d7-433e-4a74-b6d5-3ba6863478b1.jpeg',
      weight: '12 گرم',
      discount: 20,
      rating: 4.3,
      slug: 'دستبند-طلای-زنانه-12-گرم'
    },
    {
      id: 4,
      name: 'گوشواره مروارید',
      price: '800,000',
      image: '3c514297-7ee8-4c9a-a506-084c5cbc6247.jpeg',
      weight: '6 گرم',
      rating: 4.6,
      slug: 'گوشواره-مروارید-6-گرم'
    },
    {
      id: 5,
      name: 'ساعت طلای مردانه',
      price: '3,500,000',
      image: '4aeaf3ee-c48b-40f2-b300-9ee3272a4f27.jpeg',
      weight: '25 گرم',
      rating: 4.9,
      isFeatured: true,
      slug: 'ساعت-طلای-مردانه-25-گرم'
    },
    {
      id: 6,
      name: 'زنجیر طلای ضخیم',
      price: '2,200,000',
      originalPrice: '2,800,000',
      image: 'b9089b38-721a-4798-b793-a14298fbd8e3.jpeg',
      weight: '18 گرم',
      discount: 21,
      rating: 4.4,
      slug: 'زنجیر-طلای-ضخیم-18-گرم'
    },
    {
      id: 7,
      name: 'سکه طلای عیار 18',
      price: '1,500,000',
      image: 'c55d0557-0268-498d-99f7-577844253c5f.jpeg',
      weight: '10 گرم',
      rating: 4.7,
      slug: 'سکه-طلای-عیار-18-10-گرم'
    },
    {
      id: 8,
      name: 'سرویس طلای کامل',
      price: '5,000,000',
      originalPrice: '6,000,000',
      image: 'edb6ef26-21fa-4f31-aaa5-7842fe9fa989.jpeg',
      weight: '50 گرم',
      discount: 17,
      rating: 4.8,
      isNew: true,
      slug: 'سرویس-طلای-کامل-50-گرم'
    }
  ];

  const displayProducts = products.length > 0 ? products : sampleProducts;

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

  const handleProductClick = (productId: number) => {
    if (onProductClick) {
      onProductClick(productId);
    }
  };

  const handleViewAllClick = () => {
    if (onViewAllClick) {
      onViewAllClick();
    }
  };

  return (
    <div className="luxury-carousel-container">
      <div className="container-fluid py-5">
        <div className="text-center mb-5">
          <h3 className="luxury-carousel-title">محصولات جدید</h3>
        </div>
        
        <div className="luxury-carousel-wrapper">
          <div
            ref={carouselRef}
            className="luxury-carousel-track d-flex gap-4"
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {displayProducts.map((product) => (
              <div key={product.id} className="luxury-product-item flex-shrink-0">
                <div 
                  className="luxury-product-card position-relative overflow-hidden"
                  onClick={() => handleProductClick(product.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Background Image */}
                  <Image
                    src={`/imgs/${product.image}`}
                    alt={product.name}
                    fill
                    className="luxury-product-bg"
                    sizes="300px"
                    draggable={false}
                  />
                  
                  {/* Overlay */}
                  <div className="luxury-product-overlay">
                    {/* Badges */}
                    <div className="luxury-badges">
                      {product.isNew && (
                        <span className="luxury-badge luxury-badge-new">جدید</span>
                      )}
                      {product.discount && (
                        <span className="luxury-badge luxury-badge-discount">-{product.discount}%</span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="luxury-product-info">
                      <h4 className="luxury-product-name">{product.name}</h4>
                      {product.weight && (
                        <p className="luxury-product-weight">
                          <i className="bi bi-scale me-1"></i>
                          {product.weight}
                        </p>
                      )}
                      <div className="luxury-product-price">
                        {product.originalPrice && (
                          <del className="luxury-price-old">{product.originalPrice}</del>
                        )}
                        <span className="luxury-price-current">{product.price} تومان</span>
                      </div>
                    </div>

                    {/* Hover Button */}
                    <div className="luxury-hover-action">
                      <button className="luxury-view-btn">
                        <i className="bi bi-eye me-2"></i>
                        مشاهده محصول
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* View All Button */}
            <div className="luxury-product-item flex-shrink-0">
              <div className="luxury-view-all-card d-flex align-items-center justify-content-center">
                <button
                  className="luxury-view-all-btn"
                  onClick={handleViewAllClick}
                  aria-label="مشاهده همه محصولات"
                >
                  <i className="bi bi-arrow-left fs-1"></i>
                  <span>مشاهده همه</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
