'use client';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MENU } from './menuData';
import MiniCart from './MiniCart';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('products');
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // TODO: Implement search functionality
    }
  };

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle user menu toggle
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const toggleMiniCart = () => {
    setIsMiniCartOpen(!isMiniCartOpen);
  };

  // Derive active menu from current pathname
  const derivedActive = useMemo(() => {
    if (!pathname) return 'products';
    if (pathname === '/' || pathname === '/home') return 'home';
    if (pathname.startsWith('/products') || pathname.startsWith('/product')) return 'products';
    if (pathname.startsWith('/articles') || pathname.startsWith('/article')) return 'articles';
    if (pathname.startsWith('/about')) return 'about';
    if (pathname.startsWith('/contact')) return 'contact';
    return activeMenuItem;
  }, [pathname]);

  useEffect(() => {
    setActiveMenuItem(derivedActive);
  }, [derivedActive]);

  // Handle menu item click (closes mobile menu)
  const handleMenuItemClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle user menu item click
  const handleUserMenuItemClick = (action: string) => {
    console.log('User menu action:', action);
    setIsUserMenuOpen(false);
    // TODO: Implement user menu actions
  };

  return (
    <header className={`header ${isScrolled ? 'header-compact' : 'header-full'}`} >
      {/* Top Navigation */}
      <div className="navbar-top">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between w-100">
            {/* Logo */}
            <a className="brand" href="/">
              <img src="/logo.png" alt="بارمان گلد" />
            </a>

            {/* Search Bar - Desktop Only */}
            <div className="search-container d-none d-lg-block">
              <form onSubmit={handleSearch} className="search-wrap">
                <input
                  type="text"
                  className="search-input"
                  placeholder="جستجو در محصولات طلا و جواهر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="search-btn">
                  <i className="bi bi-search"></i>
                </button>
              </form>
            </div>

            {/* Action Icons */}
            <div className="action-icons">
              {/* Cart */}
              <div className="cart-popover-anchor">
              <button className="action-icon" aria-label="سبد خرید" onClick={toggleMiniCart}>
                <i className="bi bi-cart3"></i>
                <span className="badge-notification">3</span>
              </button>
              {/* Mini Cart Inline */}
              <MiniCart
                isOpen={isMiniCartOpen}
                onClose={() => setIsMiniCartOpen(false)}
                onGoToCart={() => (window.location.href = '/cart')}
                variant="inline"
              />
              </div>

              {/* Notifications */}
              <a className="action-icon" href="#" aria-label="اعلان‌ها">
                <i className="bi bi-bell"></i>
                <span className="badge-notification">2</span>
              </a>

              {/* User Profile */}
              <div className="user-profile-container">
                <button 
                  className="action-icon user-profile-btn" 
                  onClick={toggleUserMenu}
                  aria-label="پروفایل کاربر"
                >
                  <i className="bi bi-person"></i>
                </button>
                
                {/* User Menu Dropdown */}
                {isUserMenuOpen && (
                  <div className="user-menu-dropdown">
                    <div className="user-menu-content">
                      <div className="user-menu-header">
                        <h6>منوی کاربر</h6>
                      </div>
                      <ul className="user-menu-list">
                        <li>
                          <button 
                            className="user-menu-item"
                            onClick={() => handleUserMenuItemClick('profile')}
                          >
                            <i className="bi bi-person-circle"></i>
                            <span>پروفایل</span>
                          </button>
                        </li>
                        <li>
                          <button 
                            className="user-menu-item"
                            onClick={() => handleUserMenuItemClick('orders')}
                          >
                            <i className="bi bi-bag-check"></i>
                            <span>سفارشات</span>
                          </button>
                        </li>
                        <li>
                          <button 
                            className="user-menu-item"
                            onClick={() => handleUserMenuItemClick('addresses')}
                          >
                            <i className="bi bi-geo-alt"></i>
                            <span>آدرس‌ها</span>
                          </button>
                        </li>
                        <li>
                          <button 
                            className="user-menu-item logout"
                            onClick={() => handleUserMenuItemClick('logout')}
                          >
                            <i className="bi bi-box-arrow-right"></i>
                            <span>خروج از حساب</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                className="mobile-menu-btn d-lg-none"
                onClick={toggleMobileMenu}
                aria-label="منوی موبایل"
              >
                <i className="bi bi-list"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Desktop Only */}
      <div className={`navbar-bottom d-none d-lg-block ${isScrolled ? 'hidden' : 'visible'}`}>
        <div className="container">
          <ul className="nav-menu">
            {MENU.map((item) => (
              <li key={item.id} className="nav-item">
                <Link
                  className={`nav-link ${activeMenuItem === item.id ? 'active' : ''}`}
                  href={item.href === '/home' ? '/' : item.href}
                  onClick={handleMenuItemClick}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mobile Offcanvas Menu */}
      <div className={`offcanvas offcanvas-start ${isMobileMenuOpen ? 'show' : ''}`} tabIndex={-1}>
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">منوی بارمان گلد</h5>
          <button
            type="button"
            className="btn-close"
            onClick={toggleMobileMenu}
            aria-label="بستن منو"
          ></button>
        </div>
        <div className="offcanvas-body">
          {/* Mobile Search */}
          <div className="mobile-search">
            <form onSubmit={handleSearch} className="search-wrap">
              <input
                type="text"
                className="search-input"
                placeholder="جستجو در محصولات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn">
                <i className="bi bi-search"></i>
              </button>
            </form>
          </div>

          {/* Mobile Navigation */}
          <ul className="mobile-nav">
            {MENU.map((item) => (
              <li key={item.id} className="mobile-nav-item">
                <Link
                  className={`mobile-nav-link ${activeMenuItem === item.id ? 'active' : ''}`}
                  href={item.href === '/home' ? '/' : item.href}
                  onClick={handleMenuItemClick}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile Action Icons */}
          <div className="d-flex justify-content-center gap-3 mt-4">
            <a className="action-icon" href="#" aria-label="سبد خرید">
              <i className="bi bi-cart3"></i>
              <span className="badge-notification">3</span>
            </a>
            <a className="action-icon" href="#" aria-label="اعلان‌ها">
              <i className="bi bi-bell"></i>
              <span className="badge-notification">2</span>
            </a>
            <a className="action-icon" href="#" aria-label="پروفایل کاربر">
              <i className="bi bi-person"></i>
            </a>
          </div>
        </div>
      </div>


      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="offcanvas-backdrop show"
          onClick={toggleMobileMenu}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1040,
          }}
        ></div>
      )}

      {/* User Menu Backdrop */}
      {isUserMenuOpen && (
        <div
          className="user-menu-backdrop"
          onClick={toggleUserMenu}
        ></div>
      )}

      
    </header>
  );
}