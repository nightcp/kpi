import axios from "axios"

// 创建axios实例
const api = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    console.error("API Error:", error)
    return Promise.reject(error)
  }
)

// 接口类型定义
export interface Department {
  id: number
  name: string
  description: string
  created_at: string
  employees?: { length: number }
}

export interface Employee {
  id: number
  name: string
  email: string
  position: string
  department_id: number
  manager_id?: number
  role: string
  is_active: boolean
  created_at: string
  department?: { name: string }
  manager?: { name: string }
}

export interface KPITemplate {
  id: number
  name: string
  description: string
  period: string
  is_active: boolean
  created_at: string
  items?: KPIItem[]
}

export interface KPIItem {
  id: number
  template_id: number
  name: string
  description: string
  max_score: number
  order: number
  created_at: string
}

export interface KPIEvaluation {
  id: number
  employee_id: number
  template_id: number
  period: string
  year: number
  month?: number
  quarter?: number
  status: string
  total_score: number
  final_comment: string
  created_at: string
  employee?: Employee
  template?: KPITemplate
  scores?: KPIScore[]
}

export interface KPIScore {
  id: number
  evaluation_id: number
  item_id: number
  self_score?: number
  self_comment: string
  manager_score?: number
  manager_comment: string
  final_score?: number
  created_at: string
  item?: KPIItem
}

export interface DashboardStats {
  total_employees: number
  total_departments: number
  total_evaluations: number
  pending_evaluations: number
  completed_evaluations: number
  average_score: number
  recent_evaluations: KPIEvaluation[]
}

// 统计相关接口
export interface DepartmentStats {
  name: string
  total: number
  completed: number
  pending: number
  avg_score: number
}

export interface MonthlyTrend {
  month: string
  evaluations: number
  avg_score: number
  completion_rate: number
}

export interface ScoreDistribution {
  range: string
  count: number
  color: string
}

export interface TopPerformer {
  name: string
  department: string
  score: number
  evaluations: number
}

export interface RecentEvaluation {
  id: number
  employee: string
  department: string
  template: string
  score: number
  status: string
  period: string
  year: number
  month?: number
  quarter?: number
}

// 统计数据响应类型
export interface StatisticsResponse {
  departmentStats: DepartmentStats[]
  monthlyTrends: MonthlyTrend[]
  scoreDistribution: ScoreDistribution[]
  topPerformers: TopPerformer[]
  recentEvaluations: RecentEvaluation[]
}

// 导出响应类型
export interface ExportResponse {
  file_url: string
  file_name: string
  file_size: number
  message: string
}

// 设置相关接口
export interface SystemSettings {
  system_name: string
  system_version: string
  company_name: string
  company_logo: string
  timezone: string
  language: string
  date_format: string

  // 评估设置
  evaluation_auto_create: boolean
  evaluation_reminder_days: number
  evaluation_timeout_days: number
  allow_self_evaluation: boolean
  require_manager_approval: boolean
  require_hr_approval: boolean
  allow_evaluation_comments: boolean

  // 通知设置
  notification_enabled: boolean
  email_notifications: boolean
  system_notifications: boolean
  reminder_notifications: boolean

  // 安全设置
  password_min_length: number
  password_require_uppercase: boolean
  password_require_lowercase: boolean
  password_require_numbers: boolean
  password_require_symbols: boolean
  session_timeout: number
  max_login_attempts: number

  // 数据设置
  data_retention_months: number
  backup_enabled: boolean
  backup_frequency: string
  export_format: string
}

// 消息类型
export interface Message {
  type: "success" | "error" | "info" | "warning" | ""
  content: string
}

// 部门API
export const departmentApi = {
  getAll: (): Promise<{ data: Department[]; total: number }> => api.get("/departments"),
  getById: (id: number): Promise<{ data: Department }> => api.get(`/departments/${id}`),
  create: (data: Omit<Department, "id" | "created_at">): Promise<{ data: Department }> =>
    api.post("/departments", data),
  update: (id: number, data: Partial<Department>): Promise<{ data: Department }> => api.put(`/departments/${id}`, data),
  delete: (id: number): Promise<void> => api.delete(`/departments/${id}`),
}

// 员工API
export const employeeApi = {
  getAll: (): Promise<{ data: Employee[]; total: number }> => api.get("/employees"),
  getById: (id: number): Promise<{ data: Employee }> => api.get(`/employees/${id}`),
  create: (data: Omit<Employee, "id" | "created_at">): Promise<{ data: Employee }> => api.post("/employees", data),
  update: (id: number, data: Partial<Employee>): Promise<{ data: Employee }> => api.put(`/employees/${id}`, data),
  delete: (id: number): Promise<void> => api.delete(`/employees/${id}`),
  getSubordinates: (id: number): Promise<{ data: Employee[]; total: number }> =>
    api.get(`/employees/${id}/subordinates`),
}

// KPI模板API
export const templateApi = {
  getAll: (): Promise<{ data: KPITemplate[]; total: number }> => api.get("/templates"),
  getById: (id: number): Promise<{ data: KPITemplate }> => api.get(`/templates/${id}`),
  create: (data: Omit<KPITemplate, "id" | "created_at">): Promise<{ data: KPITemplate }> =>
    api.post("/templates", data),
  update: (id: number, data: Partial<KPITemplate>): Promise<{ data: KPITemplate }> => api.put(`/templates/${id}`, data),
  delete: (id: number): Promise<void> => api.delete(`/templates/${id}`),
  getItems: (id: number): Promise<{ data: KPIItem[]; total: number }> => api.get(`/templates/${id}/items`),
}

// KPI项目API
export const itemApi = {
  getById: (id: number): Promise<{ data: KPIItem }> => api.get(`/items/${id}`),
  create: (data: Omit<KPIItem, "id" | "created_at">): Promise<{ data: KPIItem }> => api.post("/items", data),
  update: (id: number, data: Partial<KPIItem>): Promise<{ data: KPIItem }> => api.put(`/items/${id}`, data),
  delete: (id: number): Promise<void> => api.delete(`/items/${id}`),
}

// KPI评估API
export const evaluationApi = {
  getAll: (): Promise<{ data: KPIEvaluation[]; total: number }> => api.get("/evaluations"),
  getById: (id: number): Promise<{ data: KPIEvaluation }> => api.get(`/evaluations/${id}`),
  create: (data: Omit<KPIEvaluation, "id" | "created_at">): Promise<{ data: KPIEvaluation }> =>
    api.post("/evaluations", data),
  update: (id: number, data: Partial<KPIEvaluation>): Promise<{ data: KPIEvaluation }> =>
    api.put(`/evaluations/${id}`, data),
  delete: (id: number): Promise<void> => api.delete(`/evaluations/${id}`),
  getByEmployee: (employeeId: number): Promise<{ data: KPIEvaluation[]; total: number }> =>
    api.get(`/evaluations/employee/${employeeId}`),
  getPending: (employeeId: number): Promise<{ data: KPIEvaluation[]; total: number }> =>
    api.get(`/evaluations/pending/${employeeId}`),
}

// KPI评分API
export const scoreApi = {
  getByEvaluation: (evaluationId: number): Promise<{ data: KPIScore[]; total: number }> =>
    api.get(`/scores/evaluation/${evaluationId}`),
  updateSelf: (id: number, data: { self_score?: number; self_comment: string }): Promise<{ data: KPIScore }> =>
    api.put(`/scores/${id}/self`, data),
  updateManager: (id: number, data: { manager_score?: number; manager_comment: string }): Promise<{ data: KPIScore }> =>
    api.put(`/scores/${id}/manager`, data),
  updateFinal: (id: number, data: { final_score?: number }): Promise<{ data: KPIScore }> =>
    api.put(`/scores/${id}/final`, data),
}

// 统计API
export const statisticsApi = {
  getDashboard: (params?: {
    year?: string
    period?: string
    month?: string
    quarter?: string
  }): Promise<{ data: DashboardStats }> => api.get("/statistics/dashboard", { params }),
  getDepartment: (id: number): Promise<StatisticsResponse> => api.get("/statistics/department/" + id),
  getEmployee: (id: number): Promise<StatisticsResponse> => api.get("/statistics/employee/" + id),
  getTrends: (period?: string): Promise<StatisticsResponse> => api.get("/statistics/trends", { params: { period } }),
  getData: (params?: {
    year?: string
    period?: string
    month?: string
    quarter?: string
  }): Promise<{ data: StatisticsResponse }> => api.get("/statistics/data", { params }),
}

// 导出API
export const exportApi = {
  evaluation: (id: number): Promise<ExportResponse> => api.get(`/export/evaluation/${id}`),
  department: (id: number): Promise<ExportResponse> => api.get(`/export/department/${id}`),
  period: (period: string, params?: { year?: string; month?: string; quarter?: string }): Promise<ExportResponse> =>
    api.get(`/export/period/${period}`, { params }),
}

// 评论接口类型
export interface EvaluationComment {
  id: number
  evaluation_id: number
  user_id: number
  content: string
  is_private: boolean
  created_at: string
  updated_at: string
  user?: {
    id: number
    name: string
    email: string
    position: string
    department?: {
      name: string
    }
  }
}

// 评论API
export const commentApi = {
  getByEvaluation: (evaluationId: number): Promise<{ data: EvaluationComment[] }> =>
    api.get(`/evaluations/${evaluationId}/comments`),
  create: (
    evaluationId: number,
    data: { content: string; is_private: boolean }
  ): Promise<{ data: EvaluationComment }> => api.post(`/evaluations/${evaluationId}/comments`, data),
  update: (
    evaluationId: number,
    commentId: number,
    data: { content: string; is_private: boolean }
  ): Promise<{ data: EvaluationComment }> => api.put(`/evaluations/${evaluationId}/comments/${commentId}`, data),
  delete: (evaluationId: number, commentId: number): Promise<void> =>
    api.delete(`/evaluations/${evaluationId}/comments/${commentId}`),
}

export default api
