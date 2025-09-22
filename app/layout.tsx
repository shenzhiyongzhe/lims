import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "微信支付系统",
  description: "微信支付管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={` antialiased`}>{children}</body>
    </html>
  );
}
