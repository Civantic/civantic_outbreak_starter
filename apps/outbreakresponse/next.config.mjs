export default { experimental: { serverActions: { allowedOrigins: ['*'] } } }
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  }
}
export default nextConfig
