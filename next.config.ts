import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  allowedDevOrigins: [
    "192.168.1.*", // 允许整个192.168.1.x网段
    "localhost",
    "127.0.0.1",
    "*.local", // 允许所有.local域名
  ],
  // 如果需要静态导出，可以使用以下配置
  // trailingSlash: true,
  // images: {
  //   unoptimized: true
  // }
};

export default nextConfig;
