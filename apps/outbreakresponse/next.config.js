/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // TEMP: keep this while we finish stabilizing TS build
  typescript: { ignoreBuildErrors: true }
}
module.exports = nextConfig
