/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Linting is run as its own CI step via `npm run lint`.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
