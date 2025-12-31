/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export - data served from Worker/R2, not bundled with app
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
