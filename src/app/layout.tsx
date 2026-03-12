import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/workspace/Sidebar";
import AnimatedBackground from "@/components/layout/AnimatedBackground";

export const metadata: Metadata = {
  title: "灵阙智能体平台 | Enterprise",
  description: "灵阙智能体平台 -- 企业级 AI Agent 工作台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <a href="#main-content" className="skip-to-content">跳转到主要内容</a>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-hidden relative">
            <AnimatedBackground />
            <div id="main-content" className="relative z-10 h-full overflow-auto">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
