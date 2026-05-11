'use client';

import Image from 'next/image';
import Header from '../../components/Header';
import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 800);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--barman-bg)' }} dir="rtl">
      <Header />

      {/* Top spacer to clear header */}
      <div style={{ height: '4.5rem' , marginTop: '4.5rem' }} />

      <div className="container contact-container pb-5">
        {/* Title Breadcrumb row placeholder (optional) */}
        <div className="row g-4 align-items-stretch">
          {/* Send Message Card */}
          <div className="col-12 col-lg-6">
            <div className="contact-card contact-form-card h-100">
              <div className="contact-card-header">
                <div className="contact-card-title">ارسال پیام</div>
              
              </div>

              <form onSubmit={onSubmit} className="contact-form-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label contact-label">نام و نام خانوادگی</label>
                    <input name="name" value={form.name} onChange={onChange} className="form-control contact-input" placeholder="عارفه‌سادات یوسفیان" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label contact-label">شماره تماس</label>
                    <input name="phone" value={form.phone} onChange={onChange} className="form-control contact-input" placeholder="0912 - 061 9190" />
                  </div>
                  <div className="col-12">
                    <label className="form-label contact-label">موضوع</label>
                    <input name="subject" value={form.subject} onChange={onChange} className="form-control contact-input" placeholder="نوعِ پیام" />
                  </div>
                  <div className="col-12">
                    <label className="form-label contact-label">پیام شما</label>
                    <textarea name="message" value={form.message} onChange={onChange} className="form-control contact-textarea" rows={4} placeholder="پیام خود را بنویسید..." />
                  </div>
                </div>
                <div className="d-flex justify-content-start mt-4">
                  <button type="submit" className="btn contact-send-btn" disabled={sending}>
                    {sending ? 'در حال ارسال...' : sent ? 'ارسال شد' : 'ارسال'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Contact Info + Map */}
          <div className="col-12 col-lg-6">
            <div className="contact-card contact-info-card h-100">
              <div className="contact-card-header">
                <div className="contact-card-title">ارتباط با ما</div>
              </div>

              <div className="row g-3 align-items-stretch">
                <div className="col-12 col-md-6">
                  <div className="contact-map ratio ratio-1x1">
                    <iframe
                      title="Google Map - Azadi Square Tehran"
                      src="https://www.google.com/maps?q=%D9%85%DB%8C%D8%AF%D8%A7%D9%86+%D8%A2%D8%B2%D8%A7%D8%AF%DB%8C+%D8%AA%D9%87%D8%B1%D8%A7%D9%86&output=embed"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                  <div className="d-flex justify-content-center mt-2">
                    <a
                      className="btn contact-mini-btn"
                      href="https://www.google.com/maps/search/?api=1&query=%D9%85%DB%8C%D8%AF%D8%A7%D9%86+%D8%A2%D8%B2%D8%A7%D8%AF%DB%8C+%D8%AA%D9%87%D8%B1%D8%A7%D9%86"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      مشاهده در Google Maps
                    </a>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <ul className="list-unstyled contact-info-list">
                    <li>
                      <i className="bi bi-geo-alt  fs-4" style={{color: 'var(--barman-gold)'}} ></i>
                      <div>
                        <div className="info-label">آدرس</div>
                        <div className="info-value">تهران، میدان آزادی - کوچه ۲۶، پلاک ۳۰</div>
                      </div>
                    </li>
                    <li>
                        <i className="bi bi-phone  fs-4" style={{color: 'var(--barman-gold)'}} ></i>
                      <div>
                        <div className="info-label">شماره تماس</div>
                        <div className="info-value">0912 061 9190 - 0991 941 991</div>
                      </div>
                    </li>
                    <li>
                      <i className="bi bi-envelope  fs-4" style={{color: 'var(--barman-gold)'}} ></i>
                      <div>
                        <div className="info-label">ایمیل</div>
                        <div className="info-value">info@goldshop.com</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle testimonials + CTA */}

        {/* Instagram banner */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="contact-instagram-banner">
              <div className="d-flex align-items-center gap-3">
                <div className="insta-icon">
                  <i className="bi bi-instagram"></i>
                </div>
                <div>
                  <div className="insta-title">ما را در اینستاگرام دنبال کنید</div>
                  <div className="insta-sub">Follow us on Instagram</div>
                </div>
              </div>
              <button className="btn contact-insta-btn">اینستاگرام</button>
            </div>
          </div>
        </div>

      
      </div>
    </div>
  );
}
