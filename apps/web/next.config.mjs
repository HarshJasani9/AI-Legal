/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/shared"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist'],
  }
};

export default nextConfig;
