/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
  distDir: isDev ? ".next-dev" : ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/dashboard/orders", destination: "/orders", permanent: true },
      { source: "/dashboard/collections", destination: "/collections", permanent: true },
      { source: "/dashboard/customers", destination: "/customers", permanent: true },
      { source: "/dashboard/marketing", destination: "/marketing", permanent: true },
      { source: "/dashboard/content", destination: "/content", permanent: true },
      { source: "/dashboard/settings", destination: "/settings", permanent: true },
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
  /**
   * Dev: forward /api to the Express server so the browser can use same-origin
   * NEXT_PUBLIC_API_URL (e.g. http://localhost:3001/api) and avoid CORS / wrong host.
   * Override with API_PROXY_URL if your API is not on 127.0.0.1:3000.
   */
  async rewrites() {
    if (!isDev) return [];
    const target = process.env.API_PROXY_URL || "http://127.0.0.1:3000";
    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },

  async headers() {
    if (!isDev) return [];

    // Prevent stale dev chunks/CSS from being cached by browser during restarts.
    return [
      {
        source: "/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }],
      },
      {
        source: "/_next/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
