"use client"

import { createContext, useContext, useState, ReactNode } from "react"

// 用户接口定义
export interface User {
  id: number
  name: string
  email: string
  position: string
  department_id: number
  department_name: string
  role: "employee" | "manager" | "hr"
  manager_id?: number
}

// 测试用户数据
export const TEST_USERS: User[] = [
  {
    id: 1,
    name: "张三",
    email: "zhangsan@company.com",
    position: "技术总监",
    department_id: 1,
    department_name: "技术部",
    role: "manager",
  },
  {
    id: 2,
    name: "李四",
    email: "lisi@company.com",
    position: "高级开发工程师",
    department_id: 1,
    department_name: "技术部",
    role: "employee",
    manager_id: 1,
  },
  {
    id: 3,
    name: "王五",
    email: "wangwu@company.com",
    position: "前端开发工程师",
    department_id: 1,
    department_name: "技术部",
    role: "employee",
    manager_id: 1,
  },
  {
    id: 4,
    name: "赵六",
    email: "zhaoliu@company.com",
    position: "市场总监",
    department_id: 2,
    department_name: "市场部",
    role: "manager",
  },
  {
    id: 5,
    name: "钱七",
    email: "qianqi@company.com",
    position: "市场专员",
    department_id: 2,
    department_name: "市场部",
    role: "employee",
    manager_id: 4,
  },
  {
    id: 6,
    name: "孙八",
    email: "sunba@company.com",
    position: "HR经理",
    department_id: 3,
    department_name: "人事部",
    role: "hr",
  },
  {
    id: 7,
    name: "周九",
    email: "zhoujiu@company.com",
    position: "财务经理",
    department_id: 4,
    department_name: "财务部",
    role: "manager",
  },
]

// 用户上下文接口
interface UserContextType {
  currentUser: User | null
  setCurrentUser: (user: User) => void
  switchUser: (userId: number) => void
  isManager: boolean
  isHR: boolean
  isEmployee: boolean
}

// 创建上下文
const UserContext = createContext<UserContextType | undefined>(undefined)

// 用户上下文提供者
export function UserProvider({ children }: { children: ReactNode }) {
  // 默认用户为HR经理，方便测试
  const [currentUser, setCurrentUser] = useState<User | null>(TEST_USERS[5]) // 孙八 HR经理

  const switchUser = (userId: number) => {
    const user = TEST_USERS.find(u => u.id === userId)
    if (user) {
      setCurrentUser(user)
    }
  }

  const isManager = currentUser?.role === "manager"
  const isHR = currentUser?.role === "hr"
  const isEmployee = currentUser?.role === "employee"

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchUser,
        isManager,
        isHR,
        isEmployee,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

// 使用用户上下文的钩子
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
