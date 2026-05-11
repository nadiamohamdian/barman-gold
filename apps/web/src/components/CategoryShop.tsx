'use client';

import { useState } from 'react';

interface Category {
  id: number;
  name: string;
  image: string;
  icon: string;
}

interface CategoryShopProps {
  onCategoryClick?: (categoryId: number) => void;
}

export default function CategoryShop({ onCategoryClick }: CategoryShopProps) {
  const categories: Category[] = [
    {
      id: 1,
      name: 'گردنبند',
      image: '/imgs/0397fc2c-ff19-42e9-86fe-5dd26e171548.jpeg',
      icon: ''
    },
    {
      id: 2,
      name: 'انگشتر',
      image: '/imgs/13f2a810-f9fd-4eea-9a3b-b492be813350.jpeg',
      icon: ''
    },
    {
      id: 3,
      name: 'دستبند',
      image: '/imgs/339798d7-433e-4a74-b6d5-3ba6863478b1.jpeg',
      icon: ''
    },
    {
      id: 4,
      name: 'گوشواره',
      image: '/imgs/3c514297-7ee8-4c9a-a506-084c5cbc6247.jpeg',
      icon: ''
    },
    {
      id: 5,
      name: 'ساعت',
      image: '/imgs/4aeaf3ee-c48b-40f2-b300-9ee3272a4f27.jpeg',
      icon: ''
    },
    {
      id: 6,
      name: 'زنجیر',
      image: '/imgs/b9089b38-721a-4798-b793-a14298fbd8e3.jpeg',
      icon: ''
    },
    {
      id: 7,
      name: 'سکه طلا',
      image: '/imgs/c55d0557-0268-498d-99f7-577844253c5f.jpeg',
      icon: ''
    }
  ];

  const handleCategoryClick = (categoryId: number) => {
    if (onCategoryClick) {
      onCategoryClick(categoryId);
    }
  };

  return (
    <div className="category-shop-container">
      {/* Header */}
      <div className="category-shop-header">
        <h2 className="category-shop-title">خرید بر اساس دسته بندی</h2>
      </div>

      {/* Categories */}
      <div className="category-shop-wrapper position-relative overflow-hidden rounded-4 mx-auto">
        {/* Categories Grid */}
        <div className="category-shop-grid">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="category-shop-item d-flex flex-column align-items-center"
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="category-shop-icon">
                <div className="category-shop-image">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="category-shop-img"
                  />
                </div>
              </div>
              <span className="category-shop-name">{category.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
