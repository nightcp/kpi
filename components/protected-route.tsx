"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = "/auth/login" 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    // 如果需要认证但用户未登录，重定向到登录页
    if (requireAuth && !user) {
      router.push(redirectTo)
      return
    }

    // 如果不需要认证且用户已登录，且当前在认证页面，重定向到首页
    if (!requireAuth && user && pathname.startsWith("/auth")) {
      router.push("/")
      return
    }
  }, [user, loading, requireAuth, router, redirectTo, pathname])

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    )
  }

  // 如果需要认证但用户未登录，不渲染内容
  if (requireAuth && !user) {
    return null
  }

  // 如果不需要认证但用户已登录，且在认证页面，不渲染内容
  if (!requireAuth && user && pathname.startsWith("/auth")) {
    return null
  }

  return <>{children}</>
} 