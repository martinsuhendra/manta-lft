/** @type {import('next').NextConfig} */
const nextConfig = {
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
