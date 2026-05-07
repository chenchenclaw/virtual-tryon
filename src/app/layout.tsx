import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI 虚拟试穿 - 智能穿搭体验',
  description: '上传照片和服装，AI 一键生成试穿效果图',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
