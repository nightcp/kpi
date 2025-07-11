"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Award, FileCheck, CheckCircle, Clock, Star } from "lucide-react";
import { evaluationApi, scoreApi, employeeApi, templateApi, type KPIEvaluation, type KPIScore, type Employee, type KPITemplate } from "@/lib/api";

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<KPIEvaluation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<KPITemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<KPIEvaluation | null>(null);
  const [scores, setScores] = useState<KPIScore[]>([]);
  const [currentRole] = useState('hr'); // 模拟当前用户角色
  const [currentUserId] = useState(6); // 模拟当前用户ID
  const [formData, setFormData] = useState({
    employee_id: "",
    template_id: "",
    period: "monthly",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    quarter: Math.floor(new Date().getMonth() / 3) + 1
  });

  // 获取评估列表
  const fetchEvaluations = async () => {
    try {
      const response = await evaluationApi.getAll();
      setEvaluations(response.data || []);
    } catch (error) {
      console.error("获取评估列表失败:", error);
      // 模拟数据
      setEvaluations([
        {
          id: 1,
          employee_id: 2,
          template_id: 1,
          period: "monthly",
          year: 2024,
          month: 12,
          status: "pending",
          total_score: 0,
          final_comment: "",
          created_at: "2024-12-01T00:00:00Z",
          employee: { id: 2, name: "李四", email: "lisi@company.com", position: "高级开发工程师", department_id: 1, role: "employee", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "技术部" } },
          template: { id: 1, name: "技术岗位月度考核", description: "适用于技术人员的月度绩效考核", period: "monthly", is_active: true, created_at: "2024-01-01T00:00:00Z" }
        },
        {
          id: 2,
          employee_id: 3,
          template_id: 1,
          period: "monthly",
          year: 2024,
          month: 12,
          status: "self_evaluated",
          total_score: 78,
          final_comment: "",
          created_at: "2024-12-01T00:00:00Z",
          employee: { id: 3, name: "王五", email: "wangwu@company.com", position: "前端开发工程师", department_id: 1, role: "employee", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "技术部" } },
          template: { id: 1, name: "技术岗位月度考核", description: "适用于技术人员的月度绩效考核", period: "monthly", is_active: true, created_at: "2024-01-01T00:00:00Z" }
        },
        {
          id: 3,
          employee_id: 5,
          template_id: 2,
          period: "quarterly",
          year: 2024,
          quarter: 4,
          status: "manager_evaluated",
          total_score: 85,
          final_comment: "",
          created_at: "2024-10-01T00:00:00Z",
          employee: { id: 5, name: "钱七", email: "qianqi@company.com", position: "市场专员", department_id: 2, role: "employee", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "市场部" } },
          template: { id: 2, name: "市场岗位季度考核", description: "适用于市场人员的季度绩效考核", period: "quarterly", is_active: true, created_at: "2024-01-01T00:00:00Z" }
        }
      ]);
    }
  };

  // 获取员工列表
  const fetchEmployees = async () => {
    try {
      const response = await employeeApi.getAll();
      setEmployees(response.data || []);
    } catch (error) {
      console.error("获取员工列表失败:", error);
      setEmployees([]);
    }
  };

  // 获取模板列表
  const fetchTemplates = async () => {
    try {
      const response = await templateApi.getAll();
      setTemplates(response.data || []);
    } catch (error) {
      console.error("获取模板列表失败:", error);
      setTemplates([]);
    }
  };

  // 获取评估详情和分数
  const fetchEvaluationScores = async (evaluationId: number) => {
    try {
      const response = await scoreApi.getByEvaluation(evaluationId);
      setScores(response.data || []);
    } catch (error) {
      console.error("获取评估详情失败:", error);
      // 模拟数据
      setScores([
        {
          id: 1,
          evaluation_id: evaluationId,
          item_id: 1,
          self_score: 18,
          self_comment: "本月完成了3个重要功能模块，代码质量良好",
          manager_score: 16,
          manager_comment: "代码质量不错，但还有改进空间",
          final_score: 16,
          created_at: "2024-12-01T00:00:00Z",
          item: { id: 1, template_id: 1, name: "代码质量", description: "代码规范性、可维护性评估", max_score: 20, order: 1, created_at: "2024-01-01T00:00:00Z" }
        },
        {
          id: 2,
          evaluation_id: evaluationId,
          item_id: 2,
          self_score: 23,
          self_comment: "按时完成了所有分配的任务",
          manager_score: 20,
          manager_comment: "任务完成及时，质量较好",
          final_score: 20,
          created_at: "2024-12-01T00:00:00Z",
          item: { id: 2, template_id: 1, name: "任务完成度", description: "按时完成分配的开发任务", max_score: 25, order: 2, created_at: "2024-01-01T00:00:00Z" }
        }
      ]);
    }
  };

  useEffect(() => {
    fetchEvaluations();
    fetchEmployees();
    fetchTemplates();
  }, []);

  // 创建新评估
  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await evaluationApi.create({
        employee_id: parseInt(formData.employee_id),
        template_id: parseInt(formData.template_id),
        period: formData.period,
        year: formData.year,
        month: formData.period === "monthly" ? formData.month : undefined,
        quarter: formData.period === "quarterly" ? formData.quarter : undefined,
        status: "pending",
        total_score: 0,
        final_comment: ""
      });
      
      fetchEvaluations();
      setDialogOpen(false);
      setFormData({
        employee_id: "",
        template_id: "",
        period: "monthly",
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        quarter: Math.floor(new Date().getMonth() / 3) + 1
      });
    } catch (error) {
      console.error("创建评估失败:", error);
    }
  };

  // 更新评分
  const handleUpdateScore = async (scoreId: number, type: 'self' | 'manager', score: number, comment: string) => {
    try {
      if (type === 'self') {
        await scoreApi.updateSelf(scoreId, { self_score: score, self_comment: comment });
      } else if (type === 'manager') {
        await scoreApi.updateManager(scoreId, { manager_score: score, manager_comment: comment });
      }
      
      if (selectedEvaluation) {
        fetchEvaluationScores(selectedEvaluation.id);
        fetchEvaluations();
      }
    } catch (error) {
      console.error("更新评分失败:", error);
    }
  };

  // 完成评估流程
  const handleCompleteStage = async (evaluationId: number, stage: string) => {
    try {
      let newStatus = '';
      switch (stage) {
        case 'self':
          newStatus = 'self_evaluated';
          break;
        case 'manager':
          newStatus = 'manager_evaluated';
          break;
        case 'hr':
          newStatus = 'completed';
          break;
      }
      
      await evaluationApi.update(evaluationId, { status: newStatus });
      fetchEvaluations();
      if (selectedEvaluation) {
        fetchEvaluationScores(selectedEvaluation.id);
      }
    } catch (error) {
      console.error("更新评估状态失败:", error);
    }
  };

  // 查看评估详情
  const handleViewDetails = (evaluation: KPIEvaluation) => {
    setSelectedEvaluation(evaluation);
    fetchEvaluationScores(evaluation.id);
    setScoreDialogOpen(true);
  };

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />待自评</Badge>;
      case "self_evaluated":
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><FileCheck className="w-3 h-3 mr-1" />待主管评估</Badge>;
      case "manager_evaluated":
        return <Badge variant="outline" className="text-purple-600 border-purple-600"><Eye className="w-3 h-3 mr-1" />待HR审核</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />已完成</Badge>;
      default:
        return <Badge variant="outline">未知状态</Badge>;
    }
  };

  // 获取周期标签
  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "monthly":
        return "月度";
      case "quarterly":
        return "季度";
      case "yearly":
        return "年度";
      default:
        return period;
    }
  };

  // 获取当前用户可以操作的评估
  const getFilteredEvaluations = () => {
    if (currentRole === 'hr') {
      return evaluations; // HR可以看到所有评估
    }
    // 根据用户角色过滤
    return evaluations.filter(evaluation => {
      if (currentRole === 'manager') {
        // 经理可以看到下属的评估
        return evaluation.employee?.manager_id === currentUserId;
      } else {
        // 员工只能看到自己的评估
        return evaluation.employee_id === currentUserId;
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">考核管理</h1>
          <p className="text-gray-600 mt-2">管理员工绩效考核流程</p>
        </div>
        {currentRole === 'hr' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                创建考核
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>创建新考核</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEvaluation} className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="employee">员工</Label>
                  <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择员工" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.name} - {employee.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="template">考核模板</Label>
                  <Select value={formData.template_id} onValueChange={(value) => setFormData({ ...formData, template_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择模板" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="period">考核周期</Label>
                  <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value })}>
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
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    min="2020"
                    max="2030"
                    required
                  />
                </div>
                {formData.period === "monthly" && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="month">月份</Label>
                    <Select value={formData.month.toString()} onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}>
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
                    <Select value={formData.quarter.toString()} onValueChange={(value) => setFormData({ ...formData, quarter: parseInt(value) })}>
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
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit">
                    创建
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总评估数</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evaluations.length}</div>
            <p className="text-xs text-muted-foreground">
              全部考核项目
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {evaluations.filter(e => e.status === "pending" || e.status === "self_evaluated" || e.status === "manager_evaluated").length}
            </div>
            <p className="text-xs text-muted-foreground">
              需要处理的考核
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {evaluations.filter(e => e.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">
              已完成的考核
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均分</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {evaluations.length > 0 ? 
                Math.round(evaluations.reduce((acc, e) => acc + e.total_score, 0) / evaluations.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              总体考核平均分
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 评估列表 */}
      <Card>
        <CardHeader>
          <CardTitle>考核列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>员工</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>考核模板</TableHead>
                  <TableHead>周期</TableHead>
                  <TableHead>总分</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredEvaluations().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      暂无考核数据
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredEvaluations().map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">
                        {evaluation.employee?.name}
                        <div className="text-sm text-muted-foreground">
                          {evaluation.employee?.position}
                        </div>
                      </TableCell>
                      <TableCell>{evaluation.employee?.department?.name}</TableCell>
                      <TableCell>{evaluation.template?.name}</TableCell>
                      <TableCell>
                        {getPeriodLabel(evaluation.period)} {evaluation.year}
                        {evaluation.month && `年${evaluation.month}月`}
                        {evaluation.quarter && `年Q${evaluation.quarter}`}
                      </TableCell>
                      <TableCell>
                        <div className="text-lg font-semibold">
                          {evaluation.total_score}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(evaluation.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(evaluation)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            查看详情
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 评分详情对话框 */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              考核详情 - {selectedEvaluation?.employee?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedEvaluation && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>员工姓名</Label>
                  <p className="text-sm">{selectedEvaluation.employee?.name}</p>
                </div>
                <div>
                  <Label>考核模板</Label>
                  <p className="text-sm">{selectedEvaluation.template?.name}</p>
                </div>
                <div>
                  <Label>考核周期</Label>
                  <p className="text-sm">
                    {getPeriodLabel(selectedEvaluation.period)} {selectedEvaluation.year}
                    {selectedEvaluation.month && `年${selectedEvaluation.month}月`}
                    {selectedEvaluation.quarter && `年Q${selectedEvaluation.quarter}`}
                  </p>
                </div>
                <div>
                  <Label>当前状态</Label>
                  <div className="mt-1">{getStatusBadge(selectedEvaluation.status)}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">考核项目</h3>
                {scores.map((score) => (
                  <Card key={score.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{score.item?.name}</h4>
                          <p className="text-sm text-muted-foreground">{score.item?.description}</p>
                          <p className="text-sm text-muted-foreground">满分：{score.item?.max_score}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{score.final_score || score.manager_score || score.self_score || 0}</div>
                          <div className="text-sm text-muted-foreground">当前得分</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium">自评分数</Label>
                          <div className="mt-1 text-sm">{score.self_score || '未评分'}</div>
                          <Label className="text-sm font-medium">自评说明</Label>
                          <div className="mt-1 text-sm text-muted-foreground">{score.self_comment || '暂无说明'}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">主管评分</Label>
                          <div className="mt-1 text-sm">{score.manager_score || '未评分'}</div>
                          <Label className="text-sm font-medium">主管说明</Label>
                          <div className="mt-1 text-sm text-muted-foreground">{score.manager_comment || '暂无说明'}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">最终得分</Label>
                          <div className="mt-1 text-sm font-bold">{score.final_score || '待确定'}</div>
                        </div>
                      </div>

                      {/* 根据角色和状态显示不同的操作按钮 */}
                      {selectedEvaluation.status === 'pending' && currentRole === 'employee' && selectedEvaluation.employee_id === currentUserId && (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const newScore = prompt('请输入自评分数 (0-' + score.item?.max_score + '):', score.self_score?.toString() || '');
                              const newComment = prompt('请输入自评说明:', score.self_comment || '');
                              if (newScore !== null && newComment !== null) {
                                handleUpdateScore(score.id, 'self', parseInt(newScore), newComment);
                              }
                            }}
                          >
                            自评
                          </Button>
                        </div>
                      )}

                      {selectedEvaluation.status === 'self_evaluated' && currentRole === 'manager' && (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const newScore = prompt('请输入主管评分 (0-' + score.item?.max_score + '):', score.manager_score?.toString() || '');
                              const newComment = prompt('请输入主管说明:', score.manager_comment || '');
                              if (newScore !== null && newComment !== null) {
                                handleUpdateScore(score.id, 'manager', parseInt(newScore), newComment);
                              }
                            }}
                          >
                            主管评分
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* 流程控制按钮 */}
              <div className="flex justify-end space-x-2">
                {selectedEvaluation.status === 'pending' && currentRole === 'employee' && selectedEvaluation.employee_id === currentUserId && (
                  <Button onClick={() => handleCompleteStage(selectedEvaluation.id, 'self')}>
                    完成自评
                  </Button>
                )}
                {selectedEvaluation.status === 'self_evaluated' && currentRole === 'manager' && (
                  <Button onClick={() => handleCompleteStage(selectedEvaluation.id, 'manager')}>
                    完成主管评估
                  </Button>
                )}
                {selectedEvaluation.status === 'manager_evaluated' && currentRole === 'hr' && (
                  <Button onClick={() => handleCompleteStage(selectedEvaluation.id, 'hr')}>
                    完成HR审核
                  </Button>
                )}
                <Button variant="outline" onClick={() => setScoreDialogOpen(false)}>
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 