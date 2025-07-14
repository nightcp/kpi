"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Loading from "./loading"
import { useDootaskContext } from "@/lib/dootask-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  redirectTo = "/auth/login",
}: ProtectedRouteProps) {
  const { user, loading, isHR, logout } = useAuth()
  const { loading: dooTaskLoading } = useDootaskContext()
  const router = useRouter()
  const pathname = usePathname()

  // 监听认证状态
  useEffect(() => {
    if (typeof window === "undefined") return

    window.addEventListener("auth_unauthorized", logout)
    return () => {
      window.removeEventListener("auth_unauthorized", logout)
    }
  }, [logout])

  // 监听用户状态
  useEffect(() => {
    if (loading) return

    // 如果需要认证但用户未登录，重定向到登录页
    if (requireAuth && !user) {
      router.push(redirectTo)
      return
    }

    // 如果不需要认证且用户已登录，且当前在认证页面，重定向到首页
    if (!requireAuth && user && pathname.startsWith("/auth")) {
      router.push(isHR ? "/" : "/evaluations")
      return
    }
  }, [user, loading, requireAuth, router, redirectTo, pathname, isHR])

  // 显示加载状态
  if (loading || dooTaskLoading) {
    return <Loading />
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
