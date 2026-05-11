'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '../../components/Header';

interface Product {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  weight: string;
  goldType: string;
  purity: string;
  category: string;
  brand: string;
  rating: number;
  reviews: number;
  discount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  slug: string;
}

interface FilterState {
  category: string;
  priceRange: [number, number];
  goldType: string;
  weight: string;
  sortBy: string;
  searchQuery: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    priceRange: [0, 10000000],
    goldType: '',
    weight: '',
    sortBy: 'newest',
    searchQuery: ''
  });

  // Sample products data
  const allProducts: Product[] = [
    {
      id: 1,
      name: 'گردنبند طلای کلاسیک',
      price: '2,500,000',
      originalPrice: '3,000,000',
      image: '0397fc2c-ff19-42e9-86fe-5dd26e171548.jpeg',
      weight: '15 گرم',
      goldType: '18 عیار',
      purity: 'طلای خالص',
      category: 'گردنبند',
      brand: 'بارمن گلد',
      rating: 4.5,
      reviews: 28,
      discount: 17,
      isNew: true,
      slug: 'گردنبند-طلای-کلاسیک-15-گرم'
    },
    {
      id: 2,
      name: 'انگشتر الماس طلا',
      price: '1,800,000',
      image: '13f2a810-f9fd-4eea-9a3b-b492be813350.jpeg',
      weight: '8 گرم',
      goldType: '18 عیار',
      purity: 'طلای خالص',
      category: 'انگشتر',
      brand: 'بارمن گلد',
      rating: 4.8,
      reviews: 15,
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
      goldType: '18 عیار',
      purity: 'طلای خالص',
      category: 'دستبند',
      brand: 'بارمن گلد',
      rating: 4.3,
      reviews: 22,
      discount: 20,
      slug: 'دستبند-طلای-زنانه-12-گرم'
    },
    {
      id: 4,
      name: 'گوشواره مروارید',
      price: '800,000',
      image: '3c514297-7ee8-4c9a-a506-084c5cbc6247.jpeg',
      weight: '6 گرم',
      goldType: '14 عیار',
      purity: 'طلای معمولی',
      category: 'گوشواره',
      brand: 'بارمن گلد',
      rating: 4.6,
      reviews: 35,
      slug: 'گوشواره-مروارید-6-گرم'
    },
    {
      id: 5,
      name: 'ساعت طلای مردانه',
      price: '3,500,000',
      image: '4aeaf3ee-c48b-40f2-b300-9ee3272a4f27.jpeg',
      weight: '25 گرم',
      goldType: '18 عیار',
      purity: 'طلای خالص',
      category: 'ساعت',
      brand: 'بارمن گلد',
      rating: 4.9,
      reviews: 12,
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
      goldType: '22 عیار',
      purity: 'طلای خالص',
      category: 'زنجیر',
      brand: 'بارمن گلد',
      rating: 4.4,
      reviews: 18,
      discount: 21,
      slug: 'زنجیر-طلای-ضخیم-18-گرم'
    },
    // Add more products for infinite scroll
    {
      id: 7,
      name: 'سرویس طلای کامل',
      price: '5,000,000',
      originalPrice: '6,000,000',
      image: 'edb6ef26-21fa-4f31-aaa5-7842fe9fa989.jpeg',
      weight: '50 گرم',
      goldType: '18 عیار',
      purity: 'طلای خالص',
      category: 'سرویس',
      brand: 'بارمن گلد',
      rating: 4.8,
      reviews: 8,
      discount: 17,
      isNew: true,
      slug: 'سرویس-طلای-کامل-50-گرم'
    },
    {
      id: 8,
      name: 'سکه طلای عیار 18',
      price: '1,500,000',
      image: 'c55d0557-0268-498d-99f7-577844253c5f.jpeg',
      weight: '10 گرم',
      goldType: '18 عیار',
      purity: 'طلای خالص',
      category: 'سکه',
      brand: 'بارمن گلد',
      rating: 4.7,
      reviews: 25,
      slug: 'سکه-طلای-عیار-18-10-گرم'
    }
  ];

  // Load more products (infinite scroll)
  const loadMoreProducts = useCallback(() => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    setTimeout(() => {
      const startIndex = (page - 1) * 8;
      const newProducts = allProducts.slice(startIndex, startIndex + 8);
      
      if (newProducts.length === 0) {
        setHasMore(false);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
        setPage(prev => prev + 1);
      }
      setLoading(false);
    }, 1000);
  }, [page, loading, hasMore]);

  // Apply filters
  useEffect(() => {
    let filtered = [...products];

    if (filters.searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    if (filters.goldType) {
      filtered = filtered.filter(product => product.goldType === filters.goldType);
    }

    // Sort products
    switch (filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => parseInt(a.price.replace(/,/g, '')) - parseInt(b.price.replace(/,/g, '')));
        break;
      case 'price_high':
        filtered.sort((a, b) => parseInt(b.price.replace(/,/g, '')) - parseInt(a.price.replace(/,/g, '')));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
    }

    setFilteredProducts(filtered);
  }, [products, filters]);

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMoreProducts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreProducts]);

  // Initial load
  useEffect(() => {
    loadMoreProducts();
  }, []);

  const handleProductClick = (productId: number) => {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
      const encodedSlug = encodeURIComponent(product.slug);
      router.push(`/product/${encodedSlug}`);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      priceRange: [0, 10000000],
      goldType: '',
      weight: '',
      sortBy: 'newest',
      searchQuery: ''
    });
  };

  return (
    <div className="min-h-screen " style={{ backgroundColor: 'var(--barman-bg)'}} dir="rtl">
      {/* Header */}
      <Header />

      {/* Page Header */}
      <div className="py-5" style={{ backgroundColor: 'var(--barman-bg-light)', borderBottom: '1px solid var(--barman-gold-dark)', marginTop: '8rem' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h1 className="display-5 fw-bold mb-0" style={{ color: 'var(--barman-text)' }}>
                محصولات طلا و جواهرات
              </h1>
            </div>
            <div className="col-md-6 text-md-end">
              <button 
                className="btn btn-outline-light d-md-none"
                style={{ borderColor: 'var(--barman-gold)', color: 'var(--barman-gold)' }}
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="bi bi-funnel me-2"></i>
                فیلترها
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row g-0">
          
          {/* Filters Sidebar */}
          <div className={`col-lg-3 ${showFilters ? 'd-block' : 'd-none d-lg-block'}`} style={{marginTop: "40px"}} >
            <div className="luxury-filter-sidebar sticky-top p-4" style={{ top: '2rem', height: 'calc(100vh - 4rem)', overflowY: 'auto' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--barman-text)' }}>فیلترها</h5>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-link text-decoration-none p-0"
                    style={{ color: 'var(--barman-gold)' }}
                    onClick={clearFilters}
                  >
                    پاک کردن همه
                  </button>
                  <button 
                    className="btn btn-link text-decoration-none p-0 d-lg-none"
                    style={{ color: 'var(--barman-gold)' }}
                    onClick={() => setShowFilters(false)}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: 'var(--barman-text)' }}>جستجو</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="نام محصول را جستجو کنید..."
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: 'var(--barman-text)' }}>دسته‌بندی</label>
                <select 
                  className="form-select"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">همه دسته‌ها</option>
                  <option value="گردنبند">گردنبند</option>
                  <option value="انگشتر">انگشتر</option>
                  <option value="دستبند">دستبند</option>
                  <option value="گوشواره">گوشواره</option>
                  <option value="ساعت">ساعت</option>
                  <option value="زنجیر">زنجیر</option>
                  <option value="سرویس">سرویس</option>
                  <option value="سکه">سکه</option>
                </select>
              </div>

              {/* Gold Type Filter */}
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: 'var(--barman-text)' }}>نوع طلا</label>
                <div className="d-flex flex-column gap-2">
                  {['14 عیار', '18 عیار', '22 عیار', '24 عیار'].map(type => (
                    <div key={type} className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="goldType"
                        id={type}
                        checked={filters.goldType === type}
                        onChange={() => handleFilterChange('goldType', filters.goldType === type ? '' : type)}
                      />
                      <label className="form-check-label" style={{ color: 'var(--barman-text)' }} htmlFor={type}>
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weight Filter */}
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: 'var(--barman-text)' }}>وزن</label>
                <select 
                  className="form-select"
                  value={filters.weight}
                  onChange={(e) => handleFilterChange('weight', e.target.value)}
                >
                  <option value="">همه وزن‌ها</option>
                  <option value="زیر 10 گرم">زیر 10 گرم</option>
                  <option value="10-20 گرم">10-20 گرم</option>
                  <option value="20-30 گرم">20-30 گرم</option>
                  <option value="بالای 30 گرم">بالای 30 گرم</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: 'var(--barman-text)' }}>مرتب‌سازی</label>
                <select 
                  className="form-select"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="newest">جدیدترین</option>
                  <option value="price_low">قیمت: کم به زیاد</option>
                  <option value="price_high">قیمت: زیاد به کم</option>
                  <option value="rating">بیشترین امتیاز</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: 'var(--barman-text)' }}>محدوده قیمت</label>
                <div className="row g-2">
                  <div className="col-6">
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      placeholder="از"
                      value={filters.priceRange[0]}
                      onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value) || 0, filters.priceRange[1]])}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      placeholder="تا"
                      value={filters.priceRange[1]}
                      onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value) || 10000000])}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="col-lg-9">
            <div className="p-4">
              
              {/* Results Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <span className="text-white-50">
                  {filteredProducts.length} محصول یافت شد
                </span>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-light">
                    <i className="bi bi-grid"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-light">
                    <i className="bi bi-list"></i>
                  </button>
                </div>
              </div>

              {/* Products Grid */}
              <div className="row g-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="col-12 col-md-6 col-lg-4">
                    
                    {/* Desktop Card */}
                    <div className="d-none d-md-block">
                      <div 
                        className="luxury-product-card-v2"
                        onClick={() => handleProductClick(product.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Image Section */}
                        <div className="luxury-image-section position-relative overflow-hidden">
                          <Image
                            src={`/imgs/${product.image}`}
                            alt={product.name}
                            fill
                            className="object-fit-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          
                          {/* Badges */}
                          <div className="position-absolute top-0 end-0 p-3">
                            {product.isNew && <span className="badge mb-2 d-block" style={{ backgroundColor: 'var(--barman-gold)', color: 'var(--barman-bg)' }}>جدید</span>}
                            {product.discount && <span className="badge" style={{ backgroundColor: 'var(--barman-gold)', color: 'var(--barman-bg)' }}>-{product.discount}%</span>}
                          </div>

                          {/* Hover Overlay */}
                          <div className="luxury-hover-overlay">
                            <button className="btn luxury-btn-primary">
                              <i className="bi bi-eye me-2"></i>
                              مشاهده محصول
                            </button>
                          </div>
                        </div>

                        {/* Content Section - Below Image */}
                        <div className="luxury-content-section p-3">
                          <h5 className="fw-bold mb-2" style={{ color: 'var(--barman-text)' }}>{product.name}</h5>
                          <p className="small mb-2" style={{ color: 'var(--barman-text-dark)' }}>
                            <i className="bi bi-scale me-1"></i>
                            {product.weight} • {product.goldType}
                          </p>
                          
                          {/* Rating */}
                          <div className="d-flex align-items-center mb-2">
                            <div className="d-flex me-2">
                              {[...Array(5)].map((_, i) => (
                                <i
                                  key={i}
                                  className={`bi ${i < Math.floor(product.rating) ? 'bi-star-fill' : 'bi-star'} small`}
                                  style={{ color: 'var(--barman-gold)' }}
                                ></i>
                              ))}
                            </div>
                            <span className="small" style={{ color: 'var(--barman-text-dark)' }}>({product.reviews})</span>
                          </div>

                          {/* Price */}
                          <div className="text-center">
                            {product.originalPrice && (
                              <del className="d-block small" style={{ color: 'var(--barman-text-dark)' }}>{product.originalPrice}</del>
                            )}
                            <span className="fs-6 fw-bold" style={{ color: 'var(--barman-gold)' }}>
                              {product.price} تومان
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Card */}
                    <div className="d-block d-md-none">
                      <div 
                        className="luxury-mobile-card d-flex overflow-hidden"
                        onClick={() => handleProductClick(product.id)}
                        style={{ cursor: 'pointer', height: '120px' }}
                      >
                        {/* Content Left */}
                        <div className="flex-grow-1 p-3 d-flex flex-column justify-content-between">
                          <div>
                            <h6 className="text-white fw-bold mb-1">{product.name}</h6>
                            <p className="text-white-50 small mb-2">
                              {product.weight} • {product.goldType}
                            </p>
                            <div className="d-flex align-items-center mb-2">
                              {[...Array(5)].map((_, i) => (
                                <i
                                  key={i}
                                  className={`bi ${i < Math.floor(product.rating) ? 'bi-star-fill' : 'bi-star'} small`}
                                  style={{ color: 'var(--barman-gold)' }}
                                ></i>
                              ))}
                              <span className="text-white-50 small ms-2">({product.reviews})</span>
                            </div>
                          </div>
                          <div>
                            {product.originalPrice && (
                              <del className="text-white-50 small d-block">{product.originalPrice}</del>
                            )}
                            <span className="fw-bold" style={{ color: 'var(--barman-gold)' }}>
                              {product.price} تومان
                            </span>
                          </div>
                        </div>

                        {/* Image Right */}
                        <div className="position-relative" style={{ width: '120px' }}>
                          <Image
                            src={`/imgs/${product.image}`}
                            alt={product.name}
                            fill
                            className="object-fit-cover"
                            sizes="120px"
                          />
                          {/* Badges */}
                          <div className="position-absolute top-0 end-0 p-2">
                            {product.isNew && <span className="badge bg-warning text-dark small">جدید</span>}
                            {product.discount && <span className="badge bg-success small">-{product.discount}%</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Loading Indicator */}
              {loading && (
                <div className="text-center py-5">
                  <div className="spinner-border" style={{ color: 'var(--barman-gold)' }} role="status">
                    <span className="visually-hidden">در حال بارگذاری...</span>
                  </div>
                </div>
              )}

              {/* No More Products */}
              {!hasMore && filteredProducts.length > 0 && (
                <div className="text-center py-5">
                  <p className="text-white-50">همه محصولات نمایش داده شد</p>
                </div>
              )}

              {/* No Results */}
              {filteredProducts.length === 0 && !loading && (
                <div className="text-center py-5">
                  <i className="bi bi-search display-1 text-white-25 mb-3"></i>
                  <h4 className="text-white mb-3">محصولی یافت نشد</h4>
                  <p className="text-white-50">لطفاً فیلترهای خود را تغییر دهید</p>
                  <button className="btn luxury-btn-outline" onClick={clearFilters}>
                    پاک کردن فیلترها
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
