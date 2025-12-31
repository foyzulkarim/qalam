/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to allow dynamic rendering on Cloudflare Pages
  // This prevents hitting the 20k file limit for static exports
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
