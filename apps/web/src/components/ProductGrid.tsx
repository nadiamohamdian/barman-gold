'use client';

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

interface ProductGridProps {
  title?: string;
  subtitle?: string;
  products: Product[];
  columns?: number;
  onAddToCart?: (productId: number) => void;
  onViewDetails?: (productId: number) => void;
  onProductClick?: (productId: number) => void;
}

export default function ProductGrid({
  title,
  subtitle,
  products,
  columns = 4,
  onAddToCart,
  onViewDetails,
  onProductClick
}: ProductGridProps) {
  return (
    <section className="product-grid-section">
      {(title || subtitle) && (
        <div className="section-header">
          {title && <h2 className="section-title">{title}</h2>}
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div 
        className="product-grid"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          '--grid-columns': columns
        } as React.CSSProperties}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            onAddToCart={onAddToCart}
            onViewDetails={onProductClick}
          />
        ))}
      </div>
    </section>
  );
}
