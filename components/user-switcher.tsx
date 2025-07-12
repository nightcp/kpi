"use client"

import { User, Bell, UserCheck, Shield } from "lucide-react"
import { useUser, TEST_USERS } from "@/lib/user-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function UserSwitcher() {
  const { currentUser, switchUser, isManager, isHR, isEmployee } = useUser()
  const [selectUserOpen, setSelectUserOpen] = useState(false)

  if (!currentUser) return null

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "hr":
        return <Shield className="h-4 w-4" />
      case "manager":
        return <UserCheck className="h-4 w-4" />
      case "employee":
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "hr":
        return <Badge variant="destructive">HR</Badge>
      case "manager":
        return <Badge variant="default">主管</Badge>
      case "employee":
        return <Badge variant="secondary">员工</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const getRolePermissions = () => {
    const permissions = []
    if (isHR) {
      permissions.push("创建考核", "最终审核", "所有数据")
    }
    if (isManager) {
      permissions.push("上级评分", "自己的考核", "下属考核")
    }
    if (isEmployee) {
      permissions.push("自评", "自己的考核", "确认最终得分")
    }
    return permissions
  }

  return (
    <div
      className={cn(
        "fixed top-4 right-0 z-50 transition-all duration-300 opacity-0 hover:opacity-100 translate-x-[99%] hover:translate-x-0",
        selectUserOpen && "opacity-100 translate-x-0"
      )}
    >
      <Card className="w-80 shadow-lg border-2 border-orange-200 bg-orange-50 mr-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4 text-orange-600" />
            <span className="text-orange-600">测试环境 - 身份切换</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 当前用户信息 */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-2">
              {getRoleIcon(currentUser.role)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{currentUser.name}</span>
                  {getRoleBadge(currentUser.role)}
                </div>
                <p className="text-xs text-gray-600">{currentUser.position}</p>
                <p className="text-xs text-gray-500">{currentUser.department_name}</p>
              </div>
            </div>
          </div>

          {/* 权限说明 */}
          <div className="text-xs text-gray-600">
            <div className="font-medium mb-1">当前权限：</div>
            <div className="flex flex-wrap gap-1">
              {getRolePermissions().map(permission => (
                <Badge key={permission} variant="outline" className="text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>

          {/* 用户切换下拉菜单 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">切换测试用户：</label>
            <Select
              onOpenChange={setSelectUserOpen}
              value={currentUser.id.toString()}
              onValueChange={value => switchUser(parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择用户" />
              </SelectTrigger>
              <SelectContent>
                {TEST_USERS.map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-gray-500">({user.position})</span>
                      {getRoleBadge(user.role)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 快捷切换按钮 */}
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => switchUser(6)} className="flex-1 text-xs">
              HR
            </Button>
            <Button size="sm" variant="outline" onClick={() => switchUser(1)} className="flex-1 text-xs">
              主管
            </Button>
            <Button size="sm" variant="outline" onClick={() => switchUser(2)} className="flex-1 text-xs">
              员工
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
