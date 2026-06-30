import path from "node:path"
import { fileURLToPath } from "node:url"

const projectDirectory = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: projectDirectory,
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui", "recharts", "date-fns"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/public",
        permanent: false,
      },
      {
        source: "/shop",
        destination: "/public",
        permanent: true,
      },
      {
        source: "/shop/:path*",
        destination: "/public/:path*",
        permanent: true,
      },
    ];
  },
}

export default nextConfig
