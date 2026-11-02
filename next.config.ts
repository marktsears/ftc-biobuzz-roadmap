import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  redirects() {
    return process.env.NODE_ENV === "production" ? [{ source: "/dev-login", destination: "/", permanent: false }] : [];
  },
};

export default nextConfig;
