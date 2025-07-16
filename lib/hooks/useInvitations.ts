import { useState, useEffect, useCallback } from 'react'
import { invitationApi, type EvaluationInvitation } from '@/lib/api'

export function useInvitations() {
  const [invitations, setInvitations] = useState<EvaluationInvitation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await invitationApi.getMy({ page: 1, pageSize: 100 })
      setInvitations(response.data || [])
    } catch (error) {
      console.error('获取邀请列表失败:', error)
      setError('获取邀请列表失败')
      setInvitations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  const pendingCount = invitations.filter(inv => inv.status === 'pending').length
  const acceptedCount = invitations.filter(inv => inv.status === 'accepted').length
  const completedCount = invitations.filter(inv => inv.status === 'completed').length

  return {
    invitations,
    loading,
    error,
    pendingCount,
    acceptedCount,
    completedCount,
    refresh: fetchInvitations,
  }
} 