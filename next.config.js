/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['yiezeelqulecqgdpeuii.supabase.co'],
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['yiezeelqulecqgdpeuii.supabase.co'],
  },
}

module.exports = nextConfig
