"use client"

import { DooTaskUserInfo, getUserInfo, interceptBack, isMainElectron as isMainElectronTool, setCapsuleConfig } from "@dootask/tools"
import { createContext, useContext, useEffect } from "react"
import { useState } from "react"
import { authApi, settingsApi } from "./api"

interface DootaskContextType {
  loading: boolean
  error: string | null
  isDootask: boolean
  isMainElectron: boolean
  dooTaskUser: DooTaskUserInfo | null
}

const DootaskContext = createContext<DootaskContextType | undefined>(undefined)

export function DootaskProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDootask, setIsDootask] = useState(false)
  const [isMainElectron, setIsMainElectron] = useState(false)
  const [dooTaskUser, setDooTaskUser] = useState<DooTaskUserInfo | null>(null)
  const [isLargeScreen, setIsLargeScreen] = useState(false)

  useEffect(() => {
    setCapsuleConfig({
      right: isLargeScreen ? 24 : 16
    })
  }, [isLargeScreen])

  useEffect(() => {
    if (typeof window === "undefined") return
    const resizeListener = () => {
      setIsLargeScreen(window.innerWidth > 1024)
    }
    resizeListener()
    window.addEventListener("resize", resizeListener)
    return () => window.removeEventListener("resize", resizeListener)
  }, [])

  useEffect(() => {
    let cleanup: (() => void) | undefined
    interceptBack(() => {
      if (typeof window === "undefined") return false

      try {
        // 查找是否有 data-slot="dialog-close" 的元素
        const dialogClose = document.querySelector("[data-slot='dialog-close']") as HTMLButtonElement
        if (dialogClose) {
          dialogClose.click()
          return true
        }
      } catch {
        // 如果找不到，则返回 false
      }

      return false
    }).then((fn) => {
      cleanup = fn
    })
    return () => {
      cleanup?.()
    }
  }, [])

  useEffect(() => {
    const fetchSystemMode = async () => {
      try {
        const response = await settingsApi.get()
        if (response.data.system_mode !== "integrated") {
          return
        }

        const dooTaskUser = await getUserInfo()
        if (!dooTaskUser) {
          setError("无法获取身份")
          return
        }

        const loginResponse = await authApi.loginByDooTaskToken({
          email: dooTaskUser.email,
          token: dooTaskUser.token,
        })
        authApi.setAuth(loginResponse.token, loginResponse.user)
        authApi.setDooTaskToken(dooTaskUser.token)

        setDooTaskUser(dooTaskUser)
        setIsDootask(true)
      } catch (error) {
        setError(error as string)
      } finally {
        setLoading(false)
      }
    }

    const checkMainElectron = async () => {
      setIsMainElectron(await isMainElectronTool())
    }

    checkMainElectron()
    fetchSystemMode()
  }, [])

  return (
    <DootaskContext.Provider
      value={{
        loading,
        error,
        isDootask,
        isMainElectron,
        dooTaskUser,
      }}
    >
      {children}
    </DootaskContext.Provider>
  )
}

export function useDootaskContext() {
  const context = useContext(DootaskContext)
  if (context === undefined) {
    throw new Error("useDootaskContext must be used within an DootaskProvider")
  }
  return context
}
