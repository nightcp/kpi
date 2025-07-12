"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { authApi, type AuthUser } from "@/lib/api"

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    name: string
    email: string
    password: string
    position: string
    department_id: number
  }) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // 初始化时检查用户状态
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authApi.getToken()
        const savedUser = authApi.getUser()
        
        if (token && savedUser) {
          setUser(savedUser)
          // 验证token是否仍然有效
          try {
            const response = await authApi.getCurrentUser()
            setUser(response.data)
            authApi.setAuth(token, response.data)
          } catch {
            // Token无效，清除本地存储
            authApi.logout()
            setUser(null)
          }
        }
      } catch (error) {
        console.error("初始化认证失败:", error)
        authApi.logout()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password })
      authApi.setAuth(response.token, response.user)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const register = async (data: {
    name: string
    email: string
    password: string
    position: string
    department_id: number
  }) => {
    try {
      const response = await authApi.register(data)
      authApi.setAuth(response.token, response.user)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    authApi.logout()
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const response = await authApi.getCurrentUser()
      setUser(response.data)
      const token = authApi.getToken()
      if (token) {
        authApi.setAuth(token, response.data)
      }
    } catch (error) {
      console.error("刷新用户信息失败:", error)
      logout()
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 