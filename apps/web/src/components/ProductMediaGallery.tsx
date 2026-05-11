'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Play, ZoomIn, X } from 'lucide-react';

interface MediaItem {
  src: string;
  alt: string;
  type?: 'image' | 'video';
}

interface ProductMediaGalleryProps {
  images: MediaItem[];
  productName: string;
}

export default function ProductMediaGallery({ images, productName }: ProductMediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const mainImageRef = useRef<HTMLDivElement>(null);

  const activeMedia = images[activeIndex];

  const handleThumbnailClick = (index: number) => {
    setActiveIndex(index);
    setIsZoomed(false);
  };

  const handleMainImageClick = () => {
    setIsLightboxOpen(true);
  };

  const handleZoomToggle = () => {
    setIsZoomed(!isZoomed);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div 
        ref={mainImageRef}
        className="relative aspect-square bg-[var(--barman-surface)] rounded-2xl border border-[var(--barman-border)] overflow-hidden group cursor-pointer"
        onClick={handleMainImageClick}
      >
        {activeMedia ? (
          <>
            <Image
              src={activeMedia.src}
              alt={activeMedia.alt}
              fill
              className={`object-cover transition-transform duration-300 ${
                isZoomed ? 'scale-150' : 'group-hover:scale-105'
              }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
              priority={activeIndex === 0}
            />
            
            {/* Video Overlay */}
            {activeMedia.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <Play className="w-16 h-16 text-white" />
              </div>
            )}

            {/* Zoom Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomToggle();
              }}
              className="absolute top-4 left-4 p-2 bg-black bg-opacity-50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="بزرگنمایی تصویر"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 px-3 py-1 bg-black bg-opacity-50 text-white text-sm rounded-full">
              {activeIndex + 1} / {images.length}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--barman-muted)]">
            تصویر در دسترس نیست
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex space-x-2 space-x-reverse overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => handleThumbnailClick(index)}
            className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
              activeIndex === index
                ? 'border-[var(--barman-gold)] ring-2 ring-[var(--barman-gold)] ring-opacity-50'
                : 'border-[var(--barman-border)] hover:border-[var(--barman-gold)]'
            }`}
            aria-label={`نمایش تصویر ${index + 1}`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="80px"
            />
            {image.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <Play className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 left-4 p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
            aria-label="بستن"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-4xl max-h-full">
            <Image
              src={activeMedia.src}
              alt={activeMedia.alt}
              width={800}
              height={800}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
                aria-label="تصویر بعدی"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute top-1/2 left-4 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
                aria-label="تصویر قبلی"
              >
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
