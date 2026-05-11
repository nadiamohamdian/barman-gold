export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="footer-logo">
              <h3>بارمن گلد</h3>
              <p>فروشگاه طلا با بیش از ۲۰ سال تجربه</p>
            </div>
            <div className="footer-social">
              <a href="#" className="social-link">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="#" className="social-link">
                <i className="bi bi-telegram"></i>
              </a>
              <a href="#" className="social-link">
                <i className="bi bi-whatsapp"></i>
              </a>
            </div>
          </div>

          {/* Links Section */}
          <div className="footer-links">
            <div className="footer-column">
              <h4>دسترسی سریع</h4>
              <ul>
                <li><a href="/">خانه</a></li>
                <li><a href="/products">محصولات</a></li>
                <li><a href="/categories">دسته‌ها</a></li>
                <li><a href="/about">درباره ما</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>خدمات مشتری</h4>
              <ul>
                <li><a href="/support">پشتیبانی</a></li>
                <li><a href="/faq">سؤالات متداول</a></li>
                <li><a href="/terms">قوانین</a></li>
                <li><a href="/contact">تماس با ما</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>اطلاعات</h4>
              <ul>
                <li><a href="/shipping">ارسال و تحویل</a></li>
                <li><a href="/payment">روش‌های پرداخت</a></li>
                <li><a href="/return">بازگشت کالا</a></li>
                <li><a href="/privacy">حریم خصوصی</a></li>
              </ul>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="footer-newsletter">
            <h4>عضویت در خبرنامه</h4>
            <p>از آخرین محصولات و تخفیف‌های ویژه مطلع شوید</p>
            <div className="newsletter-form">
              <input type="email" placeholder="ایمیل خود را وارد کنید" />
              <button type="submit">عضویت</button>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <span>© ۲۰۲۵ بارمن گلد - همه حقوق محفوظ است</span>
          </div>
          <div className="footer-payment">
            <span>پرداخت امن با</span>
            <div className="payment-icons">
              <i className="bi bi-credit-card"></i>
              <i className="bi bi-paypal"></i>
              <i className="bi bi-bank"></i>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
