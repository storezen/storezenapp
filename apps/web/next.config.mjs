/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/dashboard/orders", destination: "/orders", permanent: true },
      { source: "/dashboard/collections", destination: "/collections", permanent: true },
      { source: "/dashboard/customers", destination: "/customers", permanent: true },
      { source: "/dashboard/products", destination: "/catalog", permanent: true },
      { source: "/dashboard/products/:path+", destination: "/catalog/:path+", permanent: true },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;