import type { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/700.css';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';


export const metadata: Metadata = {
  title: {
    default: 'بارمن گلد | فروشگاه طلا و جواهرات',
    template: '%s | بارمن گلد'
  },
  description: 'فروشگاه بارمن گلد - ارائه بهترین طلا و جواهرات با کیفیت عالی و قیمت مناسب. خرید آنلاین طلا، انگشتر، گردنبند و سایر زیورآلات.',
  keywords: ['طلا', 'جواهرات', 'انگشتر', 'گردنبند', 'زیورآلات', 'بارمن گلد', 'فروشگاه طلا'],
  authors: [{ name: 'بارمن گلد' }],
  creator: 'بارمن گلد',
  publisher: 'بارمن گلد',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://barman-gold.ir'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: '/',
    title: 'بارمن گلد | فروشگاه طلا و جواهرات',
    description: 'فروشگاه بارمن گلد - ارائه بهترین طلا و جواهرات با کیفیت عالی و قیمت مناسب.',
    siteName: 'بارمن گلد',
    images: [
      {
        url: '/imgs/21 Inspiring Ways to Capture Your Jewelry Brand….jpeg',
        width: 1200,
        height: 630,
        alt: 'بارمن گلد - فروشگاه طلا و جواهرات',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'بارمن گلد | فروشگاه طلا و جواهرات',
    description: 'فروشگاه بارمن گلد - ارائه بهترین طلا و جواهرات با کیفیت عالی و قیمت مناسب.',
    images: ['/imgs/21 Inspiring Ways to Capture Your Jewelry Brand….jpeg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa-IR" dir="rtl">
      <head>
        <link rel="preload" href="/images/hero-image.jpg" as="image" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" defer></script>
      </head>
      <body className="font-vazirmatn antialiased" suppressHydrationWarning={true}>
        <div className="min-h-screen d-flex flex-column">
          <Header />
          <div className="flex-grow-1">
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
