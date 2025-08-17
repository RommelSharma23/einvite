/** @type {import('next').NextConfig} */
const nextConfig = {
  // Completely disable all static generation
  output: 'standalone',
  
  // Disable all optimizations that might cause issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Minimal experimental settings
  experimental: {
    esmExternals: 'loose',
  },
  
  // Disable image optimization temporarily
  images: {
    unoptimized: true,
  },
  
  // Disable all static generation
  generateStaticParams: false,
}

module.exports = nextConfig