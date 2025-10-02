/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs']
  },
  images: {
    domains: ['images.unsplash.com', 'lh3.googleusercontent.com']
  }
}

module.exports = nextConfig