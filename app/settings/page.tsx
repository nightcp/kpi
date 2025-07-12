"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, RefreshCw, CheckCircle, LogOut, Monitor, Sun, Moon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useAppContext } from "@/lib/app-context"
import { useTheme } from "@/lib/theme-context"
import { settingsApi } from "@/lib/api"
import { toast } from "sonner"

export default function SettingsPage() {
  const { logout } = useAuth()
  const { Confirm } = useAppContext()
  const { theme, setTheme } = useTheme()
  const [allowRegistration, setAllowRegistration] = useState(true)
  const [loading, setLoading] = useState(false)

  // 初始化设置状态
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await settingsApi.get()
        setAllowRegistration(response.data.allow_registration)
      } catch (error) {
        console.error("获取设置失败:", error)
        toast.error("获取设置失败")
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  // 保存设置
  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      const response = await settingsApi.update({
        allow_registration: allowRegistration,
      })
      toast.success(response.message || "设置保存成功！")
    } catch (error) {
      console.error("保存设置失败:", error)
      toast.error("保存设置失败，请重试。")
    } finally {
      setLoading(false)
    }
  }

  // 退出登录
  const handleLogout = async () => {
    const result = await Confirm("退出登录", "确定要退出当前账户吗？")
    if (result) {
      logout()
    }
  }

  // 获取主题图标
  const getThemeIcon = (themeValue: string) => {
    switch (themeValue) {
      case "light":
        return <Sun className="w-4 h-4" />
      case "dark":
        return <Moon className="w-4 h-4" />
      case "system":
        return <Monitor className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">系统设置</h1>
          <p className="text-muted-foreground mt-2">管理系统基本配置</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleLogout} className="text-destructive hover:text-destructive/90">
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            保存设置
          </Button>
        </div>
      </div>

      {/* 外观设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            外观设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="theme" className="text-sm font-medium">
                主题模式
              </Label>
              <p className="text-sm text-muted-foreground mt-1">选择您喜欢的主题模式，也可以跟随系统设置自动切换。</p>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-[180px]">
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    {getThemeIcon(theme)}
                    <span>{theme === "light" ? "浅色" : theme === "dark" ? "深色" : "跟随系统"}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4" />
                    <span>浅色</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center space-x-2">
                    <Moon className="w-4 h-4" />
                    <span>深色</span>
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4" />
                    <span>跟随系统</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-medium mb-2 text-foreground">主题说明</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• 浅色模式：使用亮色背景和深色文字</li>
              <li>• 深色模式：使用深色背景和浅色文字，有助于减少眼部疲劳</li>
              <li>• 跟随系统：自动根据您的设备系统设置切换主题</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 系统设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            系统设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="allow_registration" className="text-sm font-medium">
                允许用户注册
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                开启后，新用户可以自行注册账户；关闭后，只能由管理员创建账户。
              </p>
            </div>
            <Switch id="allow_registration" checked={allowRegistration} onCheckedChange={setAllowRegistration} />
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-medium mb-2 text-foreground">功能说明</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• 开启注册：用户可以通过注册页面创建新账户</li>
              <li>• 关闭注册：注册页面将显示&quot;暂不开放注册&quot;的提示</li>
              <li>• 退出登录：点击右上角的&quot;退出登录&quot;按钮安全退出系统</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
