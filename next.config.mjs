/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    // serverActions: true, // Enabled by default in Next.js 14
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['tiptap-markdown'],
};

export default nextConfig;
