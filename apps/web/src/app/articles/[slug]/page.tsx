'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '../../../components/Header';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  authorAvatar?: string;
  publishDate: string;
  readTime: string;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  slug: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  // Sample articles database
  const articlesDatabase: Record<string, Article> = {
    "راهنمای-خرید-طلا-برای-تازه-کارها": {
      id: 1,
      title: 'راهنمای خرید طلا برای تازه‌کارها',
      excerpt: 'همه چیزی که باید در مورد خرید طلا بدانید، از انتخاب عیار تا نگهداری صحیح زیورآلات.',
      content: `
        <h2>مقدمه</h2>
        <p>خرید طلا یکی از مهم‌ترین سرمایه‌گذاری‌هایی است که افراد در طول زندگی انجام می‌دهند. در این راهنما، ما به شما کمک می‌کنیم تا بهترین انتخاب را داشته باشید.</p>
        
        <h3>۱. انتخاب عیار مناسب</h3>
        <p>عیار طلا نشان‌دهنده خلوص آن است. عیارهای مختلف کاربردهای متفاوتی دارند:</p>
        <ul>
          <li><strong>۲۴ عیار:</strong> خالص‌ترین نوع طلا، مناسب سرمایه‌گذاری</li>
          <li><strong>۲۲ عیار:</strong> مناسب برای زیورآلات سنتی</li>
          <li><strong>۱۸ عیار:</strong> بهترین انتخاب برای زیورآلات روزمره</li>
          <li><strong>۱۴ عیار:</strong> مقاوم‌تر، مناسب انگشترها</li>
        </ul>
        
        <h3>۲. بررسی کیفیت و اصالت</h3>
        <p>همیشه از فروشندگان معتبر خرید کنید و گواهی اصالت دریافت کنید. علائم کیفیت عبارتند از:</p>
        <ul>
          <li>نشان عیار روی محصول</li>
          <li>گواهی اصالت معتبر</li>
          <li>وزن دقیق محصول</li>
          <li>ضمانت فروشنده</li>
        </ul>
        
        <h3>۳. نکات مهم خرید</h3>
        <p>قبل از خرید، این نکات را در نظر بگیرید:</p>
        <ul>
          <li>قیمت روز طلا را بررسی کنید</li>
          <li>اجرت ساخت را در نظر بگیرید</li>
          <li>امکان تعویض و بازگشت را بپرسید</li>
          <li>شرایط گارانتی را مطالعه کنید</li>
        </ul>
        
        <h3>۴. نگهداری صحیح</h3>
        <p>برای حفظ زیبایی و ارزش طلای خود:</p>
        <ul>
          <li>در جای خشک و امن نگهداری کنید</li>
          <li>از مواد شیمیایی دور نگه دارید</li>
          <li>به صورت دوره‌ای تمیز کنید</li>
          <li>از ضربه و خراش محافظت کنید</li>
        </ul>
        
        <h2>نتیجه‌گیری</h2>
        <p>خرید طلا نیاز به دانش و دقت دارد. با رعایت این نکات، می‌توانید بهترین انتخاب را داشته باشید و از سرمایه‌گذاری خود راضی باشید.</p>
      `,
      image: '0397fc2c-ff19-42e9-86fe-5dd26e171548.jpeg',
      author: 'احمد نباوی',
      authorAvatar: '/imgs/author1.jpg',
      publishDate: '۱۴۰۳/۰۶/۱۵',
      readTime: '۵ دقیقه',
      category: 'راهنمای خرید',
      tags: ['طلا', 'راهنما', 'خرید', 'سرمایه‌گذاری'],
      views: 1250,
      likes: 89,
      slug: 'راهنمای-خرید-طلا-برای-تازه-کارها'
    },
    "تفاوت-عیارهای-مختلف-طلا": {
      id: 2,
      title: 'تفاوت عیارهای مختلف طلا',
      excerpt: 'بررسی کامل تفاوت‌های عیار ۱۴، ۱۸، ۲۲ و ۲۴ طلا و کاربرد هر کدام در ساخت زیورآلات.',
      content: `
        <h2>عیار طلا چیست؟</h2>
        <p>عیار طلا میزان خلوص طلا در یک قطعه زیورآلات را نشان می‌دهد. هر چه عدد عیار بالاتر باشد، طلا خالص‌تر است.</p>
        
        <h3>انواع عیارهای طلا</h3>
        
        <h4>طلای ۲۴ عیار</h4>
        <p>خالص‌ترین نوع طلا با ۹۹.۹٪ خلوص. مناسب برای:</p>
        <ul>
          <li>سرمایه‌گذاری</li>
          <li>سکه و شمش</li>
          <li>ذخیره ارزش</li>
        </ul>
        
        <h4>طلای ۲۲ عیار</h4>
        <p>حاوی ۹۱.۷٪ طلا و ۸.۳٪ فلزات دیگر. مناسب برای:</p>
        <ul>
          <li>زیورآلات سنتی</li>
          <li>طلاهای هندی</li>
          <li>نیم‌ست و سرویس</li>
        </ul>
        
        <h4>طلای ۱۸ عیار</h4>
        <p>حاوی ۷۵٪ طلا. بهترین انتخاب برای:</p>
        <ul>
          <li>زیورآلات روزمره</li>
          <li>گردنبند و دستبند</li>
          <li>ترکیب زیبایی و مقاومت</li>
        </ul>
        
        <h4>طلای ۱۴ عیار</h4>
        <p>حاوی ۵۸.۳٪ طلا. مناسب برای:</p>
        <ul>
          <li>انگشترهای روزمره</li>
          <li>زیورآلات ورزشی</li>
          <li>استفاده مداوم</li>
        </ul>
      `,
      image: '13f2a810-f9fd-4eea-9a3b-b492be813350.jpeg',
      author: 'مریم احمدی',
      publishDate: '۱۴۰۳/۰۶/۱۰',
      readTime: '۷ دقیقه',
      category: 'آموزشی',
      tags: ['عیار', 'طلا', 'آموزش'],
      views: 980,
      likes: 67,
      slug: 'تفاوت-عیارهای-مختلف-طلا'
    }
  };

  const sampleRelatedArticles: Article[] = [
    {
      id: 7,
      title: 'راهنمای تشخیص طلای اصل از تقلبی',
      excerpt: 'روش‌های ساده برای تشخیص اصل بودن طلا',
      content: '',
      image: 'c55d0557-0268-498d-99f7-577844253c5f.jpeg',
      author: 'علی رضایی',
      publishDate: '۱۴۰۳/۰۶/۰۱',
      readTime: '۴ دقیقه',
      category: 'راهنمای خرید',
      tags: ['طلا', 'تشخیص'],
      views: 850,
      likes: 42,
      slug: 'راهنمای-تشخیص-طلای-اصل-از-تقلبی'
    },
    {
      id: 8,
      title: 'بهترین زمان خرید طلا',
      excerpt: 'چه زمانی برای خرید طلا مناسب است؟',
      content: '',
      image: 'edb6ef26-21fa-4f31-aaa5-7842fe9fa989.jpeg',
      author: 'سارا موسوی',
      publishDate: '۱۴۰۳/۰۵/۲۵',
      readTime: '۶ دقیقه',
      category: 'سرمایه‌گذاری',
      tags: ['طلا', 'زمان خرید'],
      views: 1200,
      likes: 78,
      slug: 'بهترین-زمان-خرید-طلا'
    },
    {
      id: 9,
      title: 'طراحی‌های مدرن جواهرات',
      excerpt: 'آشنایی با جدیدترین طراحی‌های جواهرات',
      content: '',
      image: 'f753bf84-5b59-4489-8885-2ba8d59c62a0.jpeg',
      author: 'محمد کریمی',
      publishDate: '۱۴۰۳/۰۵/۲۰',
      readTime: '۵ دقیقه',
      category: 'ترندها',
      tags: ['طراحی', 'مدرن'],
      views: 950,
      likes: 65,
      slug: 'طراحی-های-مدرن-جواهرات'
    },
    {
      id: 10,
      title: 'نحوه محاسبه قیمت طلا',
      excerpt: 'فرمول محاسبه قیمت طلا بر اساس وزن و عیار',
      content: '',
      image: 'ff43e829-7e0c-4d01-81eb-a6c947642e1f.jpeg',
      author: 'فاطمه حسینی',
      publishDate: '۱۴۰۳/۰۵/۱۸',
      readTime: '۳ دقیقه',
      category: 'آموزشی',
      tags: ['قیمت', 'محاسبه'],
      views: 720,
      likes: 38,
      slug: 'نحوه-محاسبه-قیمت-طلا'
    }
  ];

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      const slug = params.slug as string;
      const decodedSlug = decodeURIComponent(slug);
      const foundArticle = articlesDatabase[decodedSlug];
      
      if (foundArticle) {
        setArticle(foundArticle);
        // Set related articles (excluding current)
        setRelatedArticles(sampleRelatedArticles.slice(0, 4));
      }
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--barman-bg)' }}>
        <div className="text-center">
          <div className="spinner-border" style={{ color: 'var(--barman-gold)' }} role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3" style={{ color: 'var(--barman-gold)' }}>در حال بارگذاری مقاله...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--barman-bg)' }}>
        <div className="text-center text-white">
          <h1 className="display-4 mb-4">مقاله یافت نشد</h1>
          <p className="lead">مقاله مورد نظر شما وجود ندارد.</p>
          <button className="btn luxury-btn-primary" onClick={() => router.push('/articles')}>
            بازگشت به مقالات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--barman-bg)' }} dir="rtl">
      {/* Header */}
      <Header />

      {/* Breadcrumb */}
      <div className="py-3" style={{ backgroundColor: 'var(--barman-bg-light)', borderBottom: '1px solid var(--barman-gold-dark)', marginTop: '4rem' }}>
        <div className="container">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/" className="text-decoration-none" style={{ color: 'var(--barman-gold)' }}>
                  <i className="bi bi-house-door me-1"></i>
                  خانه
                </a>
              </li>
              <li className="breadcrumb-item">
                <a href="/articles" className="text-decoration-none" style={{ color: 'var(--barman-gold)' }}>
                  مقالات
                </a>
              </li>
              <li className="breadcrumb-item active" style={{ color: 'var(--barman-text)' }} aria-current="page">
                {article.title}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            
            {/* Article Header */}
            <div className="text-center mb-5">
              <span className="badge rounded-pill px-3 py-2 mb-3" style={{ backgroundColor: 'var(--barman-gold)', color: 'var(--barman-bg)' }}>
                {article.category}
              </span>
              <h1 className="display-5 fw-bold mb-4" style={{ color: 'var(--barman-text)', lineHeight: '1.3' }}>
                {article.title}
              </h1>
              <p className="lead mb-4" style={{ color: 'var(--barman-text-dark)' }}>
                {article.excerpt}
              </p>
              
              {/* Article Meta */}
              <div className="d-flex justify-content-center align-items-center gap-4 mb-4">
                <div className="d-flex align-items-center">
                  <i className="bi bi-person-circle fs-5 me-2" style={{ color: 'var(--barman-gold)' }}></i>
                  <span style={{ color: 'var(--barman-text)' }}>{article.author}</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-calendar3 me-2" style={{ color: 'var(--barman-gold)' }}></i>
                  <span style={{ color: 'var(--barman-text-dark)' }}>{article.publishDate}</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-clock me-2" style={{ color: 'var(--barman-gold)' }}></i>
                  <span style={{ color: 'var(--barman-text-dark)' }}>{article.readTime}</span>
                </div>
              </div>

              {/* Article Stats */}
              <div className="d-flex justify-content-center gap-4">
                <span style={{ color: 'var(--barman-text-dark)' }}>
                  <i className="bi bi-eye me-1" style={{ color: 'var(--barman-gold)' }}></i>
                  {article.views.toLocaleString('fa-IR')} بازدید
                </span>
                <span style={{ color: 'var(--barman-text-dark)' }}>
                  <i className="bi bi-heart me-1" style={{ color: 'var(--barman-gold)' }}></i>
                  {article.likes} پسند
                </span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="luxury-article-featured-image mb-5">
              <div className="ratio ratio-16x9 rounded-3 overflow-hidden">
                <Image
                  src={`/imgs/${article.image}`}
                  alt={article.title}
                  fill
                  className="object-fit-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
            </div>

            {/* Article Content */}
            <div className="luxury-article-body mb-5">
              <div 
                className="luxury-content-text"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>

            {/* Article Tags */}
            <div className="mb-5">
              <h6 className="fw-semibold mb-3" style={{ color: 'var(--barman-text)' }}>برچسب‌ها:</h6>
              <div className="d-flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <span key={tag} className="luxury-article-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Share Buttons */}
            <div className="text-center mb-5 p-4 rounded-3" style={{ backgroundColor: 'var(--barman-bg-light)', border: '1px solid var(--barman-gold-dark)' }}>
              <h6 className="fw-semibold mb-3" style={{ color: 'var(--barman-text)' }}>اشتراک‌گذاری مقاله</h6>
              <div className="d-flex justify-content-center gap-3">
                <button className="btn btn-outline-light" style={{ borderColor: 'var(--barman-gold)', color: 'var(--barman-gold)' }}>
                  <i className="bi bi-telegram"></i>
                </button>
                <button className="btn btn-outline-light" style={{ borderColor: 'var(--barman-gold)', color: 'var(--barman-gold)' }}>
                  <i className="bi bi-whatsapp"></i>
                </button>
                <button className="btn btn-outline-light" style={{ borderColor: 'var(--barman-gold)', color: 'var(--barman-gold)' }}>
                  <i className="bi bi-twitter"></i>
                </button>
                <button className="btn btn-outline-light" style={{ borderColor: 'var(--barman-gold)', color: 'var(--barman-gold)' }}>
                  <i className="bi bi-link-45deg"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        <div className="row justify-content-center mt-5">
          <div className="col-12">
            <h3 className="text-center mb-5" style={{ color: 'var(--barman-text)' }}>مقالات مرتبط</h3>
            <div className="row g-4">
              {relatedArticles.map((relatedArticle) => (
                <div key={relatedArticle.id} className="col-12 col-md-6 col-lg-3">
                  <div 
                    className="luxury-related-card"
                    onClick={() => router.push(`/articles/${encodeURIComponent(relatedArticle.slug)}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="luxury-related-image position-relative overflow-hidden mb-3">
                      <Image
                        src={`/imgs/${relatedArticle.image}`}
                        alt={relatedArticle.title}
                        fill
                        className="object-fit-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </div>
                    <h6 className="fw-bold mb-2" style={{ color: 'var(--barman-text)' }}>
                      {relatedArticle.title}
                    </h6>
                    <p className="small mb-2" style={{ color: 'var(--barman-text-dark)' }}>
                      {relatedArticle.excerpt}
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small" style={{ color: 'var(--barman-text-dark)' }}>
                        {relatedArticle.author}
                      </span>
                      <span className="small" style={{ color: 'var(--barman-gold)' }}>
                        {relatedArticle.readTime}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
