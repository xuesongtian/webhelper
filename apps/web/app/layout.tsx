import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "建站助手",
  description: "面向新手的自动建站与自动部署中控台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
