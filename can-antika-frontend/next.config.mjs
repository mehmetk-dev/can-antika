import withBundleAnalyzer from '@next/bundle-analyzer'

const analyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    loader: "custom",
    loaderFile: "./lib/cloudinary-image-loader.ts",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  experimental: {
    cssChunking: "strict",
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons", "recharts"],
  },
  turbopack: {},
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
}

export default analyzer(nextConfig);
