import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "googleapis"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
