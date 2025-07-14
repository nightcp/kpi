"use client"

import { DooTaskUserInfo, getUserInfo } from "@dootask/tools"
import { createContext, useContext, useEffect } from "react"
import { useState } from "react"
import { authApi, settingsApi } from "./api"

interface DootaskContextType {
  loading: boolean
  isDootask: boolean
  dooTaskUser: DooTaskUserInfo | null
}

const DootaskContext = createContext<DootaskContextType | undefined>(undefined)

export function DootaskProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
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
          console.warn("DootaskContext error: dooTaskUser is null")
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
        console.error("DootaskContext error:", error)
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
