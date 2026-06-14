import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow @react-pdf/renderer to be used in server components.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
