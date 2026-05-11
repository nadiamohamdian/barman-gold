'use client';

interface Category {
  id: number;
  name: string;
  image: string;
  href?: string;
}

interface CategoryGridProps {
  title: string;
  subtitle?: string;
  categories: Category[];
  showViewAll?: boolean;
}

export default function CategoryGrid({ 
  title, 
  subtitle, 
  categories, 
  showViewAll = true 
}: CategoryGridProps) {
  return (
    <section className="category-grid-section">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="section-title h3 mb-2">{title}</h2>
          {subtitle && <div className="section-sub">{subtitle}</div>}
        </div>

        {/* Categories Grid */}
        <div className="category-grid">
          {categories.map((category) => (
            <a 
              key={category.id} 
              href={category.href || '#'} 
              className="category-item"
            >
              <div className="category-image-container">
                <img 
                  src={`/imgs/${category.image}`} 
                  alt={category.name}
                  className="category-image"
                  loading="lazy"
                />
              </div>
              <div className="category-name">{category.name}</div>
            </a>
          ))}
        </div>

        {/* View All Link */}
        {showViewAll && (
          <div className="text-center mt-4">
            <a href="#" className="btn btn-outline-light">
              مشاهده همه دسته‌ها
              <i className="bi bi-arrow-left me-1"></i>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
