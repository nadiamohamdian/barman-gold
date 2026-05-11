'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface SlideData {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

const slides: SlideData[] = [
  {
    id: 1,
    image: '/imgs/pexels-elina-sazonova-1927259.jpg',
    title: 'مجموعه طلا و جواهرات لوکس',
    subtitle: 'برترین کیفیت',
    description: 'با بیش از 20 سال تجربه در زمینه طلا و جواهرات، بهترین محصولات را با کیفیت عالی ارائه می‌دهیم',
    buttonText: 'مشاهده محصولات',
    buttonLink: '#products'
  },
  {
    id: 2,
    image: '/imgs/pexels-lumierestudiomx-1454171.jpg',
    title: 'انگشترهای طلای دست‌ساز',
    subtitle: 'طراحی منحصر به فرد',
    description: 'انگشترهای طلای دست‌ساز با طراحی‌های منحصر به فرد و کیفیت بی‌نظیر',
    buttonText: 'خرید آنلاین',
    buttonLink: '#shop'
  },
  {
    id: 3,
    image: '/imgs/pexels-steven-arenas-14151-618701.jpg',
    title: 'گردنبندهای طلای کلاسیک',
    subtitle: 'زیبایی جاودان',
    description: 'گردنبندهای طلای کلاسیک که زیبایی و شکوه را به شما هدیه می‌دهند',
    buttonText: 'مشاهده مجموعه',
    buttonLink: '#necklaces'
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Auto play functionality
  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [isAutoPlay]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlay(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlay(false);
  };

  return (
    <section className="hero-slider">
      <div className="slider-container">
        {/* Main Slide */}
        <div className="slide-wrapper">
          <div className="slide-content">
            <div className="slide-image">
              <Image
                src={slides[currentSlide].image}
                alt={slides[currentSlide].title}
                fill
                className="slide-img"
                priority
              />
              <div className="slide-overlay"></div>
            </div>
            
            <div className="slide-text">
              <div className="slide-subtitle">{slides[currentSlide].subtitle}</div>
              <h1 className="slide-title">{slides[currentSlide].title}</h1>
              <p className="slide-description">{slides[currentSlide].description}</p>
              <button 
                className="slide-button"
                onClick={() => window.location.href = slides[currentSlide].buttonLink}
              >
                {slides[currentSlide].buttonText}
              </button>
            </div>
          </div>
        </div>

        {/* Dots Navigation */}
        <div className="slider-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`برو به اسلاید ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
