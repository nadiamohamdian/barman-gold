'use client';

import { useState } from 'react';
import Image from 'next/image';
import Header from '../../components/Header';

export default function AboutPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: "چطور سفارشم رو ثبت کنم؟",
      answer: "برای ثبت سفارش، کافیست محصول مورد نظر خود را انتخاب کرده و به سبد خرید اضافه کنید. سپس مراحل پرداخت را تکمیل کنید."
    },
    {
      question: "آیا می توانم بعد از خرید اقلام همکاری داشته باشم؟",
      answer: "بله، ما برنامه همکاری ویژه‌ای برای مشتریان وفادار داریم. می‌توانید در برنامه نمایندگی یا فروش ما شرکت کنید."
    },
    {
      question: "چطور می توانم از فروشگاه خرید کنم؟",
      answer: "شما می‌توانید به صورت آنلاین از وب‌سایت، تلفنی یا حضوری از فروشگاه ما خرید کنید. همه روش‌ها در دسترس است."
    },
    {
      question: "می توانم نوع وب‌سایت فعلی تان کنم؟",
      answer: "بله، ما خدمات طراحی و توسعه وب‌سایت نیز ارائه می‌دهیم. تیم فنی ما آماده همکاری با شماست."
    },
    {
      question: "چطور می توانم از فروشگاه خرید کنم؟",
      answer: "فرآیند خرید بسیار ساده است. محصول را انتخاب کنید، به سبد خرید اضافه کنید و پرداخت را انجام دهید."
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--barman-bg)' }} dir="rtl">
      <Header />
      
      <div className="about-page-container">
        {/* Hero Section */}
        <section className="about-hero-section">
          <div className="container">
            <div className="row align-items-center min-vh-100">
              <div className="col-12 col-lg-6 order-2 order-lg-1">
                <div className="about-content">
                  <h1 className="about-main-title">درباره ما</h1>
                  
                  <p className="about-description">
                    ویژگی یک برند مهم ویژگی برای پیاده‌روی است که شما این امکان را دارید که پیاده‌روی کنید. ما هدف 
                    <span className="highlight-text"> ۱۰ سال </span>
                    داشته‌ایم کالیت‌ها و محصولات خود را به راحتی به اشتراک بگذارید.
                    <br /><br />
                    هدف ما ایجاد قابلیت است که در آن خلاقیت‌ها بتوانند به آسانی گذاشته شوند و 
                    بتوانند با دیتال‌گذاری خود ارتباط برقرار کنید.
                  </p>

                  <div className="stats-container">
                    <div className="stat-item">
                      <div className="stat-number">۱۵</div>
                      <div className="stat-label">سال سابقه</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">۳</div>
                      <div className="stat-label">میلیون مشتری</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">۳۰۰</div>
                      <div className="stat-label">کلیک ماهیانه</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-12 col-lg-6 order-1 order-lg-2">
                <div className="about-hero-image">
                  <div className="purple-circle"></div>
                  <div className="person-image">
                    <Image
                      src="/imgs/339798d7-433e-4a74-b6d5-3ba6863478b1.jpeg"
                      alt="درباره ما"
                      width={400}
                      height={500}
                      className="img-fluid"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="container">
            <div className="row">
              <div className="col-12 col-lg-6">
                <div className="faq-image-container">
                  <div className="question-mark-container">
                    <div className="question-mark-bg">
                      <div className="question-mark">?</div>
                    </div>
                  </div>
                  
                  <div className="faq-description">
                    <p>
                      در این بخش به پرسش‌های پر تکرارتان پاسخ دادیم تیمی‌ورت و جود هر دغدغه‌ای 
                      شکل می‌گیرد تا پاسخ‌های ما در ارتباط باشیم. 
                      <span className="highlight-link">ارتباط با پشتیبانی</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-12 col-lg-6">
                <div className="faq-content">
                  <h2 className="faq-title">سوالات متداول</h2>
                  
                  <div className="faq-accordion">
                    {faqs.map((faq, index) => (
                      <div key={index} className="faq-item">
                        <button
                          className={`faq-question ${openFAQ === index ? 'active' : ''}`}
                          onClick={() => toggleFAQ(index)}
                        >
                          <span>{faq.question}</span>
                          <i className={`bi ${openFAQ === index ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                        </button>
                        <div className={`faq-answer ${openFAQ === index ? 'open' : ''}`}>
                          <p>{faq.answer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
