import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: !isProd,
  },
  typescript: {
    ignoreBuildErrors: !isProd,
  },
  turbopack: { /* keep defaults */ },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/guide/how-to-buy/',
        destination: '/guide/how-to-buy',
        permanent: true,
      },
      {
        source: '/guide/returns',
        destination: '/guide/shipping',
        permanent: true,
      },
      {
        source: '/support/faq/',
        destination: '/support/faq',
        permanent: true,
      },
      {
        source: '/support/contact/',
        destination: '/support/contact',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Local development - Web app
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      // Local development - API (if serving images)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
      },
      // Production CDN - replace with your actual CDN domains
      {
        protocol: 'https',
        hostname: 'mahan-gold.ir',
      },
      // Add specific CDN domains here for better performance
      // Example: { protocol: 'https', hostname: 'cdn.yourdomain.com' },
      // Example: { protocol: 'https', hostname: 'images.yourdomain.com' },
    ],
  },
};

export default nextConfig;

/**
 * DEV:   pnpm --filter @barmangold/web dev   (Turbopack)
 * BUILD: pnpm --filter @barmangold/web build (Webpack)
 */
