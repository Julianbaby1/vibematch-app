/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Express API is served by this same Next.js app via
  // pages/api/[[...path]].js — no proxy rewrite needed.

  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },

  // Required so Next.js doesn't crash when `@supabase/supabase-js`
  // imports Node built-ins that aren't available in the browser bundle.
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
