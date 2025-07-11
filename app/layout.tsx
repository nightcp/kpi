import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KPI绩效考核系统",
  description: "基于NextJS和React的KPI绩效考核管理系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen flex">
          <Sidebar />
          <main className="flex-1 p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
