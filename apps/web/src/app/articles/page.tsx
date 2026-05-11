'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '../../components/Header';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  authorAvatar: string;
  publishDate: string;
  readTime: string;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  slug: string;
}

interface FilterState {
  category: string;
  sortBy: string;
  searchQuery: string;
}

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    sortBy: 'newest',
    searchQuery: ''
  });

  // Sample articles data
  const allArticles: Article[] = [
    {
      id: 1,
      title: 'راهنمای خرید طلا برای تازه‌کارها',
      excerpt: 'همه چیزی که باید در مورد خرید طلا بدانید، از انتخاب عیار تا نگهداری صحیح زیورآلات.',
      content: 'محتوای کامل مقاله...',
      image: '0397fc2c-ff19-42e9-86fe-5dd26e171548.jpeg',
      author: 'احمد نباوی',
      authorAvatar: '/imgs/author1.jpg',
      publishDate: '۱۴۰۳/۰۶/۱۵',
      readTime: '۵ دقیقه',
      category: 'راهنمای خرید',
      tags: ['طلا', 'راهنما', 'خرید'],
      views: 1250,
      likes: 89,
      slug: 'راهنمای-خرید-طلا-برای-تازه-کارها'
    },
    {
      id: 2,
      title: 'تفاوت عیارهای مختلف طلا',
      excerpt: 'بررسی کامل تفاوت‌های عیار ۱۴، ۱۸، ۲۲ و ۲۴ طلا و کاربرد هر کدام در ساخت زیورآلات.',
      content: 'محتوای کامل مقاله...',
      image: '13f2a810-f9fd-4eea-9a3b-b492be813350.jpeg',
      author: 'مریم احمدی',
      authorAvatar: '/imgs/author2.jpg',
      publishDate: '۱۴۰۳/۰۶/۱۰',
      readTime: '۷ دقیقه',
      category: 'آموزشی',
      tags: ['عیار', 'طلا', 'آموزش'],
      views: 980,
      likes: 67,
      slug: 'تفاوت-عیارهای-مختلف-طلا'
    },
    {
      id: 3,
      title: 'نحوه نگهداری از زیورآلات طلا',
      excerpt: 'روش‌های صحیح نگهداری، تمیز کردن و محافظت از زیورآلات طلا برای حفظ زیبایی و درخشندگی.',
      content: 'محتوای کامل مقاله...',
      image: '339798d7-433e-4a74-b6d5-3ba6863478b1.jpeg',
      author: 'علی رضایی',
      authorAvatar: '/imgs/author3.jpg',
      publishDate: '۱۴۰۳/۰۶/۰۵',
      readTime: '۴ دقیقه',
      category: 'نگهداری',
      tags: ['نگهداری', 'تمیزکاری', 'طلا'],
      views: 1500,
      likes: 120,
      slug: 'نحوه-نگهداری-از-زیورآلات-طلا'
    },
    {
      id: 4,
      title: 'ترندهای جدید طراحی جواهرات ۲۰۲۵',
      excerpt: 'آشنایی با جدیدترین ترندهای طراحی جواهرات و زیورآلات در سال ۲۰۲۵.',
      content: 'محتوای کامل مقاله...',
      image: '3c514297-7ee8-4c9a-a506-084c5cbc6247.jpeg',
      author: 'سارا موسوی',
      authorAvatar: '/imgs/author4.jpg',
      publishDate: '۱۴۰۳/۰۵/۲۸',
      readTime: '۶ دقیقه',
      category: 'ترندها',
      tags: ['ترند', 'طراحی', 'جواهرات'],
      views: 2100,
      likes: 156,
      slug: 'ترندهای-جدید-طراحی-جواهرات-2025'
    },
    {
      id: 5,
      title: 'سرمایه‌گذاری در طلا؛ نکات مهم',
      excerpt: 'همه چیز در مورد سرمایه‌گذاری در طلا، انواع سکه و شمش طلا و نکات خرید.',
      content: 'محتوای کامل مقاله...',
      image: '4aeaf3ee-c48b-40f2-b300-9ee3272a4f27.jpeg',
      author: 'محمد کریمی',
      authorAvatar: '/imgs/author5.jpg',
      publishDate: '۱۴۰۳/۰۵/۲۰',
      readTime: '۸ دقیقه',
      category: 'سرمایه‌گذاری',
      tags: ['سرمایه‌گذاری', 'سکه', 'شمش'],
      views: 1800,
      likes: 134,
      slug: 'سرمایه-گذاری-در-طلا-نکات-مهم'
    },
    {
      id: 6,
      title: 'انتخاب بهترین انگشتر نامزدی',
      excerpt: 'راهنمای کامل انتخاب انگشتر نامزدی، از انتخاب سنگ تا اندازه و طراحی مناسب.',
      content: 'محتوای کامل مقاله...',
      image: 'b9089b38-721a-4798-b793-a14298fbd8e3.jpeg',
      author: 'فاطمه حسینی',
      authorAvatar: '/imgs/author6.jpg',
      publishDate: '۱۴۰۳/۰۵/۱۵',
      readTime: '۱۰ دقیقه',
      category: 'راهنمای خرید',
      tags: ['انگشتر', 'نامزدی', 'راهنما'],
      views: 3200,
      likes: 245,
      slug: 'انتخاب-بهترین-انگشتر-نامزدی'
    }
  ];

  // Load more articles (infinite scroll)
  const loadMoreArticles = () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    setTimeout(() => {
      const startIndex = (page - 1) * 6;
      const newArticles = allArticles.slice(startIndex, startIndex + 6);
      
      if (newArticles.length === 0) {
        setHasMore(false);
      } else {
        setArticles(prev => [...prev, ...newArticles]);
        setPage(prev => prev + 1);
      }
      setLoading(false);
    }, 1000);
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...articles];

    if (filters.searchQuery) {
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    if (filters.category) {
      filtered = filtered.filter(article => article.category === filters.category);
    }

    // Sort articles
    switch (filters.sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'likes':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime());
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
        break;
    }

    setFilteredArticles(filtered);
  }, [articles, filters]);

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMoreArticles();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, page]);

  // Initial load
  useEffect(() => {
    loadMoreArticles();
  }, []);

  const handleArticleClick = (articleId: number) => {
    const article = allArticles.find(a => a.id === articleId);
    if (article) {
      const encodedSlug = encodeURIComponent(article.slug);
      router.push(`/articles/${encodedSlug}`);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      sortBy: 'newest',
      searchQuery: ''
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--barman-bg)' }} dir="rtl">
      {/* Header */}
      <Header />

      {/* Page Header */}
      <div className="py-5" style={{ backgroundColor: 'var(--barman-bg-light)', borderBottom: '1px solid var(--barman-gold-dark)', marginTop: '4rem' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h1 className="display-5 fw-bold mb-0" style={{ color: 'var(--barman-text)' }}>
                مقالات و راهنماها
              </h1>
              <p className="lead mt-2 mb-0" style={{ color: 'var(--barman-text-dark)' }}>
                آموزش‌ها و اطلاعات مفید در مورد طلا و جواهرات
              </p>
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
          <div className={`col-lg-3 ${showFilters ? 'd-block' : 'd-none d-lg-block'}`} style={{ marginTop: "40px" }}>
            <div className="luxury-filter-sidebar sticky-top p-4" style={{ top: '2rem', height: 'calc(100vh - 4rem)', overflowY: 'auto' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--barman-text)' }}>دسته‌بندی مقالات</h5>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-link text-decoration-none p-0"
                    style={{ color: 'var(--barman-gold)' }}
                    onClick={clearFilters}
                  >
                    پاک کردن
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
                  placeholder="جستجو در مقالات..."
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: 'var(--barman-text)' }}>دسته‌بندی</label>
                <div className="d-flex flex-column gap-2">
                  {[
                    { value: '', label: 'همه مقالات', count: 24 },
                    { value: 'راهنمای خرید', label: 'راهنمای خرید', count: 8 },
                    { value: 'آموزشی', label: 'آموزشی', count: 6 },
                    { value: 'نگهداری', label: 'نگهداری', count: 4 },
                    { value: 'ترندها', label: 'ترندها', count: 3 },
                    { value: 'سرمایه‌گذاری', label: 'سرمایه‌گذاری', count: 3 }
                  ].map(cat => (
                    <div key={cat.value} className="luxury-category-item">
                      <button
                        className={`luxury-category-btn w-100 text-start ${filters.category === cat.value ? 'active' : ''}`}
                        onClick={() => handleFilterChange('category', cat.value)}
                      >
                        <span>{cat.label}</span>
                        <span className="luxury-count">{cat.count}</span>
                      </button>
                    </div>
                  ))}
                </div>
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
                  <option value="oldest">قدیمی‌ترین</option>
                  <option value="popular">پربازدیدترین</option>
                  <option value="likes">محبوب‌ترین</option>
                </select>
              </div>

              {/* Popular Tags */}
              <div className="mb-4">
                <h6 className="fw-semibold mb-3" style={{ color: 'var(--barman-text)' }}>برچسب‌های محبوب</h6>
                <div className="d-flex flex-wrap gap-2">
                  {['طلا', 'راهنما', 'خرید', 'عیار', 'آموزش', 'نگهداری', 'ترند', 'سرمایه‌گذاری'].map(tag => (
                    <button
                      key={tag}
                      className="luxury-tag-btn"
                      onClick={() => handleFilterChange('searchQuery', tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          <div className="col-lg-9">
            <div className="p-4" style={{ marginTop: '40px' }}>
              
              {/* Results Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <span className="text-white-50">
                  {filteredArticles.length} مقاله یافت شد
                </span>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-light">
                    <i className="bi bi-grid-3x3-gap"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-light">
                    <i className="bi bi-list-ul"></i>
                  </button>
                </div>
              </div>

              {/* Articles Grid */}
              <div className="row g-4">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="col-12 col-md-6 col-lg-4">
                    <div 
                      className="luxury-article-card"
                      onClick={() => handleArticleClick(article.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Article Image */}
                      <div className="luxury-article-image position-relative overflow-hidden">
                        <Image
                          src={`/imgs/${article.image}`}
                          alt={article.title}
                          fill
                          className="object-fit-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        
                        {/* Category Badge */}
                        <div className="position-absolute top-0 end-0 p-3">
                          <span className="luxury-category-badge">{article.category}</span>
                        </div>

                        {/* Hover Overlay */}
                        <div className="luxury-article-overlay">
                          <button className="luxury-read-btn">
                            <i className="bi bi-book me-2"></i>
                            مطالعه مقاله
                          </button>
                        </div>
                      </div>

                      {/* Article Content */}
                      <div className="luxury-article-content p-4">
                        <h4 className="luxury-article-title mb-3">{article.title}</h4>
                        <p className="luxury-article-excerpt mb-3">{article.excerpt}</p>
                        
                        {/* Article Meta */}
                        <div className="luxury-article-meta d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <div className="luxury-author-avatar me-2">
                              <i className="bi bi-person-circle fs-5" style={{ color: 'var(--barman-gold)' }}></i>
                            </div>
                            <div>
                              <div className="luxury-author-name">{article.author}</div>
                              <div className="luxury-publish-date">{article.publishDate}</div>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="luxury-read-time">
                              <i className="bi bi-clock me-1"></i>
                              {article.readTime}
                            </div>
                            <div className="luxury-article-stats">
                              <span className="me-3">
                                <i className="bi bi-eye me-1"></i>
                                {article.views.toLocaleString('fa-IR')}
                              </span>
                              <span>
                                <i className="bi bi-heart me-1"></i>
                                {article.likes}
                              </span>
                            </div>
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

              {/* No More Articles */}
              {!hasMore && filteredArticles.length > 0 && (
                <div className="text-center py-5">
                  <p className="text-white-50">همه مقالات نمایش داده شد</p>
                </div>
              )}

              {/* No Results */}
              {filteredArticles.length === 0 && !loading && (
                <div className="text-center py-5">
                  <i className="bi bi-file-text display-1 text-white-25 mb-3"></i>
                  <h4 className="text-white mb-3">مقاله‌ای یافت نشد</h4>
                  <p className="text-white-50">لطفاً کلمات کلیدی دیگری امتحان کنید</p>
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
