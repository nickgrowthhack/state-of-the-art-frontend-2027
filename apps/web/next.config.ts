import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: true,
  transpilePackages: ["@workspace/ui"],
};

export default nextConfig;
