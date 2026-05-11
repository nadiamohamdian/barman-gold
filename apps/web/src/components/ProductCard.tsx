'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductCardProps {
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
  onAddToCart?: (productId: number) => void;
  onViewDetails?: (productId: number) => void;
}

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  discount,
  image,
  weight,
  rating,
  reviews,
  specs,
  delivery,
  stock,
  isNew = false,
  isFeatured = false,
  onAddToCart,
  onViewDetails
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(id);
  };

  const handleViewDetails = () => {
    onViewDetails?.(id);
  };

  return (
    <div 
      className={`glass-product-card ${isHovered ? 'hovered' : ''} ${isNew ? 'new' : ''} ${isFeatured ? 'featured' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleViewDetails}
    >
      {/* Glass Background Effect */}
      <div className="glass-background"></div>
      
      {/* Product Image Container */}
      <div className="glass-image-container">
        <div className="glass-image-wrapper">
          <Image
            src={`/imgs/${image}`}
            alt={name}
            fill
            className={`glass-product-image ${isImageLoaded ? 'loaded' : ''}`}
            onLoad={() => setIsImageLoaded(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Glass Overlay */}
          <div className="glass-overlay">
            <div className="glass-actions">
              <button 
                className="glass-action-btn view-btn"
                onClick={handleViewDetails}
                aria-label="مشاهده جزئیات"
              >
                <i className="bi bi-eye"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Weight Badge - Glass Style */}
        {weight && (
          <div className="glass-weight-badge">
            <i className="bi bi-scale"></i>
            <span>{weight}</span>
          </div>
        )}

        {/* Status Badges */}
        <div className="glass-badges">
          {isNew && <span className="glass-badge new-badge">جدید</span>}
          {isFeatured && <span className="glass-badge featured-badge">ویژه</span>}
          {discount && <span className="glass-badge discount-badge">-{discount}%</span>}
        </div>
      </div>

      {/* Glass Content Area */}
      <div className="glass-content">
        {/* Product Name - Minimal */}
        <h3 className="glass-product-name">{name}</h3>

        {/* Price Section - Prominent */}
        <div className="glass-price-section">
          <div className="glass-price-main">
            <span className="glass-current-price">{price} تومان</span>
            {originalPrice && (
              <span className="glass-original-price">{originalPrice} تومان</span>
            )}
          </div>
        </div>

        {/* View Button - Glass Style */}
        <button 
          className="glass-view-button"
          onClick={handleViewDetails}
        >
          <i className="bi bi-eye"></i>
          <span>مشاهده محصول</span>
        </button>
      </div>
    </div>
  );
}
