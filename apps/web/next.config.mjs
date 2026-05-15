/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  // Compression
  compress: true,
  // Image optimization (Vercel handles this automatically)
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/dashboard/orders", destination: "/orders", permanent: true },
      { source: "/dashboard/collections", destination: "/collections", permanent: true },
      { source: "/dashboard/customers", destination: "/customers", permanent: true },
      { source: "/dashboard/products", destination: "/catalog", permanent: true },
      { source: "/dashboard/products/:path+", destination: "/catalog/:path+", permanent: true },
    ];
  },
  // Note: optimizeCss removed - Vercel handles CSS automatically
};

export default nextConfig;