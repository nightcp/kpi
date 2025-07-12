"use client"

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Sidebar, MobileHeader } from "@/components/sidebar"
import { AppProvider } from "@/lib/app-context"
import { UserProvider } from "@/lib/user-context"
import { UserSwitcher } from "@/components/user-switcher"
import { useState } from "react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

// 将metadata移到单独的组件中，因为这是客户端组件
const metadata: Metadata = {
  title: "KPI绩效考核系统",
  description: "基于NextJS和React的KPI绩效考核管理系统",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <html lang="zh-CN">
      <head>
        <title>{String(metadata.title)}</title>
        <meta name="description" content={String(metadata.description)} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <AppProvider>
          <UserProvider>
            <div className="min-h-screen flex flex-col lg:flex-row">
              {/* 移动端头部 */}
              <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

              {/* 侧边栏 */}
              <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

              {/* 主内容区域 */}
              <main className="flex-1 p-4 lg:p-6 bg-gray-50 min-w-0">
                <div className="max-w-7xl mx-auto">{children}</div>
              </main>

              {/* 用户切换组件 */}
              <UserSwitcher />
            </div>
          </UserProvider>
        </AppProvider>
      </body>
    </html>
  )
}
