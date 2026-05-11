'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Header from '../../../components/Header';
import SimilarProductsCarousel from '../../../components/SimilarProductsCarousel';

interface Product {
  id: string;
  name: string;
  slug: string;
  category: 'ring' | 'bracelet' | 'necklace' | 'earring' | 'set' | 'coin' | 'bar';
  brand: string;
  sku: string;
  weight_g: number;
  purity_k: number;
  making_fee: number;
  images: { url: string; alt: string; isPrimary: boolean }[];
  stock: { status: 'in_stock' | 'preorder' | 'made_to_order'; qty: number };
  policies: { return_days: number; warranty: string };
  description: string;
  rating: { value: number; count: number };
  dimensions?: { width_mm: number; thickness_mm: number };
  certificates?: { name: string; url: string }[];
}

interface LivePrices {
  gold_per_gram_24k: number;
  updated_at_iso: string;
}

interface PricingBreakdown {
  baseGoldPrice: number;
  makingFee: number;
  brandPremium: number;
  packagingFee: number;
  taxVat: number;
  discount: number;
  finalPrice: number;
}

export default function LuxuryProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [livePrice, setLivePrice] = useState<LivePrices>({ 
    gold_per_gram_24k: 3450000, 
    updated_at_iso: new Date().toISOString() 
  });
  const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Purity factors
  const purityFactors: Record<number, number> = {
    24: 1, 22: 0.9167, 21: 0.875, 18: 0.75, 14: 0.5833
  };

  // Calculate final price
  const calculatePrice = (product: Product, goldPrice: number): PricingBreakdown => {
    const purityFactor = purityFactors[product.purity_k] || 0.75;
    const baseGoldPrice = goldPrice * product.weight_g * purityFactor;
    const makingFee = product.making_fee;
    const brandPremium = baseGoldPrice * 0.05;
    const packagingFee = 50000;
    const taxVat = (baseGoldPrice + makingFee + brandPremium + packagingFee) * 0.09;
    const discount = 0;
    const finalPrice = Math.ceil((baseGoldPrice + makingFee + brandPremium + packagingFee + taxVat - discount) / 1000) * 1000;

    return { baseGoldPrice, makingFee, brandPremium, packagingFee, taxVat, discount, finalPrice };
  };

  // Sample products
  const productsDatabase: Record<string, Product> = {
    "گردنبند-طلای-کلاسیک-15-گرم": {
      id: "PD-001",
      name: "گردنبند طلای کلاسیک",
      slug: "گردنبند-طلای-کلاسیک-15-گرم",
      category: "necklace",
      brand: "گالری بارمن گلد",
      sku: "BGN-001-18K-15G",
      weight_g: 15,
      purity_k: 18,
      making_fee: 850000,
      images: [
        { url: "/imgs/0397fc2c-ff19-42e9-86fe-5dd26e171548.jpeg", alt: "نمای نزدیک گردنبند طلا", isPrimary: true },
        { url: "/imgs/13f2a810-f9fd-4eea-9a3b-b492be813350.jpeg", alt: "گردنبند روی گردن", isPrimary: false },
        { url: "/imgs/339798d7-433e-4a74-b6d5-3ba6863478b1.jpeg", alt: "گردنبند از زاویه دیگر", isPrimary: false }
      ],
      stock: { status: "in_stock", qty: 5 },
      policies: { return_days: 7, warranty: "گارانتی 2 ساله اصالت و عیار" },
      description: "این گردنبند طلا ۱۸ عیار با طراحی کلاسیک و زیبا، مناسب استفاده روزمره و مجلسی است. ساخته شده از بهترین طلای ایرانی با ضمانت اصالت. این محصول با استفاده از تکنیک‌های مدرن طلاسازی و با دقت بالا ساخته شده است. طراحی منحصر به فرد آن باعث می‌شود که در هر مناسبتی بدرخشد. قابلیت تنظیم طول زنجیر و امکان ترکیب با سایر زیورآلات از ویژگی‌های بارز این محصول است. همچنین این گردنبند دارای گارانتی کامل اصالت و عیار بوده و با بسته‌بندی لوکس ارائه می‌شود.",
      rating: { value: 4.5, count: 28 },
      dimensions: { width_mm: 45, thickness_mm: 2 },
      certificates: [
        { name: "گواهی اصالت طلا", url: "/certificates/authenticity.pdf" }
      ]
    },
    "انگشتر-الماس-8-گرم": {
      id: "PD-002",
      name: "انگشتر الماس طلا",
      slug: "انگشتر-الماس-8-گرم",
      category: "ring",
      brand: "گالری بارمن گلد",
      sku: "BGR-002-18K-8G",
      weight_g: 8,
      purity_k: 18,
      making_fee: 1200000,
      images: [
        { url: "/imgs/13f2a810-f9fd-4eea-9a3b-b492be813350.jpeg", alt: "انگشتر الماس طلا", isPrimary: true },
        { url: "/imgs/339798d7-433e-4a74-b6d5-3ba6863478b1.jpeg", alt: "انگشتر روی دست", isPrimary: false }
      ],
      stock: { status: "in_stock", qty: 3 },
      policies: { return_days: 7, warranty: "گارانتی 3 ساله اصالت و عیار" },
      description: "انگشتر زیبا با الماس طبیعی و طلای ۱۸ عیار، مناسب برای مناسبات خاص.",
      rating: { value: 4.8, count: 15 }
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      const slug = params.slug as string;
      const decodedSlug = decodeURIComponent(slug);
      const foundProduct = productsDatabase[decodedSlug];
      if (foundProduct) {
        setProduct(foundProduct);
        const pricing = calculatePrice(foundProduct, livePrice.gold_per_gram_24k);
        setPricingBreakdown(pricing);
      }
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [params.slug]);

  useEffect(() => {
    // Update gold rate periodically - only on client side
    if (!mounted) return;
    
    const interval = setInterval(() => {
      setLivePrice(prev => ({
        ...prev,
        gold_per_gram_24k: prev.gold_per_gram_24k + Math.random() * 10000 - 5000,
        updated_at_iso: new Date().toISOString()
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (product && livePrice) {
      const pricing = calculatePrice(product, livePrice.gold_per_gram_24k);
      setPricingBreakdown(pricing);
    }
  }, [product, livePrice]);

  if (loading) {
    return (
      <div className="luxury-page d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border" style={{ color: 'var(--luxury-gold)' }} role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3" style={{ color: 'var(--luxury-gold)' }}>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="luxury-page d-flex align-items-center justify-content-center">
        <div className="text-center text-white">
          <h1 className="display-4 mb-4">محصول یافت نشد</h1>
          <p className="lead">محصول مورد نظر شما وجود ندارد.</p>
        </div>
      </div>
    );
  }

  const categoryNames: Record<string, string> = {
    necklace: 'گردنبند', ring: 'انگشتر', bracelet: 'دستبند',
    earring: 'گوشواره', set: 'سرویس', coin: 'سکه', bar: 'شمش'
  };

  return (
    <div className="luxury-page" dir="rtl">
      {/* Header */}
      <Header />
      
      {/* Breadcrumb */}
      <div className="luxury-breadcrumb-section py-3">
        <div className="container">
          <nav aria-label="breadcrumb" className="luxury-breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/">
                  <i className="bi bi-house-door me-2"></i>
                  خانه
                </a>
              </li>
              <li className="breadcrumb-item">
                <a href={`/category/${product.category}`}>
                  {categoryNames[product.category]}
                </a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {product.name}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-5" style={{ marginTop: '2rem' }}>
        <div className="row g-5">
          
          {/* Gallery - Left Side */}
          <div className="col-lg-6">
            <div className="sticky-top" style={{ top: '2rem' }}>
              {/* Main Image */}
              <div className="luxury-card p-3 mb-4">
                <div className="luxury-image-container position-relative" style={{ maxHeight: '400px', overflow: 'hidden' }}>
                  <div className="ratio" style={{ aspectRatio: '4/3' }}>
                    <Image
                      src={product.images[selectedImageIndex]?.url || product.images[0]?.url}
                      alt={product.images[selectedImageIndex]?.alt || product.name}
                      fill
                      className="object-fit-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="d-flex gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`luxury-thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                    style={{ width: '80px', height: '80px', cursor: 'pointer', background: 'none', border: 'none', padding: '0' }}
                  >
                    <div className="w-100 h-100 position-relative">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        className="object-fit-cover"
                        sizes="80px"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Summary - Right Side */}
          <div className="col-lg-6">
            <div className="sticky-top" style={{ top: '2rem' }}>
              
              {/* Product Info */}
              <div className="luxury-card p-4 mb-4">
                <h1 className="luxury-product-title mb-4">{product.name}</h1>
                
                {/* Description with Toggle */}
                <div className="mb-4">
                  <p className={`text-white-50 lead mb-3 luxury-description ${showFullDescription ? 'expanded' : 'collapsed'}`}>
                    {product.description}
                  </p>
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="luxury-toggle-btn p-0"
                  >
                    {showFullDescription ? (
                      <>
                        <i className="bi bi-chevron-up me-1"></i>
                        نمایش کمتر
                      </>
                    ) : (
                      <>
                        <i className="bi bi-chevron-down me-1"></i>
                        نمایش بیشتر
                      </>
                    )}
                  </button>
                </div>

                {/* Rating */}
                <div className="d-flex align-items-center mb-4">
                  <div className="d-flex me-3">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`bi ${
                          i < Math.floor(product.rating.value) 
                            ? 'bi-star-fill luxury-rating-star' 
                            : 'bi-star luxury-rating-star empty'
                        }`}
                      ></i>
                    ))}
                  </div>
                  <span className="text-white-50">
                    {product.rating.value} ({product.rating.count} دیدگاه)
                  </span>
                </div>

                {/* Price */}
                {pricingBreakdown && (
                  <div className="mb-4">
                    <div className="luxury-price mb-2">
                      {pricingBreakdown.finalPrice.toLocaleString('fa-IR')} تومان
                    </div>
                    <small className="text-white-50">
                      آخرین بروزرسانی قیمت: {new Date(livePrice.updated_at_iso).toLocaleTimeString('fa-IR')}
                    </small>
                  </div>
                )}

                {/* Product Details */}
                <div className="luxury-detail-grid mb-4">
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="luxury-detail-item">
                        <div className="luxury-detail-label">وزن</div>
                        <div className="luxury-detail-value">{product.weight_g} گرم</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="luxury-detail-item">
                        <div className="luxury-detail-label">عیار</div>
                        <div className="luxury-detail-value">{product.purity_k} عیار</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="luxury-detail-item">
                        <div className="luxury-detail-label">کد محصول</div>
                        <div className="luxury-detail-value">{product.sku}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="luxury-detail-item">
                        <div className="luxury-detail-label">موجودی</div>
                        <div className="luxury-detail-value">
                          {product.stock.status === 'in_stock' ? 'موجود' : 'ناموجود'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-grid gap-3 mb-4">
                  <button className="btn luxury-btn-primary btn-lg">
                    <i className="bi bi-cart-plus me-2"></i>
                    افزودن به سبد خرید
                  </button>
                  
                  <div className="row g-2">
                    <div className="col-6">
                      <button className="btn luxury-btn-outline w-100">
                        <i className="bi bi-heart me-2"></i>
                        علاقه‌مندی
                      </button>
                    </div>
                    <div className="col-6">
                      <button className="btn luxury-btn-outline w-100">
                        <i className="bi bi-share me-2"></i>
                        اشتراک‌گذاری
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="luxury-card p-4">
                <h5 className="text-white mb-4">تضمین‌های ما</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="luxury-trust-badge">
                      <i className="bi bi-shield-check luxury-trust-icon"></i>
                      <div>
                        <h6 className="luxury-trust-title">ضمانت اصالت</h6>
                        <p className="luxury-trust-desc">100% اصل</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="luxury-trust-badge">
                      <i className="bi bi-truck luxury-trust-icon"></i>
                      <div>
                        <h6 className="luxury-trust-title">ارسال بیمه‌شده</h6>
                        <p className="luxury-trust-desc">ارسال امن</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="luxury-trust-badge">
                      <i className="bi bi-arrow-clockwise luxury-trust-icon"></i>
                      <div>
                        <h6 className="luxury-trust-title">بازگشت آسان</h6>
                        <p className="luxury-trust-desc">{product.policies.return_days} روز</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="luxury-trust-badge">
                      <i className="bi bi-gift luxury-trust-icon"></i>
                      <div>
                        <h6 className="luxury-trust-title">بسته‌بندی کادویی</h6>
                        <p className="luxury-trust-desc">رایگان</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Breakdown */}
        {pricingBreakdown && (
          <div className="row mt-5">
            <div className="col-12">
              <div className="luxury-pricing-breakdown">
                <h3 className="text-white mb-4">
                  <i className="bi bi-calculator me-2" style={{ color: 'var(--luxury-gold)' }}></i>
                  جزئیات قیمت‌گذاری
                </h3>
                <div className="row">
                  <div className="col-md-6">
                    <div className="luxury-pricing-row">
                      <span className="luxury-pricing-label">قیمت طلای خام</span>
                      <span className="luxury-pricing-value">{pricingBreakdown.baseGoldPrice.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="luxury-pricing-row">
                      <span className="luxury-pricing-label">اجرت ساخت</span>
                      <span className="luxury-pricing-value">{pricingBreakdown.makingFee.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="luxury-pricing-row">
                      <span className="luxury-pricing-label">حق برند</span>
                      <span className="luxury-pricing-value">{pricingBreakdown.brandPremium.toLocaleString('fa-IR')} تومان</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="luxury-pricing-row">
                      <span className="luxury-pricing-label">بسته‌بندی</span>
                      <span className="luxury-pricing-value">{pricingBreakdown.packagingFee.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="luxury-pricing-row">
                      <span className="luxury-pricing-label">مالیات</span>
                      <span className="luxury-pricing-value">{pricingBreakdown.taxVat.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="luxury-pricing-row luxury-pricing-final">
                      <span className="luxury-pricing-label">قیمت نهایی</span>
                      <span className="luxury-pricing-value">{pricingBreakdown.finalPrice.toLocaleString('fa-IR')} تومان</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Related Products */}
        <div className="row mt-5">
          <div className="col-12">
            <SimilarProductsCarousel />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="luxury-footer py-5 mt-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-3">
              <h3 className="mb-4">بارمن گلد</h3>
              <p className="text-white-50">
                فروشگاه طلا و جواهرات با بیش از ۲۰ سال تجربه در ارائه بهترین محصولات
              </p>
            </div>
            <div className="col-md-3">
              <h4 className="mb-4">دسترسی سریع</h4>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="/">خانه</a></li>
                <li className="mb-2"><a href="/products">محصولات</a></li>
                <li className="mb-2"><a href="/about">درباره ما</a></li>
              </ul>
            </div>
            <div className="col-md-3">
              <h4 className="mb-4">خدمات</h4>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="/support">پشتیبانی</a></li>
                <li className="mb-2"><a href="/warranty">گارانتی</a></li>
                <li className="mb-2"><a href="/shipping">ارسال</a></li>
              </ul>
            </div>
            <div className="col-md-3">
              <h4 className="mb-4">تماس با ما</h4>
              <div className="text-white-50">
                <div className="mb-2">
                  <i className="bi bi-telephone me-2" style={{ color: 'var(--luxury-gold)' }}></i>
                  ۰۲۱-۱۲۳۴۵۶۷۸
                </div>
                <div className="mb-2">
                  <i className="bi bi-envelope me-2" style={{ color: 'var(--luxury-gold)' }}></i>
                  info@barman-gold.ir
                </div>
              </div>
            </div>
          </div>
          <hr className="my-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          <div className="text-center">
            <p className="text-white-50 mb-0">© ۲۰۲۵ بارمن گلد. همه حقوق محفوظ است.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bar */}
      <div className="d-lg-none fixed-bottom luxury-mobile-bar p-3">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="luxury-price" style={{ fontSize: '1.2rem' }}>
              {pricingBreakdown?.finalPrice.toLocaleString('fa-IR')} تومان
            </div>
          </div>
          <button className="btn luxury-btn-primary">
            <i className="bi bi-cart-plus me-2"></i>
            افزودن به سبد
          </button>
        </div>
      </div>
    </div>
  );
}