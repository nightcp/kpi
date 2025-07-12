"use client"

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { usePathname } from "next/navigation"
import { Sidebar, MobileHeader } from "@/components/sidebar"
import { AppProvider } from "@/lib/app-context"

import { AuthProvider } from "@/lib/auth-context"
import ProtectedRoute from "@/components/protected-route"
import { useState } from "react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

// 将metadata移到单独的组件中，因为这是客户端组件
const metadata: Metadata = {
  title: "KPI绩效考核系统",
  description: "基于NextJS和React的KPI绩效考核管理系统",
}

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith("/auth")

  if (isAuthPage) {
    // 认证页面布局（不需要侧边栏）
    return <ProtectedRoute requireAuth={false}>{children}</ProtectedRoute>
  }

  // 主要应用程序布局（需要认证）
  return (
    <ProtectedRoute requireAuth={true}>
      <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
        {/* 移动端头部 */}
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* 侧边栏 */}
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        {/* 主内容区域 */}
        <main className="flex-1 bg-gray-50 min-w-0 overflow-y-auto lg:h-screen">
          <div className="p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <title>{String(metadata.title)}</title>
        <meta name="description" content={String(metadata.description)} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <AppProvider>
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
          </AuthProvider>
        </AppProvider>
      </body>
    </html>
  )
}
