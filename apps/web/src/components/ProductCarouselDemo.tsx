'use client';

import ProductCarousel from './ProductCarousel';

// Sample product data
const sampleProducts = [
  {
    id: 1,
    name: "انگشتر طلای 18 عیار",
    price: "2,500,000",
    originalPrice: "3,000,000",
    discount: 17,
    image: "0397fc2c-ff19-42e9-86fe-5dd26e171548.jpeg",
    weight: "3.5 گرم",
    rating: 4.8,
    reviews: 124,
    isNew: true,
    isFeatured: false
  },
  {
    id: 2,
    name: "گردنبند طلای کلاسیک",
    price: "4,200,000",
    image: "13f2a810-f9fd-4eea-9a3b-b492be813350.jpeg",
    weight: "8.2 گرم",
    rating: 4.9,
    reviews: 89,
    isNew: false,
    isFeatured: true
  },
  {
    id: 3,
    name: "دستبند طلای زنانه",
    price: "1,800,000",
    originalPrice: "2,200,000",
    discount: 18,
    image: "339798d7-433e-4a74-b6d5-3ba6863478b1.jpeg",
    weight: "2.8 گرم",
    rating: 4.7,
    reviews: 156,
    isNew: false,
    isFeatured: false
  },
  {
    id: 4,
    name: "گوشواره طلای لوکس",
    price: "3,500,000",
    image: "4aeaf3ee-c48b-40f2-b300-9ee3272a4f27.jpeg",
    weight: "5.1 گرم",
    rating: 4.9,
    reviews: 203,
    isNew: true,
    isFeatured: true
  },
  {
    id: 5,
    name: "ساعت طلای مردانه",
    price: "6,800,000",
    originalPrice: "8,500,000",
    discount: 20,
    image: "b9089b38-721a-4798-b793-a14298fbd8e3.jpeg",
    weight: "12.3 گرم",
    rating: 4.8,
    reviews: 67,
    isNew: false,
    isFeatured: false
  },
  {
    id: 6,
    name: "زنجیر طلای ضخیم",
    price: "5,200,000",
    image: "c55d0557-0268-498d-99f7-577844253c5f.jpeg",
    weight: "15.7 گرم",
    rating: 4.6,
    reviews: 98,
    isNew: false,
    isFeatured: false
  },
  {
    id: 7,
    name: "انگشتر الماس",
    price: "12,500,000",
    image: "edb6ef26-21fa-4f31-aaa5-7842fe9fa989.jpeg",
    weight: "4.2 گرم",
    rating: 5.0,
    reviews: 45,
    isNew: true,
    isFeatured: true
  },
  {
    id: 8,
    name: "گردنبند مروارید",
    price: "3,800,000",
    originalPrice: "4,500,000",
    discount: 16,
    image: "f753bf84-5b59-4489-8885-2ba8d59c62a0.jpeg",
    weight: "6.8 گرم",
    rating: 4.7,
    reviews: 112,
    isNew: false,
    isFeatured: false
  },
  {
    id: 9,
    name: "دستبند طلای ساده",
    price: "2,100,000",
    image: "ff43e829-7e0c-4d01-81eb-a6c947642e1b.jpeg",
    weight: "3.9 گرم",
    rating: 4.5,
    reviews: 78,
    isNew: false,
    isFeatured: false
  },
  {
    id: 10,
    name: "گوشواره طلای کلاسیک",
    price: "2,800,000",
    image: "Heart Fingerprint Wedding Rings _ Heart….jpeg",
    weight: "4.5 گرم",
    rating: 4.8,
    reviews: 134,
    isNew: true,
    isFeatured: false
  }
];

export default function ProductCarouselDemo() {
  const handleAddToCart = (productId: number) => {
    console.log('Adding to cart:', productId);
    // Add your cart logic here
  };

  const handleViewDetails = (productId: number) => {
    console.log('Viewing details:', productId);
    // Add your view details logic here
  };

  return (
    <div className="glass-carousel-demo">
      <ProductCarousel
        products={sampleProducts}
        title="محصولات ویژه بارمن گلد"
        subtitle="بهترین طلا و جواهرات را با کیفیت عالی و قیمت مناسب از ما بخرید"
        autoPlay={true}
        autoPlayInterval={4000}
        showArrows={true}
        showDots={true}
        onAddToCart={handleAddToCart}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
}
