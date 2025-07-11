"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building, FileText, TrendingUp, Clock, CheckCircle, AlertCircle, Award, Target, Eye, Plus } from "lucide-react";
import { statisticsApi, type DashboardStats } from "@/lib/api";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取仪表板统计数据
  const fetchDashboardStats = async () => {
    try {
      const response = await statisticsApi.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error("获取统计数据失败:", error);
      // 使用模拟数据
      setStats({
        total_employees: 7,
        total_departments: 4,
        total_evaluations: 15,
        pending_evaluations: 3,
        completed_evaluations: 12,
        average_score: 83.5,
        recent_evaluations: [
          { id: 1, employee_id: 1, template_id: 1, period: "monthly", year: 2024, month: 12, status: "completed", total_score: 85, final_comment: "", created_at: "2024-12-01T00:00:00Z", employee: { id: 1, name: "张三", email: "zhangsan@company.com", position: "技术总监", department_id: 1, role: "manager", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "技术部" } }, template: { id: 1, name: "技术岗位月度考核", description: "适用于技术人员的月度绩效考核", period: "monthly", is_active: true, created_at: "2024-01-01T00:00:00Z" } },
          { id: 2, employee_id: 2, template_id: 1, period: "monthly", year: 2024, month: 12, status: "manager_evaluated", total_score: 92, final_comment: "", created_at: "2024-12-02T00:00:00Z", employee: { id: 2, name: "李四", email: "lisi@company.com", position: "高级开发工程师", department_id: 1, role: "employee", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "技术部" } }, template: { id: 1, name: "技术岗位月度考核", description: "适用于技术人员的月度绩效考核", period: "monthly", is_active: true, created_at: "2024-01-01T00:00:00Z" } },
          { id: 3, employee_id: 3, template_id: 1, period: "monthly", year: 2024, month: 12, status: "pending", total_score: 78, final_comment: "", created_at: "2024-12-03T00:00:00Z", employee: { id: 3, name: "王五", email: "wangwu@company.com", position: "前端开发工程师", department_id: 1, role: "employee", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "技术部" } }, template: { id: 1, name: "技术岗位月度考核", description: "适用于技术人员的月度绩效考核", period: "monthly", is_active: true, created_at: "2024-01-01T00:00:00Z" } },
          { id: 4, employee_id: 4, template_id: 2, period: "quarterly", year: 2024, quarter: 4, status: "completed", total_score: 88, final_comment: "", created_at: "2024-12-04T00:00:00Z", employee: { id: 4, name: "赵六", email: "zhaoliu@company.com", position: "市场总监", department_id: 2, role: "manager", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "市场部" } }, template: { id: 2, name: "市场岗位季度考核", description: "适用于市场人员的季度绩效考核", period: "quarterly", is_active: true, created_at: "2024-01-01T00:00:00Z" } },
          { id: 5, employee_id: 5, template_id: 2, period: "quarterly", year: 2024, quarter: 4, status: "self_evaluated", total_score: 76, final_comment: "", created_at: "2024-12-05T00:00:00Z", employee: { id: 5, name: "钱七", email: "qianqi@company.com", position: "市场专员", department_id: 2, role: "employee", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "市场部" } }, template: { id: 2, name: "市场岗位季度考核", description: "适用于市场人员的季度绩效考核", period: "quarterly", is_active: true, created_at: "2024-01-01T00:00:00Z" } }
        ]
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />待自评</Badge>;
      case "self_evaluated":
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><FileText className="w-3 h-3 mr-1" />待主管评估</Badge>;
      case "manager_evaluated":
        return <Badge variant="outline" className="text-purple-600 border-purple-600"><Eye className="w-3 h-3 mr-1" />待HR审核</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />已完成</Badge>;
      default:
        return <Badge variant="outline">未知状态</Badge>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">加载中...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">仪表板</h1>
        <p className="text-gray-600 mt-2">欢迎使用KPI绩效考核系统</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总员工数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_employees || 0}</div>
            <p className="text-xs text-muted-foreground">活跃员工</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">部门数量</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_departments || 0}</div>
            <p className="text-xs text-muted-foreground">组织部门</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_evaluations || 0}</div>
            <p className="text-xs text-muted-foreground">需要处理</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均分数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.average_score?.toFixed(1) || "0.0"}</div>
            <p className="text-xs text-muted-foreground">整体表现</p>
          </CardContent>
        </Card>
      </div>

      {/* 次要统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总评估数</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_evaluations || 0}</div>
            <p className="text-xs text-muted-foreground">累计考核</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed_evaluations || 0}</div>
            <p className="text-xs text-muted-foreground">完成考核</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完成率</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_evaluations ? 
                Math.round((stats.completed_evaluations / stats.total_evaluations) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">考核完成率</p>
          </CardContent>
        </Card>
      </div>

      {/* 最近活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>最近评估</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-2">
            {stats?.recent_evaluations && stats.recent_evaluations.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_evaluations.slice(0, 5).map((evaluation) => (
                  <div key={evaluation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{evaluation.employee?.name}</span>
                        <span className="text-sm text-gray-500">{evaluation.employee?.position}</span>
                      </div>
                      <div className="text-sm text-gray-600">{evaluation.template?.name}</div>
                      <div className="text-xs text-gray-500">{evaluation.employee?.department?.name}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-lg font-semibold">{evaluation.total_score}</div>
                        <div className="text-xs text-gray-500">得分</div>
                      </div>
                      {getStatusBadge(evaluation.status)}
                    </div>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <Link href="/evaluations">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      查看全部
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-8 text-gray-500">
                  暂无评估记录
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/evaluations">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                <div>
                  <p className="font-medium">考核管理</p>
                  <p className="text-sm text-gray-600">创建和管理员工KPI评估</p>
                </div>
                <Badge variant="secondary">
                  <Plus className="w-3 h-3 mr-1" />
                  新建
                </Badge>
              </div>
            </Link>
            <Link href="/templates">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                <div>
                  <p className="font-medium">KPI模板</p>
                  <p className="text-sm text-gray-600">创建和管理KPI考核模板</p>
                </div>
                <Badge variant="secondary">可用</Badge>
              </div>
            </Link>
            <Link href="/statistics">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                <div>
                  <p className="font-medium">统计分析</p>
                  <p className="text-sm text-gray-600">查看绩效统计和分析报告</p>
                </div>
                <Badge variant="secondary">可用</Badge>
              </div>
            </Link>
            <Link href="/employees">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                <div>
                  <p className="font-medium">员工管理</p>
                  <p className="text-sm text-gray-600">管理员工信息和组织架构</p>
                </div>
                <Badge variant="secondary">可用</Badge>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
