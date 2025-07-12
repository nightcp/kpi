"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, Building, ClipboardList, FileText, BarChart3, Settings, Home, Menu, X } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useUser } from "@/lib/user-context"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { Badge } from "./ui/badge"

interface SidebarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, isHR } = useUser()

  // 根据用户角色生成角色徽章
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "hr":
        return <Badge variant="destructive">HR</Badge>
      case "manager":
        return <Badge variant="default">主管</Badge>
    }
  }

  // 根据用户角色动态生成导航菜单
  const navigation = useMemo(() => {
    if (isHR) {
      return [
        { name: "仪表板", href: "/", icon: Home },
        { name: "部门管理", href: "/departments", icon: Building },
        { name: "员工管理", href: "/employees", icon: Users },
        { name: "KPI模板", href: "/templates", icon: ClipboardList },
        { name: "考核管理", href: "/evaluations", icon: FileText },
        { name: "统计分析", href: "/statistics", icon: BarChart3 },
        { name: "设置", href: "/settings", icon: Settings },
      ]
    }
    return [{ name: "考核管理", href: "/evaluations", icon: FileText }]
  }, [isHR])

  // 点击导航项时关闭移动端菜单
  const handleNavClick = () => {
    setIsMobileMenuOpen(false)
  }

  // 监听用户角色变化
  useEffect(() => {
    if (!isHR && pathname !== "/evaluations") {
      router.push("/evaluations")
    }
  }, [isHR, router, pathname])

  // 监听屏幕尺寸变化，在桌面端自动关闭移动菜单
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [setIsMobileMenuOpen])

  return (
    <>
      {/* 移动端遮罩层 */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* 侧边栏 */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:transform-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* 头部 - 移动端显示关闭按钮 */}
        <div className="flex items-center justify-between px-6 py-4 lg:justify-start">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-bold text-gray-800">KPI考核系统</h1>
            {currentUser && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <div>
                  {currentUser.name} - {currentUser.department_name}
                </div>
                <div>{getRoleBadge(currentUser.role)}</div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="text-gray-600" />
          </Button>
        </div>

        {/* 导航菜单 */}
        <nav className="mt-2">
          {navigation.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center px-6 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}

// 移动端头部组件
export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="lg:hidden bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-4 py-2">
        <button onClick={onMenuClick} className="p-2 rounded-md hover:bg-gray-100">
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">KPI考核系统</h1>
        <div className="w-10"></div> {/* 占位符，保持标题居中 */}
      </div>
    </div>
  )
}
