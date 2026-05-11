'use client';
import { useState, useEffect } from 'react';

interface SlideData {
  id: number;
  image: string;
  title: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}

interface ImageSliderProps {
  slides: SlideData[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

export default function ImageSlider({
  slides,
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  className = ''
}: ImageSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto play effect
  useEffect(() => {
    if (!autoPlay || isHovered) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, isHovered, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <div 
      className={`image-slider ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slider Container */}
      <div className="slider-container">
        {/* Navigation Arrows */}
        {showArrows && slides.length > 1 && (
          <>
            <button 
              className="slider-arrow slider-arrow-prev"
              onClick={prevSlide}
              aria-label="اسلاید قبلی"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
            
            <button 
              className="slider-arrow slider-arrow-next"
              onClick={nextSlide}
              aria-label="اسلاید بعدی"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          </>
        )}

        {/* Slides */}
        <div className="slider-wrapper">
          <div 
            className="slider-track"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`
            }}
          >
            {slides.map((slide, index) => (
              <div key={slide.id} className="slider-slide">
                <div className="slide-image-container">
                  <img 
                    src={`/imgs/${slide.image}`}
                    alt={slide.title}
                    className="slide-image"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  
                  {/* Overlay */}
                  <div className="slide-overlay"></div>
                  
                  {/* Content */}
                  <div className="slide-content">
                    <div className="slide-text">
                      <h2 className="slide-title">{slide.title}</h2>
                      {slide.subtitle && (
                        <h3 className="slide-subtitle">{slide.subtitle}</h3>
                      )}
                      {slide.description && (
                        <p className="slide-description">{slide.description}</p>
                      )}
                      {slide.buttonText && slide.buttonLink && (
                        <a 
                          href={slide.buttonLink}
                          className="btn btn-primary slide-button"
                        >
                          {slide.buttonText}
                          <i className="bi bi-arrow-left me-2"></i>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Navigation */}
        {showDots && slides.length > 1 && (
          <div className="slider-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`برو به اسلاید ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .image-slider {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .slider-container {
          position: relative;
          border-radius: 1.5rem;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          background: var(--gradient-card);
          border: 1px solid var(--barman-red);
        }

        .slider-wrapper {
          position: relative;
          width: 100%;
          height: 500px;
          overflow: hidden;
        }

        .slider-track {
          display: flex;
          width: ${slides.length * 100}%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .slider-slide {
          width: ${100 / slides.length}%;
          height: 100%;
          position: relative;
        }

        .slide-image-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .slide-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .slider-slide:hover .slide-image {
          transform: scale(1.05);
        }

        .slide-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(3, 15, 15, 0.7) 0%,
            rgba(56, 5, 22, 0.5) 50%,
            rgba(3, 15, 15, 0.8) 100%
          );
          z-index: 1;
        }

        .slide-content {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          padding: 2rem;
        }

        .slide-text {
          text-align: center;
          color: var(--barman-text);
          max-width: 600px;
        }

        .slide-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          background: var(--gradient-text);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          animation: slideInUp 0.8s ease-out;
        }

        .slide-subtitle {
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--barman-gold);
          margin-bottom: 1rem;
          animation: slideInUp 0.8s ease-out 0.2s both;
        }

        .slide-description {
          font-size: 1.1rem;
          line-height: 1.6;
          color: var(--barman-text-light);
          margin-bottom: 2rem;
          animation: slideInUp 0.8s ease-out 0.4s both;
        }

        .slide-button {
          animation: slideInUp 0.8s ease-out 0.6s both;
        }

        .slider-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 50px;
          height: 50px;
          background: rgba(162, 132, 94, 0.9);
          border: none;
          border-radius: 50%;
          color: var(--barman-bg);
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .slider-arrow:hover {
          background: var(--barman-gold);
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 6px 20px rgba(162, 132, 94, 0.4);
        }

        .slider-arrow-prev {
          left: 1rem;
        }

        .slider-arrow-next {
          right: 1rem;
        }

        .slider-dots {
          position: absolute;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.5rem;
          z-index: 10;
        }

        .slider-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .slider-dot:hover {
          background: rgba(255, 255, 255, 0.7);
          transform: scale(1.2);
        }

        .slider-dot.active {
          background: var(--barman-gold);
          transform: scale(1.3);
          box-shadow: 0 0 10px rgba(162, 132, 94, 0.5);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .image-slider {
            padding: 0 0.5rem;
          }

          .slider-container {
            border-radius: 1rem;
          }

          .slider-wrapper {
            height: 400px;
          }

          .slide-content {
            padding: 1.5rem;
          }

          .slide-title {
            font-size: 2rem;
          }

          .slide-subtitle {
            font-size: 1.2rem;
          }

          .slide-description {
            font-size: 1rem;
          }

          .slider-arrow {
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }

          .slider-arrow-prev {
            left: 0.5rem;
          }

          .slider-arrow-next {
            right: 0.5rem;
          }

          .slider-dots {
            bottom: 1rem;
          }
        }

        @media (max-width: 480px) {
          .slider-wrapper {
            height: 350px;
          }

          .slide-content {
            padding: 1rem;
          }

          .slide-title {
            font-size: 1.5rem;
          }

          .slide-subtitle {
            font-size: 1rem;
          }

          .slide-description {
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
          }
        }

        /* Animation Keyframes */
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
