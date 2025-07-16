"use client"

import { createContext, useState, ReactNode, useContext, useEffect, useMemo } from "react"
import { useAuth } from "./auth-context"
import { evaluationApi, invitationApi } from "./api"
import { debounce } from "lodash"

interface UnreadContextType {
  // 待确认评估数量
  unreadEvaluations: number
  refreshUnreadEvaluations: () => void

  // 待确认邀请数量
  unreadInvitations: number
  refreshUnreadInvitations: () => void
}

const UnreadContext = createContext<UnreadContextType | undefined>(undefined)

export function UnreadProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [unreadEvaluations, setUnreadEvaluations] = useState(0)
  const [unreadInvitations, setUnreadInvitations] = useState(0)

  // 使用useMemo创建防抖函数
  const refreshUnreadEvaluations = useMemo(
    () =>
      debounce(async () => {
        if (userId) {
          const response = await evaluationApi.getPendingCount()
          setUnreadEvaluations(response.count)
        } else {
          setUnreadEvaluations(0)
        }
      }, 500),
    [userId]
  )

  const refreshUnreadInvitations = useMemo(
    () =>
      debounce(async () => {
        if (userId) {
          const response = await invitationApi.getPendingCount()
          setUnreadInvitations(response.count)
        } else {
          setUnreadInvitations(0)
        }
      }, 500),
    [userId]
  )

  useEffect(() => {
    refreshUnreadEvaluations()
    refreshUnreadInvitations()
  }, [refreshUnreadEvaluations, refreshUnreadInvitations])

  return (
    <UnreadContext.Provider
      value={{
        unreadEvaluations,
        refreshUnreadEvaluations,
        unreadInvitations,
        refreshUnreadInvitations,
      }}
    >
      {children}
    </UnreadContext.Provider>
  )
}

export function useUnreadContext() {
  const context = useContext(UnreadContext)
  if (context === undefined) {
    throw new Error("useUnreadContext must be used within a UnreadProvider")
  }
  return context
}
