"use client"

import { DooTaskUserInfo, getUserInfo } from "@dootask/tools"
import { createContext, useContext, useEffect } from "react"
import { useState } from "react"
import { authApi, settingsApi } from "./api"

interface DootaskContextType {
  loading: boolean
  error: string | null
  isDootask: boolean
  dooTaskUser: DooTaskUserInfo | null
}

const DootaskContext = createContext<DootaskContextType | undefined>(undefined)

export function DootaskProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDootask, setIsDootask] = useState(false)
  const [dooTaskUser, setDooTaskUser] = useState<DooTaskUserInfo | null>(null)

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

        setDooTaskUser(dooTaskUser)
        setIsDootask(true)
      } catch (error) {
        setError(error as string)
      } finally {
        setLoading(false)
      }
    }
    fetchSystemMode()
  }, [])

  return (
    <DootaskContext.Provider
      value={{
        loading,
        error,
        isDootask,
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
