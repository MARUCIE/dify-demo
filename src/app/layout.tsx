import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "路桥报销审核智能体",
  description: "基于 Dify 工作流的路桥报销审核智能体演示系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-theme="dark">
      <body className="antialiased">
        <a href="#main-content" className="skip-to-content">跳转到主要内容</a>
        {children}
      </body>
    </html>
  );
}
