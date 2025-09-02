"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Eye,
  Award,
  CheckCircle,
  Clock,
  Star,
  Edit2,
  Save,
  MessageCircle,
  Lock,
  Globe,
  Trash2,
  RefreshCcw,
  Loader2,
  XCircle,
} from "lucide-react"
import {
  evaluationApi,
  scoreApi,
  templateApi,
  commentApi,
  invitationApi,
  type KPIEvaluation,
  type KPIScore,
  type KPITemplate,
  type EvaluationComment,
  type EvaluationInvitation,
  type InvitedScore,
  type PaginatedResponse,
  type EvaluationPaginationParams,
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useAppContext } from "@/lib/app-context"
import { useUnreadContext } from "@/lib/unread-context"
import { useNotification } from "@/lib/notification-context"
import { generateInputPlaceholder, getPeriodValue, isUnknown, scoreInputValidation, formatScore } from "@/lib/utils"
import { EmployeeCombobox, EmployeeSelector } from "@/components/employee-selector"
import { Pagination, usePagination } from "@/components/pagination"
import { LoadingInline } from "@/components/loading"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AxiosError } from "axios"

export default function EvaluationsPage() {
  const { Alert, Confirm, getStatusBadge, isTouch } = useAppContext()
  const { refreshUnreadEvaluations } = useUnreadContext()
  const { user: currentUser, isManager, isHR } = useAuth()
  const { onMessage } = useNotification()
  const detailsRef = useRef<HTMLDivElement>(null)
  const [evaluations, setEvaluations] = useState<KPIEvaluation[]>([])
  const [templates, setTemplates] = useState<KPITemplate[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false)
  const [selectedEvaluation, setSelectedEvaluation] = useState<KPIEvaluation | null>(null)
  const [scores, setScores] = useState<KPIScore[]>([])
  const [activeTab, setActiveTab] = useState("details")

  const [isSubmittingSelfEvaluation, setIsSubmittingSelfEvaluation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 分页相关状态
  const [paginationData, setPaginationData] = useState<PaginatedResponse<KPIEvaluation> | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [employeeFilter, setEmployeeFilter] = useState<string>("all")

  // 添加绩效视图Tab相关状态
  const [viewTab, setViewTab] = useState<"my" | "team">("my") // 默认显示我的绩效

  // 使用分页Hook
  const { currentPage, pageSize, setCurrentPage, handlePageSizeChange, resetPagination } = usePagination(10)

  // 绩效评论相关状态
  const [comments, setComments] = useState<EvaluationComment[]>([]) // 评论列表
  const [commentsPaginationData, setCommentsPaginationData] = useState<PaginatedResponse<EvaluationComment> | null>(
    null
  )
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false) // 是否正在加载评论

  // 评论分页Hook
  const {
    currentPage: commentsCurrentPage,
    pageSize: commentsPageSize,
    setCurrentPage: setCommentsCurrentPage,
    handlePageSizeChange: handleCommentsPageSizeChange,
  } = usePagination(5) // 评论每页5条
  const [newComment, setNewComment] = useState<string>("") // 新评论内容
  const [newCommentPrivate, setNewCommentPrivate] = useState<boolean>(false) // 新评论是否私有
  const [isAddingComment, setIsAddingComment] = useState<boolean>(false) // 是否正在添加评论
  const [isSavingComment, setIsSavingComment] = useState<boolean>(false) // 是否正在保存评论
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null) // 正在编辑的评论ID
  const [editingCommentContent, setEditingCommentContent] = useState<string>("") // 编辑中的评论内容
  const [editingCommentPrivate, setEditingCommentPrivate] = useState<boolean>(false) // 编辑中的评论是否私有

  // Popover 状态控制
  const [openPopovers, setOpenPopovers] = useState<{ [key: string]: boolean }>({}) // 控制每个Popover的开关状态

  // 邀请评分相关状态
  const [invitations, setInvitations] = useState<EvaluationInvitation[]>([]) // 邀请列表
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false) // 邀请对话框开关
  const [invitationScores, setInvitationScores] = useState<{ [key: number]: InvitedScore[] }>({}) // 邀请评分结果
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false) // 是否正在创建邀请
  const [invitationForm, setInvitationForm] = useState({
    invitee_ids: [] as number[],
    message: "",
  }) // 邀请表单
  const [formData, setFormData] = useState({
    employee_ids: [] as string[],
    template_id: "",
    period: "monthly",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    quarter: Math.floor(new Date().getMonth() / 3) + 1,
  })

  // 获取评估列表
  const fetchEvaluations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params: EvaluationPaginationParams = {
        page: currentPage,
        pageSize: pageSize,
      }

      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter
      }

      // 根据Tab和角色设置员工筛选
      if (viewTab === "my") {
        // 我的绩效：只显示自己的
        params.employee_id = currentUser?.id.toString()
      } else if (viewTab === "team") {
        // 团队绩效：根据角色显示
        if (/^department:/.test(employeeFilter)) {
          params.department_id = employeeFilter.replace("department:", "")
        } else if (employeeFilter !== "all") {
          params.employee_id = employeeFilter
        }
        // 如果不是HR
        if (!isHR) {
          if (isManager) {
            // 如果是主管，则显示自己管理的部门绩效
            params.department_id = currentUser?.department_id?.toString() || "-1"
          } else {
            // 如果是员工，则显示自己
            params.employee_id = currentUser?.id.toString()
          }
        }
      }

      const response = await evaluationApi.getAll(params)
      setEvaluations(response.data || [])
      setPaginationData(response)
      refreshUnreadEvaluations()
    } catch (error) {
      console.error("获取评估列表失败:", error)
      setError("获取评估列表失败，请刷新重试")
      setEvaluations([])
      setPaginationData(null)
    } finally {
      setLoading(false)
    }
  }, [currentUser, currentPage, pageSize, statusFilter, employeeFilter, viewTab, isHR, isManager, refreshUnreadEvaluations])

  // 获取模板列表
  const fetchTemplates = async () => {
    try {
      const response = await templateApi.getAll()
      setTemplates(response.data || [])
    } catch (error) {
      console.error("获取模板列表失败:", error)
      setTemplates([])
    }
  }

  // 获取评估详情和分数
  const fetchEvaluationScores = async (evaluationId: number) => {
    try {
      const response = await scoreApi.getByEvaluation(evaluationId)
      setScores(response.data || [])
    } catch (error) {
      console.error("获取评估详情失败:", error)
    }
  }

  // 获取邀请列表
  const fetchInvitations = async (evaluationId: number) => {
    try {
      const response = await invitationApi.getByEvaluation(evaluationId)
      setInvitations(response.data || [])

      // 获取每个邀请的评分结果
      const scoresData: { [key: number]: InvitedScore[] } = {}
      for (const invitation of response.data || []) {
        if (invitation.status === "completed") {
          try {
            const scoresResponse = await invitationApi.getScores(invitation.id)
            scoresData[invitation.id] = scoresResponse.data || []
          } catch (error) {
            console.error(`获取邀请${invitation.id}的评分失败:`, error)
          }
        }
      }
      setInvitationScores(scoresData)
    } catch (error) {
      console.error("获取邀请列表失败:", error)
      setInvitations([])
    }
  }

  // 创建邀请
  const handleCreateInvitation = async () => {
    if (!selectedEvaluation || invitationForm.invitee_ids.length === 0) {
      Alert("创建失败", "请选择要邀请的人员")
      return
    }

    // 检查是否邀请自己
    if (invitationForm.invitee_ids.includes(currentUser?.id || 0)) {
      Alert("创建失败", "不能邀请自己进行评分")
      return
    }

    // 检查是否有重复邀请
    const existingInviteeIds = invitations.map(inv => inv.invitee_id)
    const duplicateIds = invitationForm.invitee_ids.filter(id => existingInviteeIds.includes(id))

    if (duplicateIds.length > 0) {
      Alert("创建失败", "选择的人员中包含已邀请过的人员，请重新选择")
      return
    }

    try {
      setIsCreatingInvitation(true)
      await invitationApi.create(selectedEvaluation.id, invitationForm)

      // 刷新邀请列表
      await fetchInvitations(selectedEvaluation.id)

      // 重置表单
      setInvitationForm({
        invitee_ids: [],
        message: "",
      })
      setInvitationDialogOpen(false)

      toast.success("邀请创建成功")
    } catch (error) {
      console.error("创建邀请失败:", error)
      Alert("创建失败", "创建邀请失败，请重试")
    } finally {
      setIsCreatingInvitation(false)
    }
  }

  // 撤销邀请
  const handleCancelInvitation = async (invitationId: number) => {
    if (!selectedEvaluation) return

    const confirmed = await Confirm("确认撤销", "确定要撤销这个邀请吗？")
    if (!confirmed) return

    try {
      await invitationApi.cancel(invitationId)
      await fetchInvitations(selectedEvaluation.id)
      toast.success("邀请已撤销")
    } catch (error) {
      console.error("撤销邀请失败:", error)
      Alert("撤销失败", "撤销邀请失败，请重试")
    }
  }

  // 重新邀请
  const handleReinvite = async (invitationId: number) => {
    if (!selectedEvaluation) return

    const confirmed = await Confirm("确认重新邀请", "确定要重新邀请这个人吗？")
    if (!confirmed) return

    try {
      await invitationApi.reinvite(invitationId)
      await fetchInvitations(selectedEvaluation.id)
      toast.success("重新邀请成功")
    } catch (error) {
      console.error("重新邀请失败:", error)
      Alert("重新邀请失败", "重新邀请失败，请重试")
    }
  }

  // 删除邀请
  const handleDeleteInvitation = async (invitationId: number) => {
    if (!selectedEvaluation) return

    const confirmed = await Confirm("确认删除", "确定要删除这个邀请吗？此操作无法撤销。")
    if (!confirmed) return

    try {
      await invitationApi.delete(invitationId)
      await fetchInvitations(selectedEvaluation.id)
      toast.success("邀请删除成功")
    } catch (error) {
      console.error("删除邀请失败:", error)
      Alert("删除失败", "删除邀请失败，请重试")
    }
  }

  // 优化后的项目邀请评分函数
  const itemInvitationScores = (itemId: number) => {
    // 返回所有包含该itemId评分的邀请及其对应评分
    return Object.entries(invitationScores)
      .map(([invitationId, scores]) => {
        const invitation = invitations.find(inv => inv.id === Number(invitationId))
        const invitationScore = scores.find(s => s.item_id === itemId)
        if (invitation && invitationScore) {
          return { invitation, invitationScore }
        }
        return null
      })
      .filter(Boolean) as { invitation: EvaluationInvitation, invitationScore: InvitedScore }[]
  }

  // 获取项目平均分
  const itemAverageScore = (score: KPIScore) => {
    const scores = itemInvitationScores(score.item_id)
    const totalScore = (score.manager_score ?? 0) + (score.self_score ?? 0) + scores.reduce((acc, score) => acc + (score.invitationScore.score ?? 0), 0)
    return formatScore(totalScore / (scores.length + 2))
  }

  // 监听实时通知消息
  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      if (message.type === "connected" || message.type === "heartbeat") {
        return
      }

      const messageType = message.type
      const eventData = message.data

      // 只有业务通知消息才有这些属性
      if (messageType.includes("evaluation")) {
        // 刷新评估列表
        fetchEvaluations()
        
        // 如果当前正在查看的评估被更新，刷新详情
        if (selectedEvaluation && 'id' in eventData && eventData.id === selectedEvaluation.id) {
          fetchEvaluationScores(selectedEvaluation.id)
          // 更新选中的评估状态
          if ('payload' in eventData) {
            setSelectedEvaluation(prev => prev ? { ...prev, ...eventData.payload } : null)
          }
        }
      }

      // 处理邀请相关通知
      if (messageType.includes("invitation")) {
        // 如果正在查看评估详情且涉及邀请，刷新邀请数据
        if (selectedEvaluation && 'employee_id' in eventData && eventData.employee_id === selectedEvaluation.employee_id) {
          fetchInvitations(selectedEvaluation.id)
        }
      }

      // 处理评分相关通知
      if (messageType.includes("score")) {
        // 如果正在查看评估详情，刷新评分数据
        if (selectedEvaluation && 'employee_id' in eventData && eventData.employee_id === selectedEvaluation.employee_id) {
          fetchEvaluationScores(selectedEvaluation.id)
        }
      }
    })

    return unsubscribe
  }, [fetchEvaluations, onMessage, selectedEvaluation])

  useEffect(() => {
    fetchEvaluations()
  }, [fetchEvaluations])

  useEffect(() => {
    fetchTemplates()
  }, [])

  // 切换Tab时重置筛选和分页
  const handleTabChange = (tab: "my" | "team") => {
    setViewTab(tab)
    setStatusFilter("all")
    setEmployeeFilter("all")
    resetPagination()
  }

  // 创建新评估
  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证是否至少选择了一个员工
    if (formData.employee_ids.length === 0) {
      Alert("验证失败", "请至少选择一个员工进行考核")
      return
    }

    // 验证是否选择了模板
    if (!formData.template_id) {
      Alert("验证失败", "请选择考核模板")
      return
    }

    try {
      // 为每个选中的员工创建评估
      const promises = formData.employee_ids.map(employeeId =>
        evaluationApi.create({
          employee_id: parseInt(employeeId),
          template_id: parseInt(formData.template_id),
          period: formData.period,
          year: formData.year,
          month: formData.period === "monthly" ? formData.month : undefined,
          quarter: formData.period === "quarterly" ? formData.quarter : undefined,
          status: "pending",
          total_score: 0,
          final_comment: "",
        })
      )

      await Promise.all(promises)

      fetchEvaluations()
      setDialogOpen(false)
      setFormData({
        employee_ids: [],
        template_id: "",
        period: "monthly",
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        quarter: Math.floor(new Date().getMonth() / 3) + 1,
      })

      // 成功提示
      Alert("创建成功", `已为 ${formData.employee_ids.length} 个员工创建考核`)
    } catch (error: unknown) {
      console.error("创建评估失败:", error)
      if (error instanceof AxiosError) {
        Alert("创建失败", error.response?.data?.error || "创建考核失败，请重试")
      } else {
        Alert("创建失败", "创建考核失败，请重试")
      }
    }
  }

  // 验证评分范围
  const validateScore = (score: string, maxScore: number): { isValid: boolean; message?: string } => {
    if (score === "") {
      return { isValid: false, message: "请输入评分" }
    }

    const numScore = parseFloat(score)
    if (isNaN(numScore)) {
      return { isValid: false, message: "请输入有效的数字" }
    }

    if (maxScore < 0) {
      if (numScore > 0) {
        return { isValid: false, message: "评分不能大于0" }
      }
      if (numScore < maxScore) {
        return { isValid: false, message: `评分不能小于${maxScore}` }
      }
    } else if (maxScore > 0) {
      if (numScore < 0) {
        return { isValid: false, message: "评分不能小于0" }
      }
      if (numScore > maxScore) {
        return { isValid: false, message: `评分不能超过${maxScore}分` }
      }
    }

    return { isValid: true }
  }

  // 找到下一个未评分的项目
  const findNextUnscored = (currentScoreId: number, type: "self" | "manager" | "hr"): number | null => {
    const currentIndex = scores.findIndex(s => s.id === currentScoreId)
    if (currentIndex === -1) return null

    // 从当前项目的下一个开始查找
    for (let i = currentIndex + 1; i < scores.length; i++) {
      const score = scores[i]
      if (type === "self" && isUnknown(score.self_score)) {
        return score.id
      }
      if (type === "manager" && isUnknown(score.manager_score)) {
        return score.id
      }
      if (type === "hr" && isUnknown(score.hr_score)) {
        return score.id
      }
    }

    // 如果没找到，从头开始查找
    for (let i = 0; i < currentIndex; i++) {
      const score = scores[i]
      if (type === "self" && isUnknown(score.self_score)) {
        return score.id
      }
      if (type === "manager" && isUnknown(score.manager_score)) {
        return score.id
      }
      if (type === "hr" && isUnknown(score.hr_score)) {
        return score.id
      }
    }

    return null
  }

  // 滚动到指定的评分项目
  const scrollToNextUnscored = (currentScoreId: number, type?: "self" | "manager" | "hr") => {
    const nextUnscored = !type ? currentScoreId : findNextUnscored(currentScoreId, type)
    if (!nextUnscored) {
      return
    }

    // 使用 setTimeout 确保DOM已更新
    setTimeout(() => {
      const element = detailsRef.current?.querySelector(`[data-score-id="${nextUnscored}"]`) as HTMLElement
      if (!element) {
        return
      }
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      })
    }, 100)
  }

  // 从 Popover 保存评分
  const handleSaveScoreFromPopover = async (
    scoreId: number,
    type: "self" | "manager" | "hr",
    scoreValue: string,
    commentValue: string
  ) => {
    try {
      // 获取当前编辑的评分项目
      const currentScore = scores.find(s => s.id === scoreId)
      if (!currentScore) {
        Alert("保存失败", "评分项目不存在")
        return
      }

      const maxScore = currentScore.item?.max_score ?? 0
      const validation = validateScore(scoreValue, maxScore)

      if (!validation.isValid) {
        Alert("输入错误", validation.message || "评分输入无效")
        return
      }

      const numericScore = parseFloat(scoreValue)
      if (type === "self") {
        await scoreApi.updateSelf(scoreId, { self_score: numericScore, self_comment: commentValue })
      } else if (type === "manager") {
        await scoreApi.updateManager(scoreId, { manager_score: numericScore, manager_comment: commentValue })
      } else if (type === "hr") {
        await scoreApi.updateHR(scoreId, { hr_score: numericScore, hr_comment: commentValue })
      }

      if (selectedEvaluation) {
        await fetchEvaluationScores(selectedEvaluation.id)
        fetchEvaluations()
      }

      // 关闭 Popover
      const popoverKey = `${scoreId}-${type}`
      setOpenPopovers(prev => ({
        ...prev,
        [popoverKey]: false,
      }))

      // 延迟执行 scrollToNextUnscored，确保 Popover 关闭动画完成
      setTimeout(() => {
        scrollToNextUnscored(scoreId, type)
      }, 100)

      toast.success("评分保存成功")
    } catch (error) {
      console.error("更新评分失败:", error)
      Alert("保存失败", "更新评分失败，请重试")
    }
  }

  // 完成阶段
  const handleCompleteStage = async (evaluationId: number, stage: string) => {
    // 验证状态流转
    if (selectedEvaluation) {
      const validationError = validateStageTransition(selectedEvaluation, stage)
      if (validationError) {
        Alert("验证失败", validationError)
        return
      }
    }

    // 自评阶段的特殊处理
    if (stage === "self") {
      // 检查是否所有项目都已自评
      const uncompletedItems = scores.filter(score => isUnknown(score.self_score))
      if (uncompletedItems.length > 0) {
        await Alert("自评", `请先完成所有项目的自评。还有 ${uncompletedItems.length} 个项目未评分。`)
        scrollToNextUnscored(uncompletedItems[0].id)
        return
      }

      // 确认提交自评
      const result = await Confirm("自评", "确定要提交自评吗？提交后将无法修改。")
      if (!result) {
        return
      }

      setIsSubmittingSelfEvaluation(true)
    }

    // 上级评分阶段的特殊处理
    if (stage === "manager") {
      // 检查是否所有项目都已进行主管评分
      const uncompletedItems = scores.filter(score => isUnknown(score.manager_score))
      if (uncompletedItems.length > 0) {
        await Alert("主管评分", `请先完成所有项目的主管评分。还有 ${uncompletedItems.length} 个项目未评分。`)
        scrollToNextUnscored(uncompletedItems[0].id)
        return
      }

      // 确认提交主管评分
      const result = await Confirm("主管评分", "确定要提交主管评分吗？提交后将无法修改，评估将进入HR审核阶段。")
      if (!result) {
        return
      }
    }

    // HR审核阶段的特殊处理
    if (stage === "hr") {
      // 检查是否所有项目都已确定最终得分
      const unconfirmedItems = scores.filter(score => isUnknown(score.hr_score))
      if (unconfirmedItems.length > 0) {
        await Alert("HR审核", `请先确认所有项目的最终得分。还有 ${unconfirmedItems.length} 个项目待确认。`)
        scrollToNextUnscored(unconfirmedItems[0].id)
        return
      }

      // 确认完成HR审核
      const result = await Confirm("HR审核", "确定要完成HR审核吗？提交后将无法再修改，评估将进入员工确认阶段。")
      if (!result) {
        return
      }
    }

    // 员工最后确认最终得分
    if (stage === "confirm") {
      // 检查是否所有项目都已确认最终得分
      const alreadyConfirmed = scores.find(score => !isUnknown(score.final_score))
      if (alreadyConfirmed) {
        Alert("确认最终得分", "已确认最终得分，无法再修改。")
        return
      }

      // 确认最终得分
      const result = await Confirm("确认最终得分", "确定要确认最终得分吗？确认后将无法再修改。")
      if (!result) {
        return
      }
    }

    try {
      let newStatus = ""
      switch (stage) {
        case "self":
          newStatus = "self_evaluated"
          break
        case "manager":
          newStatus = "manager_evaluated"
          break
        case "hr":
          newStatus = "pending_confirm"
          break
        case "confirm":
          newStatus = "completed"
          break
      }

      // 计算并更新总分
      let totalScore = 0
      switch (stage) {
        case "self":
          // 自评完成后，总分为自评分数总和
          totalScore = scores.reduce((acc, score) => acc + (score.self_score || 0), 0)
          break
        case "manager":
          // 主管评分完成后，总分为主管评分总和
          totalScore = scores.reduce((acc, score) => acc + (score.manager_score || 0), 0)
          break
        case "hr":
        case "confirm":
          // HR审核或员工确认最终得分后，总分为最终得分总和
          totalScore = scores.reduce(
            (acc, score) => acc + (score.final_score || score.hr_score || score.manager_score || 0),
            0
          )
          break
      }

      const response = await evaluationApi.update(evaluationId, {
        status: newStatus,
        total_score: totalScore,
      })

      // 处理后端返回的状态信息（后端可能根据员工是否有主管调整状态）
      const finalStatus = response.data?.status || newStatus
      const finalTotalScore = response.data?.total_score || totalScore

      if (stage === "confirm") {
        // 员工确认最终得分后，更新最终得分
        setScores(scores =>
          scores.map(s => ({
            ...s,
            final_score: s.hr_score ?? s.manager_score ?? s.self_score,
          }))
        )
      }

      fetchEvaluations()
      if (selectedEvaluation) {
        setSelectedEvaluation({
          ...selectedEvaluation,
          status: finalStatus,
          total_score: finalTotalScore,
        })
        await fetchEvaluationScores(selectedEvaluation.id)
      }

      // 成功提示
      if (stage === "self") {
        // 根据最终状态给出相应提示
        if (finalStatus === "manager_evaluated") {
          await Alert("自评", "自评提交成功！由于您没有直接主管，评估已自动转入HR审核阶段。")
        } else {
          await Alert("自评", "自评提交成功！请等待上级主管评分。")
        }
      } else if (stage === "manager") {
        await Alert("主管评分", "主管评分提交成功！评估已转入HR审核阶段。")
      } else if (stage === "hr") {
        await Alert("HR审核", "HR审核完成！请等待员工确认最终得分。")
      } else if (stage === "confirm") {
        await Alert("确认最终得分", "最终得分确认成功！绩效评估已正式结束。")
      }
    } catch (error) {
      console.error("更新状态失败:", error)
      Alert("提交失败", "提交失败，请重试。")
    } finally {
      if (stage === "self") {
        setIsSubmittingSelfEvaluation(false)
      }
    }
  }

  // 获取评论列表
  const fetchComments = useCallback(
    async (evaluationId: number) => {
      try {
        setIsLoadingComments(true)
        const response = await commentApi.getByEvaluation(evaluationId, {
          page: commentsCurrentPage,
          pageSize: commentsPageSize,
        })
        setComments(response.data || [])
        setCommentsPaginationData(response)
      } catch (error) {
        console.error("获取评论失败:", error)
        setComments([])
        setCommentsPaginationData(null)
      } finally {
        setIsLoadingComments(false)
      }
    },
    [commentsCurrentPage, commentsPageSize]
  )

  // 添加评论
  const handleAddComment = async () => {
    if (!selectedEvaluation || !newComment.trim()) return

    try {
      setIsSavingComment(true)
      const response = await commentApi.create(selectedEvaluation.id, {
        content: newComment,
        is_private: newCommentPrivate,
      })

      setComments([response.data, ...comments])
      setNewComment("")
      setNewCommentPrivate(false)
      setIsAddingComment(false)
      toast.success("添加评论成功")
    } catch (error) {
      console.error("添加评论失败:", error)
      Alert("添加失败", "添加评论失败，请重试")
    } finally {
      setIsSavingComment(false)
    }
  }

  // 开始编辑评论
  const handleStartEditComment = (comment: EvaluationComment) => {
    setEditingCommentId(comment.id)
    setEditingCommentContent(comment.content)
    setEditingCommentPrivate(comment.is_private)
  }

  // 保存编辑的评论
  const handleSaveEditComment = async (commentId: number) => {
    if (!selectedEvaluation || !editingCommentContent.trim()) return

    try {
      setIsSavingComment(true)
      const response = await commentApi.update(selectedEvaluation.id, commentId, {
        content: editingCommentContent,
        is_private: editingCommentPrivate,
      })

      setComments(comments.map(c => (c.id === commentId ? response.data : c)))
      setEditingCommentId(null)
      setEditingCommentContent("")
      setEditingCommentPrivate(false)
      toast.success("更新评论成功")
    } catch (error) {
      console.error("更新评论失败:", error)
      Alert("保存失败", "更新评论失败，请重试")
    } finally {
      setIsSavingComment(false)
    }
  }

  // 取消编辑评论
  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditingCommentContent("")
    setEditingCommentPrivate(false)
  }

  // 删除评论
  const handleDeleteComment = async (commentId: number) => {
    if (!selectedEvaluation) return

    const confirmed = await Confirm("确认删除", "确定要删除这条评论吗？此操作无法撤销。")
    if (!confirmed) return

    try {
      await commentApi.delete(selectedEvaluation.id, commentId)
      setComments(comments.filter(c => c.id !== commentId))
      toast.success("删除评论成功")
    } catch (error) {
      console.error("删除评论失败:", error)
      Alert("删除失败", "删除评论失败，请重试")
    }
  }

  // 查看详情
  const handleViewDetails = useCallback(
    (evaluation: KPIEvaluation) => {
      setSelectedEvaluation(evaluation)
      fetchEvaluationScores(evaluation.id)
      setScoreDialogOpen(true)
      setActiveTab("details")

      // 重置评论状态
      setComments([])
      setCommentsPaginationData(null)
      setNewComment("")
      setNewCommentPrivate(false)
      setIsAddingComment(false)
      setEditingCommentId(null)
      setEditingCommentContent("")
      setEditingCommentPrivate(false)

      // 如果是HR用户且评估状态为manager_evaluated，获取邀请列表
      if (["manager_evaluated", "pending_confirm", "completed"].includes(evaluation.status) && isHR) {
        fetchInvitations(evaluation.id)
      }

      // 重置邀请状态
      setInvitations([])
      setInvitationScores({})
      setInvitationDialogOpen(false)
      setInvitationForm({
        invitee_ids: [],
        message: "",
      })
    },
    [isHR]
  )

  // 删除评估
  const handleDelete = async (evaluationId: number) => {
    const confirmed = await Confirm("确认删除", "确定要删除这条评估吗？此操作无法撤销。")
    if (!confirmed) return
    await evaluationApi.delete(evaluationId)
    fetchEvaluations()
  }

  // 当选中的评估或评论分页参数变化时，重新获取评论
  useEffect(() => {
    if (selectedEvaluation) {
      fetchComments(selectedEvaluation.id)
    }
  }, [selectedEvaluation, fetchComments])

  // 根据用户角色过滤评估（现在分页在后端处理，这里只做基本的权限过滤显示）
  const getFilteredEvaluations = useMemo(() => {
    if (!currentUser) return []
    return evaluations // 后端已经处理了分页和筛选，前端直接使用
  }, [currentUser, evaluations])

  // 根据评估状态获取得分标签
  const getScoreLabel = (evaluationStatus: string) => {
    switch (evaluationStatus) {
      case "completed":
        return "最终得分"
      default:
        return "当前得分"
    }
  }

  // 检查是否可以进行某个操作
  const canPerformAction = (evaluation: KPIEvaluation, action: "self" | "manager" | "hr" | "invite" | "confirm") => {
    if (!currentUser) return false

    switch (action) {
      case "self":
        // 任何人都可以对自己的考核进行自评（包括主管）
        return evaluation.status === "pending" && evaluation.employee_id === currentUser.id
      case "manager":
        // 主管只能评估自己直接下属的员工，但不能评估自己
        return (
          evaluation.status === "self_evaluated" &&
          (isManager || isHR) &&
          evaluation.employee?.manager_id === currentUser.id &&
          evaluation.employee_id !== currentUser.id
        )
      case "hr":
        // HR只能审核主管评估的考核
        return evaluation.status === "manager_evaluated" && isHR
      case "invite":
        // HR可以邀请员工进行考核
        return ["manager_evaluated", "pending_confirm", "completed"].includes(evaluation.status) && isHR
      case "confirm":
        // HR可以确认员工考核
        return evaluation.status === "pending_confirm" && evaluation.employee_id === currentUser.id
      default:
        return false
    }
  }

  // 获取状态流转进度
  const getStatusProgress = (status: string) => {
    const statusMap = {
      pending: { step: 1, total: 5, label: "等待自评" },
      self_evaluated: { step: 2, total: 5, label: "等待主管评估" },
      manager_evaluated: { step: 3, total: 5, label: "等待HR审核" },
      pending_confirm: { step: 4, total: 5, label: "等待确认" },
      completed: { step: 5, total: 5, label: "已完成" },
    }
    return statusMap[status as keyof typeof statusMap] || { step: 0, total: 5, label: "未知状态" }
  }

  // 验证评估是否可以进入下一阶段
  const validateStageTransition = (evaluation: KPIEvaluation, stage: string): string | null => {
    const currentDate = new Date()
    const evaluationDate = new Date(evaluation.created_at)
    const daysDiff = Math.floor((currentDate.getTime() - evaluationDate.getTime()) / (1000 * 3600 * 24))

    // 检查评估是否已过期（示例：30天后过期）
    if (daysDiff > 30) {
      return "评估已过期，无法继续流转。请联系HR处理。"
    }

    // 检查用户权限和状态匹配
    if (!canPerformAction(evaluation, stage as "self" | "manager" | "hr")) {
      return "您没有权限进行此操作，或评估状态不匹配。"
    }

    return null // 验证通过
  }

  return (
    <div className="space-y-6">
      {/* 响应式头部 */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">考核管理</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2">管理员工绩效考核流程</p>
        </div>
        {isHR && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto lg:mt-8">
                <Plus className="w-4 h-4 mr-2" />
                创建考核
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>创建新考核</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEvaluation} className="space-y-4">
                <EmployeeSelector
                  selectedEmployeeIds={formData.employee_ids}
                  onSelectionChange={employeeIds => setFormData(prev => ({ ...prev, employee_ids: employeeIds }))}
                  label="员工"
                  placeholder="选择员工..."
                  maxDisplayTags={5}
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="template">考核模板</Label>
                  <Select
                    value={formData.template_id}
                    onValueChange={value => setFormData({ ...formData, template_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择模板" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="period">考核周期</Label>
                  <Select value={formData.period} onValueChange={value => setFormData({ ...formData, period: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择周期" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">月度</SelectItem>
                      <SelectItem value="quarterly">季度</SelectItem>
                      <SelectItem value="yearly">年度</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="year">年份</Label>
                  <Select
                    value={formData.year.toString()}
                    onValueChange={value => setFormData({ ...formData, year: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择年份" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - i
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}年
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {formData.period === "monthly" && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="month">月份</Label>
                    <Select
                      value={formData.month.toString()}
                      onValueChange={value => setFormData({ ...formData, month: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择月份" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(12)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1}月
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.period === "quarterly" && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="quarter">季度</Label>
                    <Select
                      value={formData.quarter.toString()}
                      onValueChange={value => setFormData({ ...formData, quarter: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择季度" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">第一季度</SelectItem>
                        <SelectItem value="2">第二季度</SelectItem>
                        <SelectItem value="3">第三季度</SelectItem>
                        <SelectItem value="4">第四季度</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    取消
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    创建
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">总评估数</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{getFilteredEvaluations.length}</div>
            <p className="text-xs text-muted-foreground">全部考核项目</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">待处理</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {
                getFilteredEvaluations.filter(e =>
                  ["pending", "self_evaluated", "manager_evaluated", "pending_confirm"].includes(e.status)
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">需要处理的考核</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">已完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {getFilteredEvaluations.filter(e => e.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">已完成的考核</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">平均分</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {getFilteredEvaluations.length > 0
                ? formatScore(
                    getFilteredEvaluations.reduce((acc, e) => acc + e.total_score, 0) / getFilteredEvaluations.length
                  )
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">总体考核平均分</p>
          </CardContent>
        </Card>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 text-sm">⚠️ {error}</div>
        </div>
      )}

      {/* 评估列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              考核列表
              {loading && <LoadingInline />}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-auto">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">等待自评</SelectItem>
                  <SelectItem value="self_evaluated">等待主管评估</SelectItem>
                  <SelectItem value="manager_evaluated">等待HR审核</SelectItem>
                  <SelectItem value="pending_confirm">等待确认</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                </SelectContent>
              </Select>
              {viewTab === "team" && (
                <EmployeeCombobox
                  value={employeeFilter}
                  onValueChange={setEmployeeFilter}
                  placeholder="员工筛选"
                  className="min-w-24 justify-between"
                />
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all")
                  setEmployeeFilter("all")
                  resetPagination()
                }}
              >
                重置筛选
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 绩效视图Tab */}
          {(isManager || isHR) && (
            <div className="mb-6">
              <Tabs value={viewTab} onValueChange={value => handleTabChange(value as "my" | "team")}>
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                  <TabsTrigger value="my" className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    我的绩效
                  </TabsTrigger>
                  <TabsTrigger value="team" className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {isHR ? "全部绩效" : "团队绩效"}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="my" className="mt-4">
                  <div className="text-sm text-muted-foreground mb-4">📊 显示您个人的考核记录和绩效状况</div>
                </TabsContent>
                <TabsContent value="team" className="mt-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    {isHR ? "👥 显示全部员工的考核记录" : "👥 显示您管理团队的考核记录"}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>员工</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>考核模板</TableHead>
                <TableHead>周期</TableHead>
                <TableHead>总分</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredEvaluations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {viewTab === "my" ? "您暂无考核记录" : "暂无考核数据"}
                  </TableCell>
                </TableRow>
              ) : (
                getFilteredEvaluations.map(evaluation => (
                  <TableRow
                    key={evaluation.id}
                    className={evaluation.employee_id === currentUser?.id ? "bg-blue-50/30 dark:bg-blue-950/20" : ""}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {evaluation.employee_id === currentUser?.id && evaluation.status !== "completed" && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                        )}
                        <div>
                          {evaluation.employee?.name}
                          <div className="text-sm text-muted-foreground">{evaluation.employee?.position}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{evaluation.employee?.department?.name}</TableCell>
                    <TableCell>{evaluation.template?.name}</TableCell>
                    <TableCell>{getPeriodValue(evaluation)}</TableCell>
                    <TableCell>
                      <div className="text-lg font-semibold">
                        {formatScore(
                          evaluation.scores?.reduce(
                            (acc, score) =>
                              acc +
                              (score.final_score ?? score.hr_score ?? score.manager_score ?? score.self_score ?? 0), 0
                          )
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(evaluation.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(evaluation)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {isHR && (
                          <Button variant="outline" size="sm" onClick={() => handleDelete(evaluation.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* 分页组件 */}
          {paginationData && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={paginationData.totalPages}
                pageSize={pageSize}
                totalItems={paginationData.total}
                onPageChange={setCurrentPage}
                onPageSizeChange={handlePageSizeChange}
                className="justify-center"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 评分详情对话框 */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>考核详情 - {selectedEvaluation?.employee?.name}</DialogTitle>
          </DialogHeader>
          {selectedEvaluation && (
            <>
              {/* 可滚动的内容区域 */}
              <div className="flex-1 overflow-y-auto space-y-4 -mx-6 px-6 pb-2">
                {/* 基本信息卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-muted/50 p-3 rounded">
                    <Label className="text-sm text-muted-foreground">员工姓名</Label>
                    <p className="text-sm font-medium">{selectedEvaluation.employee?.name}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <Label className="text-sm text-muted-foreground">考核模板</Label>
                    <p className="text-sm font-medium">{selectedEvaluation.template?.name}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <Label className="text-sm text-muted-foreground">考核周期</Label>
                    <p className="text-sm font-medium">{getPeriodValue(selectedEvaluation)}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded flex flex-col gap-2">
                    {/* 当前状态 */}
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">当前状态</Label>
                      <div className="mt-1.5 space-y-2">{getStatusBadge(selectedEvaluation.status)}</div>
                    </div>
                    {/* 状态进度条 */}
                    <div className="flex justify-between items-end">
                      <Label className="text-sm text-muted-foreground">流程进度</Label>
                      <span className="text-xs text-muted-foreground">
                        {getStatusProgress(selectedEvaluation.status).step} /{" "}
                        {getStatusProgress(selectedEvaluation.status).total}
                      </span>
                    </div>
                    {(() => {
                      const percent =
                        (getStatusProgress(selectedEvaluation.status).step /
                          getStatusProgress(selectedEvaluation.status).total) *
                        100
                      let colorClass = "bg-gray-300"
                      if (percent >= 100) {
                        colorClass = "bg-green-600"
                      } else if (percent >= 75) {
                        colorClass = "bg-blue-500"
                      } else if (percent >= 50) {
                        colorClass = "bg-yellow-400"
                      } else if (percent >= 25) {
                        colorClass = "bg-orange-400"
                      } else {
                        colorClass = "bg-red-400"
                      }
                      return (
                        <div className="w-full h-2 rounded-full bg-muted relative overflow-hidden">
                          <div
                            className={`${colorClass} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* 标签页 */}
                <Tabs
                  value={activeTab}
                  onValueChange={value => {
                    setActiveTab(value)
                    if (value === "summary" && comments.length === 0) {
                      fetchComments(selectedEvaluation.id)
                    }
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2 mb-2">
                    <TabsTrigger value="details">评分详情</TabsTrigger>
                    <TabsTrigger value="summary">总结汇总</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4" ref={detailsRef}>
                    {/* 自评指导和进度信息 */}
                    {canPerformAction(selectedEvaluation, "self") && (
                      <div className="space-y-4">
                        <div className="bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📝 自评指导</h4>
                          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• 请根据本期间的实际工作表现进行客观评分</li>
                            <li>• 请在评价说明中详细描述您的工作亮点和改进计划</li>
                            <li>• 完成所有项目评分后，点击&quot;完成自评&quot;提交</li>
                          </ul>
                        </div>

                        {/* 评分进度 */}
                        <div className="bg-green-50/80 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">📊 评分进度</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-800 dark:text-green-200">
                              已完成 {scores.filter(s => !isUnknown(s.self_score)).length} / {scores.length} 项
                            </span>
                            <div className="flex-1 mx-4 bg-green-200 dark:bg-green-800 rounded-full h-2">
                              <div
                                className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${
                                    scores.length > 0
                                      ? (scores.filter(s => !isUnknown(s.self_score)).length / scores.length) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                              {scores.length > 0
                                ? Math.round(
                                    (scores.filter(s => !isUnknown(s.self_score)).length / scores.length) * 100
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 上级评分指导信息 */}
                    {canPerformAction(selectedEvaluation, "manager") && (
                      <div className="space-y-4">
                        <div className="bg-purple-50/80 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                          <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">👔 上级评分指导</h4>
                          <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                            <li>• 请结合员工的自评内容和实际工作表现进行评分</li>
                            <li>• 评分应客观公正，既要认可成绩，也要指出不足</li>
                            <li>• 在评价说明中提供具体的改进建议和发展方向</li>
                            <li>• 完成所有项目评分后，点击&quot;完成主管评估&quot;提交</li>
                          </ul>
                        </div>

                        {/* 评分对比和进度 */}
                        <div className="bg-orange-50/80 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                          <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">📈 评分对比</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-orange-800 dark:text-orange-200">员工自评总分：</span>
                              <span className="font-semibold text-orange-900 dark:text-orange-100">
                                {formatScore(scores.reduce((acc, score) => acc + (score.self_score ?? 0), 0))} 分
                              </span>
                            </div>
                            <div>
                              <span className="text-orange-800 dark:text-orange-200">主管评分进度：</span>
                              <span className="font-semibold text-orange-900 dark:text-orange-100">
                                {scores.filter(s => !isUnknown(s.manager_score)).length} / {scores.length} 项
                              </span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-orange-700 dark:text-orange-300">主管评分完成度</span>
                              <span className="text-xs font-medium text-orange-900 dark:text-orange-100">
                                {scores.length > 0
                                  ? Math.round(
                                      (scores.filter(s => !isUnknown(s.manager_score)).length /
                                        scores.length) *
                                        100
                                    )
                                  : 0}
                                %
                              </span>
                            </div>
                            <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2">
                              <div
                                className="bg-orange-600 dark:bg-orange-400 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${
                                    scores.length > 0
                                      ? (scores.filter(s => !isUnknown(s.manager_score)).length /
                                          scores.length) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* HR审核指导信息 */}
                    {canPerformAction(selectedEvaluation, "hr") && (
                      <div className="space-y-4">
                        <div className="bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                          <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">🔍 HR审核指导</h4>
                          <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-1">
                            <li>• 审核员工自评与上级评分的合理性和一致性</li>
                            <li>• 检查评分是否符合公司绩效标准和政策</li>
                            <li>• 确认最终评分并可进行必要的调整</li>
                            <li>• 注意：如果员工无直属主管，主管评分会自动填入自评分数</li>
                            <li>• 完成审核后，评估将进入员工确认阶段</li>
                          </ul>
                        </div>

                        {/* HR审核总结 */}
                        <div className="bg-muted/50 border rounded-lg p-4">
                          <h4 className="font-medium text-foreground mb-3">📊 评分汇总分析</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-card p-3 rounded border">
                              <div className="text-muted-foreground">员工自评总分</div>
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {scores.reduce((acc, score) => acc + (score.self_score ?? 0), 0)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                平均分：
                                {scores.length > 0
                                  ? formatScore(scores.reduce((acc, score) => acc + (score.self_score ?? 0), 0) / scores.length)
                                  : 0}
                              </div>
                            </div>
                            <div className="bg-card p-3 rounded border">
                              <div className="text-muted-foreground">主管评分总分</div>
                              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {scores.reduce((acc, score) => acc + (score.manager_score ?? 0), 0)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                平均分：
                                {scores.length > 0
                                  ? formatScore(scores.reduce((acc, score) => acc + (score.manager_score ?? 0), 0) / scores.length)
                                  : 0}
                              </div>
                            </div>
                            <div className="bg-card p-3 rounded border">
                              <div className="text-muted-foreground">评分差异分析</div>
                              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {formatScore(
                                  Math.abs(
                                    scores.reduce((acc, score) => acc + (score.self_score ?? 0), 0) -
                                      scores.reduce((acc, score) => acc + (score.manager_score ?? 0), 0)
                                  )
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">自评与主管评分差值</div>
                            </div>
                          </div>

                          {/* 差异分析提示 */}
                          {Math.abs(
                            scores.reduce((acc, score) => acc + (score.self_score ?? 0), 0) -
                              scores.reduce((acc, score) => acc + (score.manager_score ?? 0), 0)
                                  ) > 10 && (
                            <div className="mt-3 p-3 bg-yellow-50/80 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded">
                              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                ⚠️ <strong>注意：</strong>
                                员工自评与主管评分存在较大差异，建议重点关注并在最终评分中做出合理调整。
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 邀请评分功能 */}
                    {canPerformAction(selectedEvaluation, "invite") && (
                      <div className="space-y-4">
                        <div className="bg-purple-50/80 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-purple-900 dark:text-purple-100">🤝 邀请评分</h4>
                            {canPerformAction(selectedEvaluation, "hr") && (
                              <Dialog open={invitationDialogOpen} onOpenChange={setInvitationDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Plus className="w-4 h-4 mr-1" />
                                    邀请评分
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="w-[95vw] sm:max-w-md mx-auto">
                                  <DialogHeader>
                                    <DialogTitle>邀请评分</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    {/* 已邀请人员提示 */}
                                    {invitations.length > 0 && (
                                      <div className="bg-blue-50/50 dark:bg-blue-950/50 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                                          已邀请 {invitations.length} 人：
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {invitations.map(invitation => (
                                            <span
                                              key={invitation.id}
                                              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                                            >
                                              {invitation.invitee?.name}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex flex-col gap-2">
                                      <Label>选择邀请人员</Label>
                                      <EmployeeSelector
                                        selectedEmployeeIds={invitationForm.invitee_ids.map(id => id.toString())}
                                        onSelectionChange={employeeIds =>
                                          setInvitationForm(prev => ({
                                            ...prev,
                                            invitee_ids: employeeIds.map(id => parseInt(id)),
                                          }))
                                        }
                                        label=""
                                        placeholder="选择要邀请的人员..."
                                        maxDisplayTags={3}
                                        disabledEmployeeIds={
                                          [...invitations.map(inv => inv.invitee_id), currentUser?.id].filter(
                                            Boolean
                                          ) as number[]
                                        }
                                      />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Label>邀请消息</Label>
                                      <Textarea
                                        value={invitationForm.message}
                                        onChange={e =>
                                          setInvitationForm(prev => ({ ...prev, message: e.target.value }))
                                        }
                                        placeholder="请输入邀请消息..."
                                        className="min-h-[80px]"
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button variant="outline" onClick={() => setInvitationDialogOpen(false)}>
                                        取消
                                      </Button>
                                      <Button onClick={handleCreateInvitation} disabled={isCreatingInvitation}>
                                        {isCreatingInvitation ? "创建中..." : "发送邀请"}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>

                          {/* 邀请列表 */}
                          {invitations.length > 0 ? (
                            <div className="space-y-2">
                              <div className="text-sm text-purple-800 dark:text-purple-200">
                                已邀请 {invitations.length} 人进行评分
                              </div>
                              {invitations.map(invitation => (
                                <div
                                  key={invitation.id}
                                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div>
                                      <div className="font-medium text-sm">{invitation.invitee?.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {invitation.invitee?.position}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="text-xs">
                                      {invitation.status === "pending" && (
                                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                                          待接受
                                        </span>
                                      )}
                                      {invitation.status === "accepted" && (
                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                          已接受
                                        </span>
                                      )}
                                      {invitation.status === "declined" && (
                                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
                                          已拒绝
                                        </span>
                                      )}
                                      {invitation.status === "cancelled" && (
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-full">
                                          已撤销
                                        </span>
                                      )}
                                      {invitation.status === "completed" && (
                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                                          已完成
                                        </span>
                                      )}
                                    </div>

                                    {/* 操作按钮 */}
                                    <div className="flex items-center space-x-1">
                                      {invitation.status === "pending" && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleCancelInvitation(invitation.id)}
                                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                        >
                                          <XCircle className="w-3 h-3" />
                                        </Button>
                                      )}
                                      {invitation.status === "declined" && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleReinvite(invitation.id)}
                                          className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                                        >
                                          <RefreshCcw className="w-3 h-3" />
                                        </Button>
                                      )}
                                      {/* 删除按钮 - 对所有状态都显示 */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteInvitation(invitation.id)}
                                        className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-purple-800 dark:text-purple-200">
                              暂无邀请评分，点击&quot;邀请评分&quot;按钮来邀请同事为此评估提供意见
                            </div>
                          )}
                        </div>

                        {/* 邀请评分结果展示 */}
                        {Object.keys(invitationScores).length > 0 && (
                          <div className="bg-gray-50/80 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">📊 邀请评分结果</h4>
                            <div className="space-y-4">
                              {Object.entries(invitationScores).map(([invitationId, scores]) => {
                                const invitation = invitations.find(inv => inv.id === parseInt(invitationId))
                                if (!invitation) return null

                                const totalScore = scores.reduce((sum, score) => sum + (score.score || 0), 0)

                                return (
                                  <div key={invitationId} className="border rounded-lg p-3 bg-card">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-medium text-sm">{invitation.invitee?.name} 的评分</div>
                                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                        {formatScore(totalScore)} 分
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-2">
                                      {invitation.invitee?.position} | 完成时间:{" "}
                                      {new Date(invitation.updated_at).toLocaleString()}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                      {scores.map(score => (
                                        <div key={score.id} className="flex items-center justify-between text-sm relative pl-3.5">
                                          <div className="absolute left-0 top-0 text-muted-foreground">• </div>
                                          <div className="text-muted-foreground">
                                            <div>{score.item?.name}</div>
                                            {score.comment && (
                                              <div className="text-muted-foreground text-xs">
                                                说明：{score.comment}
                                              </div>
                                            )}
                                          </div>
                                           <div className="font-medium">
                                             {formatScore(score.score || 0)} / {formatScore(score.item?.max_score || 0)}
                                           </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {scores.map(score => (
                      <Card key={score.id} role="score-item" data-score-id={score.id} className="border">
                        <CardContent className="px-4 py-2">
                          <div className="space-y-4">
                            {/* 项目信息 */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-lg">{score.item?.name}</h4>
                                <pre className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                                  {score.item?.description}
                                </pre>
                                <p className="text-sm text-muted-foreground">满分：{isUnknown(score.item?.max_score) ? "-" : formatScore(score.item?.max_score as number)}</p>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                  {isUnknown(score.final_score ?? score.hr_score ?? score.manager_score ?? score.self_score)
                                    ? "-"
                                    : formatScore((score.final_score ?? score.hr_score ?? score.manager_score ?? score.self_score) as number)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {getScoreLabel(selectedEvaluation.status)}
                                </div>
                              </div>
                            </div>

                            {/* 评分区域 */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              {/* 自评区域 */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center h-6">
                                  自评分数
                                  {canPerformAction(selectedEvaluation, "self") && (
                                    <Popover
                                      open={openPopovers[`${score.id}-self`] || false}
                                      onOpenChange={open => {
                                        const popoverKey = `${score.id}-self`
                                        setOpenPopovers(prev => ({
                                          ...prev,
                                          [popoverKey]: open,
                                        }))
                                      }}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0">
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80" align="start" onOpenAutoFocus={(e) => isTouch ? e.preventDefault() : undefined}>
                                        <div className="grid gap-4">
                                          <div className="space-y-2">
                                            <h4 className="leading-none font-medium">自评编辑</h4>
                                            <p className="text-muted-foreground text-sm">编辑您的自评分数和评价说明</p>
                                          </div>
                                          <div className="grid gap-2">
                                            <div className="grid grid-cols-3 items-center gap-4">
                                              <Label htmlFor="self-score">评分</Label>
                                              <Input
                                                id="self-score"
                                                type="number"
                                                step="0.1"
                                                defaultValue={score.self_score?.toString() || ""}
                                                className="col-span-2 h-8"
                                                placeholder={generateInputPlaceholder(score.item?.max_score ?? 0)}
                                                onInput={e => scoreInputValidation(e, score.item?.max_score ?? 0)}
                                              />
                                            </div>
                                            <div className="grid grid-cols-3 items-start gap-4">
                                              <Label htmlFor="self-comment">评价说明</Label>
                                              <Textarea
                                                id="self-comment"
                                                defaultValue={score.self_comment || ""}
                                                className="col-span-2 min-h-[60px] resize-none"
                                                placeholder="请输入评价说明..."
                                              />
                                            </div>
                                            <div className="flex justify-end space-x-2 pt-2">
                                              <Button
                                                size="sm"
                                                onClick={() => {
                                                  const scoreInput = document.getElementById(
                                                    "self-score"
                                                  ) as HTMLInputElement
                                                  const commentInput = document.getElementById(
                                                    "self-comment"
                                                  ) as HTMLTextAreaElement
                                                  handleSaveScoreFromPopover(
                                                    score.id,
                                                    "self",
                                                    scoreInput.value,
                                                    commentInput.value
                                                  )
                                                }}
                                              >
                                                <Save className="w-3 h-3 mr-1" />
                                                保存
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </Label>

                                <div>
                                  <div className="text-sm font-medium">{isUnknown(score.self_score) ? "未评分" : formatScore(score.self_score as number)}</div>
                                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded mt-1">
                                    {score.self_comment || "暂无说明"}
                                  </div>
                                </div>
                              </div>

                              {/* 主管评分区域 */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center h-6">
                                  主管评分
                                  {canPerformAction(selectedEvaluation, "manager") && (
                                    <Popover
                                      open={openPopovers[`${score.id}-manager`] || false}
                                      onOpenChange={open => {
                                        const popoverKey = `${score.id}-manager`
                                        setOpenPopovers(prev => ({
                                          ...prev,
                                          [popoverKey]: open,
                                        }))
                                      }}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0">
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80" align="start" onOpenAutoFocus={(e) => isTouch ? e.preventDefault() : undefined}>
                                        <div className="grid gap-4">
                                          <div className="space-y-2">
                                            <h4 className="leading-none font-medium">主管评分编辑</h4>
                                            <p className="text-muted-foreground text-sm">编辑主管评分和评价说明</p>
                                          </div>
                                          <div className="grid gap-2">
                                            <div className="grid grid-cols-3 items-center gap-4">
                                              <Label htmlFor="manager-score">评分</Label>
                                              <Input
                                                id="manager-score"
                                                type="number"
                                                step="0.1"
                                                defaultValue={score.manager_score?.toString() || ""}
                                                className="col-span-2 h-8"
                                                placeholder={generateInputPlaceholder(score.item?.max_score ?? 0)}
                                                onInput={e => scoreInputValidation(e, score.item?.max_score ?? 0)}
                                              />
                                            </div>
                                            <div className="grid grid-cols-3 items-start gap-4">
                                              <Label htmlFor="manager-comment">评价说明</Label>
                                              <Textarea
                                                id="manager-comment"
                                                defaultValue={score.manager_comment || ""}
                                                className="col-span-2 min-h-[60px] resize-none"
                                                placeholder="请输入评价说明..."
                                              />
                                            </div>
                                            <div className="grid grid-cols-3 items-center gap-4 text-xs mt-2">
                                              <div>&nbsp;</div>
                                              <div className="col-span-2 text-blue-600">
                                                <div
                                                  onClick={() => {
                                                    const scoreInput = document.getElementById(
                                                      "manager-score"
                                                    ) as HTMLInputElement
                                                    scoreInput.value = score.self_score?.toString() || ""
                                                  }}
                                                  className="cursor-pointer hover:underline truncate"
                                                  title="点击采用员工自评分数"
                                                >
                                                  员工自评：{formatScore(score.self_score || 0)}分
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex justify-end space-x-2 pt-2">
                                              <Button
                                                size="sm"
                                                onClick={() => {
                                                  const scoreInput = document.getElementById(
                                                    "manager-score"
                                                  ) as HTMLInputElement
                                                  const commentInput = document.getElementById(
                                                    "manager-comment"
                                                  ) as HTMLTextAreaElement
                                                  handleSaveScoreFromPopover(
                                                    score.id,
                                                    "manager",
                                                    scoreInput.value,
                                                    commentInput.value
                                                  )
                                                }}
                                              >
                                                <Save className="w-3 h-3 mr-1" />
                                                保存
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </Label>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium">{isUnknown(score.manager_score) ? "未评分" : formatScore(score.manager_score as number)}</div>
                                    {score.manager_auto && (
                                      <Tooltip>
                                        <TooltipTrigger className="text-xs">⚠️</TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-amber-600">⚠️ 主管评分为系统自动填入，该员工无直属主管</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded mt-1">
                                    {score.manager_comment || "暂无说明"}
                                  </div>
                                </div>
                              </div>

                              {/* HR评分区域 */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center h-6">
                                  HR评分
                                  {canPerformAction(selectedEvaluation, "hr") && (
                                    <Popover
                                      open={openPopovers[`${score.id}-hr`] || false}
                                      onOpenChange={open => {
                                        const popoverKey = `${score.id}-hr`
                                        setOpenPopovers(prev => ({
                                          ...prev,
                                          [popoverKey]: open,
                                        }))
                                      }}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0">
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80" align="start" onOpenAutoFocus={(e) => isTouch ? e.preventDefault() : undefined}>
                                        <div className="grid gap-4">
                                          <div className="space-y-2">
                                            <h4 className="leading-none font-medium">HR评分编辑</h4>
                                            <p className="text-muted-foreground text-sm">编辑HR评分和评价说明</p>
                                          </div>
                                          <div className="grid gap-2">
                                            <div className="grid grid-cols-3 items-center gap-4">
                                              <Label htmlFor="hr-score">评分</Label>
                                              <Input
                                                id="hr-score"
                                                type="number"
                                                step="0.1"
                                                defaultValue={score.hr_score?.toString() || ""}
                                                className="col-span-2 h-8"
                                                placeholder={generateInputPlaceholder(score.item?.max_score ?? 0)}
                                                onInput={e => scoreInputValidation(e, score.item?.max_score ?? 0)}
                                              />
                                            </div>
                                            <div className="grid grid-cols-3 items-start gap-4">
                                              <Label htmlFor="hr-comment">评价说明</Label>
                                              <Textarea
                                                id="hr-comment"
                                                defaultValue={score.hr_comment || ""}
                                                className="col-span-2 min-h-[60px] resize-none"
                                                placeholder="请输入评价说明..."
                                              />
                                            </div>
                                            <div className="grid grid-cols-3 items-center gap-4 text-xs mt-2">
                                              <div>&nbsp;</div>
                                              <div className="col-span-2 flex flex-col gap-1.5 text-blue-600">
                                                <div
                                                  onClick={() => {
                                                    const scoreInput = document.getElementById(
                                                      "hr-score"
                                                    ) as HTMLInputElement
                                                    scoreInput.value = score.self_score?.toString() || ""
                                                  }}
                                                  className="cursor-pointer hover:underline truncate"
                                                  title="点击采用员工自评分数"
                                                >
                                                  员工自评：{formatScore(score.self_score || 0)}分
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <div
                                                    onClick={() => {
                                                      const scoreInput = document.getElementById(
                                                        "hr-score"
                                                      ) as HTMLInputElement
                                                      scoreInput.value = score.manager_score?.toString() || ""
                                                    }}
                                                    className="cursor-pointer hover:underline truncate"
                                                    title="点击采用主管评分"
                                                  >
                                                     主管评分：{formatScore(score.manager_score || 0)}分
                                                  </div>
                                                  {score.manager_auto && (
                                                    <Tooltip>
                                                      <TooltipTrigger>⚠️</TooltipTrigger>
                                                      <TooltipContent>
                                                        <p className="text-amber-600">⚠️ 主管评分为系统自动填入，该员工无直属主管</p>
                                                      </TooltipContent>
                                                    </Tooltip>
                                                  )}
                                                </div>
                                                {itemInvitationScores(score.item_id).map(item => {
                                                  return (
                                                    <div 
                                                    key={item.invitation.id}
                                                    onClick={() => {
                                                      const scoreInput = document.getElementById(
                                                        "hr-score"
                                                      ) as HTMLInputElement
                                                      scoreInput.value = item.invitationScore.score?.toString() || ""
                                                    }}
                                                    className="cursor-pointer hover:underline truncate"
                                                    title={`点击采用${item.invitation.invitee?.name}（邀请）的评分`}
                                                    >
                                                      {item.invitation.invitee?.name}（邀请）：{isUnknown(item.invitationScore.score) ? "-" : formatScore(item.invitationScore.score as number)}分
                                                    </div>
                                                  )
                                                })}
                                                <div
                                                  onClick={() => {
                                                    const scoreInput = document.getElementById(
                                                      "hr-score"
                                                    ) as HTMLInputElement
                                                    scoreInput.value = itemAverageScore(score) || ""
                                                  }}
                                                  className="cursor-pointer hover:underline truncate"
                                                  title="点击采用平均分"
                                                >
                                                  平均分：{itemAverageScore(score)}分
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex justify-end space-x-2 pt-2">
                                              <Button
                                                size="sm"
                                                onClick={() => {
                                                  const scoreInput = document.getElementById(
                                                    "hr-score"
                                                  ) as HTMLInputElement
                                                  const commentInput = document.getElementById(
                                                    "hr-comment"
                                                  ) as HTMLTextAreaElement
                                                  handleSaveScoreFromPopover(
                                                    score.id,
                                                    "hr",
                                                    scoreInput.value,
                                                    commentInput.value
                                                  )
                                                }}
                                              >
                                                <Save className="w-3 h-3 mr-1" />
                                                保存
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </Label>

                                <div>
                                  <div className="text-sm font-medium">{isUnknown(score.hr_score) ? "未评分" : formatScore(score.hr_score as number)}</div>
                                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded mt-1">
                                    {score.hr_comment || "暂无说明"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="summary" className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center space-y-4">
                          <div>
                            <h3 className="text-2xl font-bold">总分统计</h3>
                            <div className="text-4xl font-bold text-blue-600 mt-2">
                              {formatScore(
                                scores.reduce(
                                  (acc, score) =>
                                    acc +
                                    (score.final_score ?? score.hr_score ?? score.manager_score ?? score.self_score ?? 0),
                                  0
                                )
                              )}
                            </div>
                            <p className="text-muted-foreground">
                              满分 {formatScore(scores.reduce((acc, score) => acc + (score.item?.max_score || 0), 0))} 分
                            </p>
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-lg font-semibold">
                                {formatScore(scores.reduce((acc, score) => acc + (score.self_score ?? 0), 0))}
                              </div>
                              <div className="text-sm text-muted-foreground">自评总分</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">
                                {formatScore(scores.reduce((acc, score) => acc + (score.manager_score ?? 0), 0))}
                              </div>
                              <div className="text-sm text-muted-foreground">主管评分</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">
                                {formatScore(scores.reduce((acc, score) => acc + (score.hr_score ?? 0), 0))}
                              </div>
                              <div className="text-sm text-muted-foreground">HR评分</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">
                                {formatScore(scores.reduce((acc, score) => acc + (score.final_score ?? 0), 0))}
                              </div>
                              <div className="text-sm text-muted-foreground">最终得分</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 绩效评论卡片 */}
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center">
                            <MessageCircle className="w-5 h-5 mr-2" />
                            绩效评论 ({comments.length})
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-3">
                            {!isAddingComment && (
                              <Button variant="outline" size="sm" onClick={() => setIsAddingComment(true)}>
                                <Plus className="w-4 h-4 mr-1" />
                                添加评论
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isLoadingComments}
                              onClick={() => {
                                fetchComments(selectedEvaluation.id)
                              }}
                            >
                              {isLoadingComments ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <RefreshCcw className="w-4 h-4 mr-1" />
                              )}
                              刷新
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* 添加评论表单 */}
                        {isAddingComment && (
                          <div className="space-y-4 mb-4 p-4 bg-muted/50 rounded-lg">
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="newComment">评论内容</Label>
                              <Textarea
                                id="newComment"
                                placeholder="请输入您的评论..."
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                className="mt-1 min-h-[100px] bg-background"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="newPrivate"
                                checked={newCommentPrivate}
                                onChange={e => setNewCommentPrivate(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <Label htmlFor="newPrivate" className="text-sm">
                                仅自己可见
                              </Label>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsAddingComment(false)
                                  setNewComment("")
                                  setNewCommentPrivate(false)
                                }}
                              >
                                取消
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleAddComment}
                                disabled={isSavingComment || !newComment.trim()}
                              >
                                {isSavingComment ? "保存中..." : "保存评论"}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* 评论列表 */}
                        {comments.length === 0 ? (
                          isLoadingComments ? (
                            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
                              <p className="text-sm">加载评论中...</p>
                            </div>
                          ) : (
                            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
                              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted/50" />
                              <p className="text-sm">暂无评论</p>
                              <p className="text-xs mt-1">点击&quot;添加评论&quot;按钮来记录您的想法</p>
                            </div>
                          )
                        ) : (
                          <div className="space-y-4">
                            {comments.map(comment => (
                              <div key={comment.id} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                      <span className="font-medium text-sm">{comment.user?.name || "未知用户"}</span>
                                      <span className="text-xs text-muted-foreground ml-2">
                                        {comment.user?.position}
                                      </span>
                                      <span className="text-xs text-muted-foreground/70 ml-2">
                                        {new Date(comment.created_at).toLocaleString()}
                                      </span>
                                      <div className="flex items-center ml-2 text-xs text-muted-foreground">
                                        {comment.is_private ? (
                                          <>
                                            <Lock className="w-3 h-3 mr-1" />
                                            仅自己可见
                                          </>
                                        ) : (
                                          <>
                                            <Globe className="w-3 h-3 mr-1" />
                                            公开可见
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {editingCommentId === comment.id ? (
                                      <div className="space-y-3">
                                        <Textarea
                                          value={editingCommentContent}
                                          onChange={e => setEditingCommentContent(e.target.value)}
                                          className="min-h-[80px]"
                                        />
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id={`edit-private-${comment.id}`}
                                            checked={editingCommentPrivate}
                                            onChange={e => setEditingCommentPrivate(e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                          />
                                          <Label htmlFor={`edit-private-${comment.id}`} className="text-sm">
                                            仅自己可见
                                          </Label>
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                          <Button variant="outline" size="sm" onClick={handleCancelEditComment}>
                                            取消
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => handleSaveEditComment(comment.id)}
                                            disabled={isSavingComment}
                                          >
                                            {isSavingComment ? "保存中..." : "保存"}
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                                    )}
                                  </div>

                                  {editingCommentId !== comment.id && comment.user_id === currentUser?.id && (
                                    <div className="flex items-center space-x-1 ml-2">
                                      <Button variant="ghost" size="sm" onClick={() => handleStartEditComment(comment)}>
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleDeleteComment(comment.id)}>
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 评论分页组件 */}
                        {commentsPaginationData && (
                          <div className="mt-4">
                            <Pagination
                              currentPage={commentsCurrentPage}
                              totalPages={commentsPaginationData.totalPages}
                              pageSize={commentsPageSize}
                              totalItems={commentsPaginationData.total}
                              onPageChange={setCommentsCurrentPage}
                              onPageSizeChange={handleCommentsPageSizeChange}
                              showSizeChanger={false}
                              showQuickJumper={false}
                              pageSizeOptions={[5, 10, 20]}
                              className="justify-center"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* 固定的流程控制按钮区域 */}
              <div className="flex-shrink-0">
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 sm:gap-0">
                  {canPerformAction(selectedEvaluation, "self") && (
                    <Button
                      onClick={() => handleCompleteStage(selectedEvaluation.id, "self")}
                      className="w-full sm:w-auto"
                      disabled={isSubmittingSelfEvaluation}
                    >
                      {isSubmittingSelfEvaluation ? "提交中..." : "完成自评"}
                    </Button>
                  )}
                  {canPerformAction(selectedEvaluation, "manager") && (
                    <Button
                      onClick={() => handleCompleteStage(selectedEvaluation.id, "manager")}
                      className="w-full sm:w-auto"
                    >
                      完成主管评估
                    </Button>
                  )}
                  {canPerformAction(selectedEvaluation, "hr") && (
                    <Button
                      onClick={() => handleCompleteStage(selectedEvaluation.id, "hr")}
                      className="w-full sm:w-auto"
                    >
                      完成HR审核
                    </Button>
                  )}
                  {canPerformAction(selectedEvaluation, "confirm") && (
                    <Button
                      onClick={() => handleCompleteStage(selectedEvaluation.id, "confirm")}
                      className="w-full sm:w-auto"
                    >
                      确认最终得分
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setScoreDialogOpen(false)} className="w-full sm:w-auto">
                    关闭
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
