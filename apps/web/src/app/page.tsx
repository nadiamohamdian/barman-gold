'use client';

import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import ProductGrid from '../components/ProductGrid';
import CategoryGrid from '../components/CategoryGrid';
import CategoryShop from '../components/CategoryShop';
import SimilarProductsCarousel from '../components/SimilarProductsCarousel';
import ImageSlider from '../components/ImageSlider';
import HeroSlider from '../components/HeroSlider';

export default function Home(){
  const router = useRouter();

  // Sample products data
  const products = [
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
    }
  ];

  const handleProductClick = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      // Encode Persian URL for Next.js routing
      const encodedSlug = encodeURIComponent(product.slug);
      router.push(`/product/${encodedSlug}`);
    }
  };

  const handleViewAllClick = () => {
    router.push('/products');
  };

  return (
    <main className="main-content">
      <Header />

      {/* Hero Slider */}
      <HeroSlider />

      {/* Category Shop */}
      <CategoryShop />
      
      <SimilarProductsCarousel 
        onProductClick={handleProductClick}
        onViewAllClick={handleViewAllClick}
      />

      {/* Featured Products Grid */}
      <ProductGrid 
        products={products}
        onProductClick={handleProductClick}
      />

      {/* Global Footer is injected by RootLayout */}
    </main>
  )
}
