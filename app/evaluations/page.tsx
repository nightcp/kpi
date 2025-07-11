"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Eye, Award, FileCheck, CheckCircle, Clock, Star, Edit2, Save, X } from "lucide-react";
import { evaluationApi, scoreApi, employeeApi, templateApi, type KPIEvaluation, type KPIScore, type Employee, type KPITemplate } from "@/lib/api";
import { useUser } from "@/lib/user-context";
import { useAppContext } from "@/lib/app-context";

export default function EvaluationsPage() {
  const { Alert, Confirm } = useAppContext();
  const { currentUser, isManager, isHR } = useUser();
  const [evaluations, setEvaluations] = useState<KPIEvaluation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<KPITemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<KPIEvaluation | null>(null);
  const [scores, setScores] = useState<KPIScore[]>([]);
  const [activeTab, setActiveTab] = useState("details"); // 新增：标签页状态
  const [editingScore, setEditingScore] = useState<number | null>(null); // 新增：正在编辑的评分ID
  const [tempScore, setTempScore] = useState<number>(0); // 新增：临时评分
  const [tempComment, setTempComment] = useState<string>(""); // 新增：临时评论
  const [isSubmittingSelfEvaluation, setIsSubmittingSelfEvaluation] = useState(false); // 新增：自评提交状态
  const [loading, setLoading] = useState(false); // 新增：通用加载状态
  const [error, setError] = useState<string | null>(null); // 新增：错误状态
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
      setLoading(true);
      setError(null);
      const response = await evaluationApi.getAll();
      setEvaluations(response.data || []);
    } catch (error) {
      console.error("获取评估列表失败:", error);
      setError("获取评估列表失败，请刷新重试");
    } finally {
      setLoading(false);
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

  // 开始编辑评分
  const handleStartEdit = (scoreId: number, currentScore?: number, currentComment?: string) => {
    setEditingScore(scoreId);
    setTempScore(currentScore || 0);
    setTempComment(currentComment || "");
  };

  // 取消编辑评分
  const handleCancelEdit = () => {
    setEditingScore(null);
    setTempScore(0);
    setTempComment("");
  };

  // 保存评分
  const handleSaveScore = async (scoreId: number, type: 'self' | 'manager') => {
    try {
      if (type === 'self') {
        await scoreApi.updateSelf(scoreId, { self_score: tempScore, self_comment: tempComment });
      } else if (type === 'manager') {
        await scoreApi.updateManager(scoreId, { manager_score: tempScore, manager_comment: tempComment });
      }
      
      if (selectedEvaluation) {
        fetchEvaluationScores(selectedEvaluation.id);
        fetchEvaluations();
      }
      setEditingScore(null);
      setTempScore(0);
      setTempComment("");
    } catch (error) {
      console.error("更新评分失败:", error);
    }
  };

  // 完成阶段
  const handleCompleteStage = async (evaluationId: number, stage: string) => {
    // 验证状态流转
    if (selectedEvaluation) {
      const validationError = validateStageTransition(selectedEvaluation, stage);
      if (validationError) {
        Alert(validationError);
        return;
      }
    }
    
    // 自评阶段的特殊处理
    if (stage === 'self') {
      // 检查是否所有项目都已自评
      const uncompletedItems = scores.filter(score => !score.self_score || score.self_score === 0);
      if (uncompletedItems.length > 0) {
        Alert(`请先完成所有项目的自评。还有 ${uncompletedItems.length} 个项目未评分。`);
        return;
      }
      
      // 确认提交自评
      const result = await Confirm('确定要提交自评吗？提交后将无法修改。')
      if (!result) {
        return;
      }
      
      setIsSubmittingSelfEvaluation(true);
    }
    
    // 上级评分阶段的特殊处理
    if (stage === 'manager') {
      // 检查是否所有项目都已进行主管评分
      const uncompletedItems = scores.filter(score => !score.manager_score || score.manager_score === 0);
      if (uncompletedItems.length > 0) {
        Alert(`请先完成所有项目的主管评分。还有 ${uncompletedItems.length} 个项目未评分。`);
        return;
      }
      
      // 确认提交主管评分
      const result = await Confirm('确定要提交主管评分吗？提交后将无法修改，评估将进入HR审核阶段。')
      if (!result) {
        return;
      }
    }
    
    // HR审核阶段的特殊处理
    if (stage === 'hr') {
      // 检查是否所有项目都已确定最终得分
      const unconfirmedItems = scores.filter(score => !score.final_score && !score.manager_score);
      if (unconfirmedItems.length > 0) {
        Alert(`请先确认所有项目的最终得分。还有 ${unconfirmedItems.length} 个项目待确认。`);
        return;
      }
      
      // 确认完成HR审核
      const result = await Confirm('确定要完成HR审核吗？提交后将无法再修改，评估将进入员工确认阶段。')
      if (!result) {
        return;
      }
    }

    // 员工最后确认最终得分
    if (stage === 'confirm') {
      // 检查是否所有项目都已确认最终得分
      const alreadyConfirmed = scores.find(score => score.final_score);
      if (alreadyConfirmed) {
        Alert("已确认最终得分，无法再修改。");
        return;
      }

      // 确认最终得分
      const result = await Confirm('确定要确认最终得分吗？确认后将无法再修改。')
      if (!result) {
        return;
      }
    }
      
    try {
      let newStatus = "";
      switch (stage) {
        case 'self':
          newStatus = isManager ? 'manager_evaluated' : 'self_evaluated';
          break;
        case 'manager':
          newStatus = 'manager_evaluated';
          break;
        case 'hr':
          newStatus = 'pending_confirm';
          break;
        case 'confirm':
          newStatus = 'completed';
          break;
      }
      
      // 计算并更新总分
      let totalScore = 0;
      switch (stage) {
        case 'self':
          // 自评完成后，总分为自评分数总和
          totalScore = scores.reduce((acc, score) => acc + (score.self_score || 0), 0);
          break;
        case 'manager':
          // 主管评分完成后，总分为主管评分总和
          totalScore = scores.reduce((acc, score) => acc + (score.manager_score || 0), 0);
          break;
        case 'hr':
        case 'confirm':
          // HR审核或员工确认最终得分后，总分为最终得分总和
          totalScore = scores.reduce((acc, score) => acc + (score.final_score || score.manager_score || 0), 0);
          break;
      }
      
      await evaluationApi.update(evaluationId, { 
        status: newStatus,
        total_score: totalScore
      });

      if (stage === 'confirm') {
        // 员工确认最终得分后，更新最终得分
        setScores(scores => scores.map(s => ({
          ...s,
          final_score: s.manager_score ?? s.self_score
        })));
      }
      
      fetchEvaluations();
      if (selectedEvaluation) {
        setSelectedEvaluation({ 
          ...selectedEvaluation, 
          status: newStatus,
          total_score: totalScore
        });
      }
      
      // 成功提示
      if (stage === 'self') {
        await Alert('自评提交成功！请等待上级主管评分。');
      } else if (stage === 'manager') {
        await Alert('主管评分提交成功！评估已转入HR审核阶段。');
      } else if (stage === 'hr') {
        await Alert('HR审核完成！请等待员工确认最终得分。');
      } else if (stage === 'confirm') {
        await Alert('最终得分确认成功！绩效评估已正式结束。');
      }
    } catch (error) {
      console.error("更新状态失败:", error);
      alert('提交失败，请重试。');
    } finally {
      if (stage === 'self') {
        setIsSubmittingSelfEvaluation(false);
      }
    }
  };

  // 查看详情
  const handleViewDetails = (evaluation: KPIEvaluation) => {
    setSelectedEvaluation(evaluation);
    fetchEvaluationScores(evaluation.id);
    setScoreDialogOpen(true);
    setActiveTab("details");
  };

  // 状态标签
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />待自评</Badge>;
      case "self_evaluated":
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><FileCheck className="w-3 h-3 mr-1" />待主管评估</Badge>;
      case "manager_evaluated":
        return <Badge variant="outline" className="text-purple-600 border-purple-600"><Eye className="w-3 h-3 mr-1" />待HR审核</Badge>;
      case "pending_confirm":
        return <Badge variant="outline" className="text-pink-600 border-pink-600"><Star className="w-3 h-3 mr-1" />待确认</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />已完成</Badge>;
      default:
        return <Badge variant="outline">未知状态</Badge>;
    }
  };

  // 周期标签
  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "monthly":
        return "月度";
      case "quarterly":
        return "季度";
      default:
        return "年度";
    }
  };

  // 根据用户角色过滤评估
  const getFilteredEvaluations = useMemo(() => {
    if (!currentUser) return [];
    
    if (isHR) {
      return evaluations; // HR可以看到所有评估
    }
    return evaluations.filter(evaluation => {
      if (isManager) {
        // 主管可以看到自己的考核 + 下属的考核
        return evaluation.employee_id === currentUser.id || 
               evaluation.employee?.manager_id === currentUser.id;
      } else {
        // 员工只能看到自己的评估
        return evaluation.employee_id === currentUser.id;
      }
    });
  }, [currentUser, evaluations, isHR, isManager]);

  // 检查是否可以进行某个操作
  const canPerformAction = (evaluation: KPIEvaluation, action: 'self' | 'manager' | 'hr' | 'confirm') => {
    if (!currentUser) return false;
    
    switch (action) {
      case 'self':
        // 任何人都可以对自己的考核进行自评（包括主管）
        return evaluation.status === 'pending' && evaluation.employee_id === currentUser.id;
      case 'manager':
        // 主管只能评估自己直接下属的员工，但不能评估自己
        return evaluation.status === 'self_evaluated' && 
               isManager && 
               evaluation.employee?.manager_id === currentUser.id &&
               evaluation.employee_id !== currentUser.id;
      case 'hr':
        return evaluation.status === 'manager_evaluated' && isHR;
      case 'confirm':
        return evaluation.status === 'pending_confirm' && evaluation.employee_id === currentUser.id;
      default:
        return false;
    }
  };

  // 获取状态流转进度
  const getStatusProgress = (status: string) => {
    const statusMap = {
      'pending': { step: 1, total: 4, label: '等待自评' },
      'self_evaluated': { step: 2, total: 4, label: '等待主管评估' },
      'manager_evaluated': { step: 3, total: 4, label: '等待HR审核' },
      'pending_confirm': { step: 4, total: 4, label: '等待确认' },
      'completed': { step: 4, total: 4, label: '已完成' }
    };
    return statusMap[status as keyof typeof statusMap] || { step: 0, total: 4, label: '未知状态' };
  };

  // 验证评估是否可以进入下一阶段
  const validateStageTransition = (evaluation: KPIEvaluation, stage: string): string | null => {
    const currentDate = new Date();
    const evaluationDate = new Date(evaluation.created_at);
    const daysDiff = Math.floor((currentDate.getTime() - evaluationDate.getTime()) / (1000 * 3600 * 24));

    // 检查评估是否已过期（示例：30天后过期）
    if (daysDiff > 30) {
      return '评估已过期，无法继续流转。请联系HR处理。';
    }

    // 检查用户权限和状态匹配
    if (!canPerformAction(evaluation, stage as 'self' | 'manager' | 'hr')) {
      return '您没有权限进行此操作，或评估状态不匹配。';
    }

    return null; // 验证通过
  };

  return (
    <div className="space-y-6">
      {/* 响应式头部 */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">考核管理</h1>
          <p className="text-gray-600 mt-1 sm:mt-2">管理员工绩效考核流程</p>
        </div>
        {isHR && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                创建考核
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md mx-auto">
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
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
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
            <p className="text-xs text-muted-foreground">
              全部考核项目
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">待处理</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {getFilteredEvaluations.filter(e => ["pending", "self_evaluated", "manager_evaluated", "pending_confirm"].includes(e.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              需要处理的考核
            </p>
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
            <p className="text-xs text-muted-foreground">
              已完成的考核
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">平均分</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {getFilteredEvaluations.length > 0 ? 
                Math.round(getFilteredEvaluations.reduce((acc, e) => acc + e.total_score, 0) / getFilteredEvaluations.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              总体考核平均分
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 text-sm">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* 评估列表 */}
      <Card>
        <CardHeader>
          <CardTitle>考核列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8">
              <div className="text-gray-500">加载中...</div>
            </div>
          )}
          <>
            {/* 桌面端表格显示 */}
            <div className="hidden lg:block">
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
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredEvaluations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          暂无考核数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredEvaluations.map((evaluation) => (
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
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
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
            </div>

            {/* 移动端卡片显示 */}
            <div className="lg:hidden space-y-4">
              {getFilteredEvaluations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无考核数据
                </div>
              ) : (
                getFilteredEvaluations.map((evaluation) => (
                  <Card key={evaluation.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">{evaluation.employee?.name}</h3>
                          <p className="text-sm text-gray-600">{evaluation.employee?.position}</p>
                          <p className="text-sm text-gray-500">{evaluation.employee?.department?.name}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">{evaluation.total_score}</div>
                          <div className="text-xs text-gray-500">总分</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">考核模板:</span>
                          <span className="text-sm font-medium">{evaluation.template?.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">考核周期:</span>
                          <span className="text-sm font-medium">
                            {getPeriodLabel(evaluation.period)} {evaluation.year}
                            {evaluation.month && `年${evaluation.month}月`}
                            {evaluation.quarter && `年Q${evaluation.quarter}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">状态:</span>
                          {getStatusBadge(evaluation.status)}
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(evaluation)}
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          查看详情
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        </CardContent>
      </Card>

      {/* 评分详情对话框 */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              考核详情 - {selectedEvaluation?.employee?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedEvaluation && (
            <div className="space-y-4">
              {/* 基本信息卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <Label className="text-sm text-gray-500">员工姓名</Label>
                  <p className="text-sm font-medium">{selectedEvaluation.employee?.name}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <Label className="text-sm text-gray-500">考核模板</Label>
                  <p className="text-sm font-medium">{selectedEvaluation.template?.name}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <Label className="text-sm text-gray-500">考核周期</Label>
                  <p className="text-sm font-medium">
                    {getPeriodLabel(selectedEvaluation.period)} {selectedEvaluation.year}
                    {selectedEvaluation.month && `年${selectedEvaluation.month}月`}
                    {selectedEvaluation.quarter && `年Q${selectedEvaluation.quarter}`}
                  </p>
                </div>
                               <div className="bg-gray-50 p-3 rounded">
                 <Label className="text-sm text-gray-500">当前状态</Label>
                 <div className="mt-1 space-y-2">
                   {getStatusBadge(selectedEvaluation.status)}
                   {/* 状态进度条 */}
                   <div className="text-xs text-gray-500">
                     <div className="flex justify-between items-center mb-1">
                       <span>流程进度</span>
                       <span>{getStatusProgress(selectedEvaluation.status).step}/{getStatusProgress(selectedEvaluation.status).total}</span>
                     </div>
                     <div className="w-full bg-gray-200 rounded-full h-1.5">
                       <div 
                         className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                         style={{
                           width: `${(getStatusProgress(selectedEvaluation.status).step / getStatusProgress(selectedEvaluation.status).total) * 100}%`
                         }}
                       />
                     </div>
                   </div>
                 </div>
               </div>
              </div>

              {/* 标签页 */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">评分详情</TabsTrigger>
                  <TabsTrigger value="summary">总结汇总</TabsTrigger>
                </TabsList>

                                 <TabsContent value="details" className="space-y-4 max-h-[50vh] overflow-y-auto">
                   {/* 自评指导和进度信息 */}
                   {canPerformAction(selectedEvaluation, 'self') && (
                     <div className="space-y-4">
                       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                         <h4 className="font-medium text-blue-900 mb-2">📝 自评指导</h4>
                         <ul className="text-sm text-blue-800 space-y-1">
                           <li>• 请根据本期间的实际工作表现进行客观评分</li>
                           <li>• 评分需要在0到满分之间，建议结合具体工作成果</li>
                           <li>• 请在评价说明中详细描述您的工作亮点和改进计划</li>
                           <li>• 完成所有项目评分后，点击&quot;完成自评&quot;提交</li>
                         </ul>
                       </div>
                       
                       {/* 评分进度 */}
                       <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                         <h4 className="font-medium text-green-900 mb-2">📊 评分进度</h4>
                         <div className="flex items-center justify-between">
                           <span className="text-sm text-green-800">
                             已完成 {scores.filter(s => s.self_score && s.self_score > 0).length} / {scores.length} 项
                           </span>
                           <div className="flex-1 mx-4 bg-green-200 rounded-full h-2">
                             <div 
                               className="bg-green-600 h-2 rounded-full transition-all duration-300"
                               style={{
                                 width: `${scores.length > 0 ? (scores.filter(s => s.self_score && s.self_score > 0).length / scores.length) * 100 : 0}%`
                               }}
                             />
                           </div>
                           <span className="text-sm font-medium text-green-900">
                             {scores.length > 0 ? Math.round((scores.filter(s => s.self_score && s.self_score > 0).length / scores.length) * 100) : 0}%
                           </span>
                         </div>
                       </div>
                                            </div>
                     )}
                   
                   {/* 上级评分指导信息 */}
                   {canPerformAction(selectedEvaluation, 'manager') && (
                     <div className="space-y-4">
                       <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                         <h4 className="font-medium text-purple-900 mb-2">👔 上级评分指导</h4>
                         <ul className="text-sm text-purple-800 space-y-1">
                           <li>• 请结合员工的自评内容和实际工作表现进行评分</li>
                           <li>• 评分应客观公正，既要认可成绩，也要指出不足</li>
                           <li>• 在评价说明中提供具体的改进建议和发展方向</li>
                           <li>• 完成所有项目评分后，点击&quot;完成主管评估&quot;提交</li>
                         </ul>
                       </div>
                       
                       {/* 评分对比和进度 */}
                       <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                         <h4 className="font-medium text-orange-900 mb-2">📈 评分对比</h4>
                         <div className="grid grid-cols-2 gap-4 text-sm">
                           <div>
                             <span className="text-orange-800">员工自评总分：</span>
                             <span className="font-semibold text-orange-900">
                               {scores.reduce((acc, score) => acc + (score.self_score || 0), 0)} 分
                             </span>
                           </div>
                           <div>
                             <span className="text-orange-800">主管评分进度：</span>
                             <span className="font-semibold text-orange-900">
                               {scores.filter(s => s.manager_score && s.manager_score > 0).length} / {scores.length} 项
                             </span>
                           </div>
                         </div>
                         <div className="mt-3">
                           <div className="flex items-center justify-between mb-1">
                             <span className="text-xs text-orange-700">主管评分完成度</span>
                             <span className="text-xs font-medium text-orange-900">
                               {scores.length > 0 ? Math.round((scores.filter(s => s.manager_score && s.manager_score > 0).length / scores.length) * 100) : 0}%
                             </span>
                           </div>
                           <div className="w-full bg-orange-200 rounded-full h-2">
                             <div 
                               className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                               style={{
                                 width: `${scores.length > 0 ? (scores.filter(s => s.manager_score && s.manager_score > 0).length / scores.length) * 100 : 0}%`
                               }}
                             />
                           </div>
                         </div>
                       </div>
                     </div>
                                        )}
                   
                   {/* HR审核指导信息 */}
                   {canPerformAction(selectedEvaluation, 'hr') && (
                     <div className="space-y-4">
                       <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                         <h4 className="font-medium text-indigo-900 mb-2">🔍 HR审核指导</h4>
                         <ul className="text-sm text-indigo-800 space-y-1">
                           <li>• 审核员工自评与上级评分的合理性和一致性</li>
                           <li>• 检查评分是否符合公司绩效标准和政策</li>
                           <li>• 确认最终评分并可进行必要的调整</li>
                           <li>• 完成审核后，评估将进入员工确认阶段</li>
                         </ul>
                       </div>
                       
                       {/* HR审核总结 */}
                       <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                         <h4 className="font-medium text-gray-900 mb-3">📊 评分汇总分析</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                           <div className="bg-white p-3 rounded border">
                             <div className="text-gray-600">员工自评总分</div>
                             <div className="text-2xl font-bold text-blue-600">
                               {scores.reduce((acc, score) => acc + (score.self_score || 0), 0)}
                             </div>
                             <div className="text-xs text-gray-500">
                               平均分：{scores.length > 0 ? (scores.reduce((acc, score) => acc + (score.self_score || 0), 0) / scores.length).toFixed(1) : 0}
                             </div>
                           </div>
                           <div className="bg-white p-3 rounded border">
                             <div className="text-gray-600">主管评分总分</div>
                             <div className="text-2xl font-bold text-purple-600">
                               {scores.reduce((acc, score) => acc + (score.manager_score || 0), 0)}
                             </div>
                             <div className="text-xs text-gray-500">
                               平均分：{scores.length > 0 ? (scores.reduce((acc, score) => acc + (score.manager_score || 0), 0) / scores.length).toFixed(1) : 0}
                             </div>
                           </div>
                           <div className="bg-white p-3 rounded border">
                             <div className="text-gray-600">评分差异分析</div>
                             <div className="text-2xl font-bold text-orange-600">
                               {Math.abs(scores.reduce((acc, score) => acc + (score.self_score || 0), 0) - scores.reduce((acc, score) => acc + (score.manager_score || 0), 0))}
                             </div>
                             <div className="text-xs text-gray-500">
                               自评与主管评分差值
                             </div>
                           </div>
                         </div>
                         
                         {/* 差异分析提示 */}
                         {Math.abs(scores.reduce((acc, score) => acc + (score.self_score || 0), 0) - scores.reduce((acc, score) => acc + (score.manager_score || 0), 0)) > 10 && (
                           <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                             <div className="text-sm text-yellow-800">
                               ⚠️ <strong>注意：</strong>员工自评与主管评分存在较大差异，建议重点关注并在最终评分中做出合理调整。
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                   )}
                   
                   {scores.map((score) => (
                    <Card key={score.id} className="border">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* 项目信息 */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-lg">{score.item?.name}</h4>
                              <p className="text-sm text-muted-foreground">{score.item?.description}</p>
                              <p className="text-sm text-muted-foreground">满分：{score.item?.max_score}</p>
                            </div>
                            <div className="text-center sm:text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {score.final_score || score.manager_score || score.self_score || 0}
                              </div>
                              <div className="text-sm text-muted-foreground">当前得分</div>
                            </div>
                          </div>
                          
                          {/* 评分区域 */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* 自评区域 */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center h-6">
                                自评分数
                                {canPerformAction(selectedEvaluation, 'self') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2 h-6 w-6 p-0"
                                    onClick={() => handleStartEdit(score.id, score.self_score, score.self_comment)}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </Label>
                              
                              {editingScore === score.id && canPerformAction(selectedEvaluation, 'self') ? (
                                <div className="space-y-2">
                                  <Input
                                    type="number"
                                    value={tempScore}
                                    onChange={(e) => setTempScore(Number(e.target.value))}
                                    min={0}
                                    max={score.item?.max_score}
                                    placeholder="评分"
                                  />
                                  <Textarea
                                    value={tempComment}
                                    onChange={(e) => setTempComment(e.target.value)}
                                    placeholder="评价说明"
                                    rows={3}
                                  />
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveScore(score.id, 'self')}
                                    >
                                      <Save className="w-3 h-3 mr-1" />
                                      保存
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      取消
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="text-sm font-medium">{score.self_score || '未评分'}</div>
                                  <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded mt-1">
                                    {score.self_comment || '暂无说明'}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 主管评分区域 */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center h-6">
                                主管评分
                                {canPerformAction(selectedEvaluation, 'manager') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2 h-6 w-6 p-0"
                                    onClick={() => handleStartEdit(score.id, score.manager_score, score.manager_comment)}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </Label>
                              
                              {editingScore === score.id && canPerformAction(selectedEvaluation, 'manager') ? (
                                <div className="space-y-2">
                                  <div className="space-y-2">
                                    <Input
                                      type="number"
                                      value={tempScore}
                                      onChange={(e) => setTempScore(Number(e.target.value))}
                                      min={0}
                                      max={score.item?.max_score}
                                      placeholder="评分"
                                    />
                                    {/* 评分参考标准 */}
                                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                      <div className="font-medium mb-1">评分参考：</div>
                                      <div className="space-y-1">
                                        <div>优秀 ({Math.round((score.item?.max_score || 0) * 0.9)}-{score.item?.max_score}分)：超额完成目标，表现突出</div>
                                        <div>良好 ({Math.round((score.item?.max_score || 0) * 0.7)}-{Math.round((score.item?.max_score || 0) * 0.89)}分)：较好完成目标，有一定亮点</div>
                                        <div>合格 ({Math.round((score.item?.max_score || 0) * 0.6)}-{Math.round((score.item?.max_score || 0) * 0.69)}分)：基本完成目标，符合要求</div>
                                        <div>需改进 (0-{Math.round((score.item?.max_score || 0) * 0.59)}分)：未达成目标，需要改进</div>
                                      </div>
                                      <div className="mt-2 text-blue-600">
                                        员工自评：{score.self_score || 0}分
                                      </div>
                                    </div>
                                  </div>
                                  <Textarea
                                    value={tempComment}
                                    onChange={(e) => setTempComment(e.target.value)}
                                    placeholder="评价说明（请结合员工自评内容，提供具体的改进建议和发展方向）"
                                    rows={4}
                                  />
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveScore(score.id, 'manager')}
                                    >
                                      <Save className="w-3 h-3 mr-1" />
                                      保存
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      取消
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="text-sm font-medium">{score.manager_score || '未评分'}</div>
                                  <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded mt-1">
                                    {score.manager_comment || '暂无说明'}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 最终得分区域 */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center h-6">
                                最终得分
                                {canPerformAction(selectedEvaluation, 'hr') && !score.final_score && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2 h-6 w-6 p-0"
                                    onClick={() => handleStartEdit(score.id, score.manager_score, '')}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </Label>
                              
                              {editingScore === score.id && canPerformAction(selectedEvaluation, 'hr') ? (
                                <div className="space-y-2">
                                  <div className="space-y-2">
                                    <Input
                                      type="number"
                                      value={tempScore}
                                      onChange={(e) => setTempScore(Number(e.target.value))}
                                      min={0}
                                      max={score.item?.max_score}
                                      placeholder="最终评分"
                                    />
                                    {/* HR最终评分参考 */}
                                    <div className="text-xs text-gray-500 bg-indigo-50 p-2 rounded border border-indigo-200">
                                      <div className="font-medium mb-1">最终评分参考：</div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>员工自评：{score.self_score || 0}分</div>
                                        <div>主管评分：{score.manager_score || 0}分</div>
                                      </div>
                                      <div className="mt-2 text-indigo-700">
                                        💡 建议：通常采用主管评分作为最终得分，如有争议可适当调整
                                      </div>
                                    </div>
                                  </div>
                                  <Textarea
                                    value={tempComment}
                                    onChange={(e) => setTempComment(e.target.value)}
                                    placeholder="HR审核备注（可选）"
                                    rows={2}
                                  />
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        // HR确认最终得分
                                        handleSaveScore(score.id, 'manager'); // 临时使用manager类型，实际应该是final
                                      }}
                                    >
                                      <Save className="w-3 h-3 mr-1" />
                                      确认最终得分
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      取消
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-600">
                                    {score.final_score || score.manager_score || '未评分'}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {score.final_score ? '已确认' : canPerformAction(selectedEvaluation, 'hr') ? '待HR确认' : '等待确认'}
                                  </div>
                                </div>
                              )}
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
                            {scores.reduce((acc, score) => acc + (score.final_score || score.manager_score || score.self_score || 0), 0)}
                          </div>
                          <p className="text-muted-foreground">
                            满分 {scores.reduce((acc, score) => acc + (score.item?.max_score || 0), 0)} 分
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-semibold">
                              {scores.reduce((acc, score) => acc + (score.self_score || 0), 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">自评总分</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold">
                              {scores.reduce((acc, score) => acc + (score.manager_score || 0), 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">主管评分</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold">
                              {scores.reduce((acc, score) => acc + (score.final_score || 0), 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">最终得分</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* 流程控制按钮 */}
                             <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 sm:gap-0 border-t pt-4">
                 {canPerformAction(selectedEvaluation, 'self') && (
                   <Button 
                     onClick={() => handleCompleteStage(selectedEvaluation.id, 'self')} 
                     className="w-full sm:w-auto"
                     disabled={isSubmittingSelfEvaluation}
                   >
                     {isSubmittingSelfEvaluation ? '提交中...' : '完成自评'}
                   </Button>
                 )}
                 {canPerformAction(selectedEvaluation, 'manager') && (
                   <Button onClick={() => handleCompleteStage(selectedEvaluation.id, 'manager')} className="w-full sm:w-auto">
                     完成主管评估
                   </Button>
                 )}
                 {canPerformAction(selectedEvaluation, 'hr') && (
                   <Button onClick={() => handleCompleteStage(selectedEvaluation.id, 'hr')} className="w-full sm:w-auto">
                     完成HR审核
                   </Button>
                 )}
                 {canPerformAction(selectedEvaluation, 'confirm') && (
                   <Button onClick={() => handleCompleteStage(selectedEvaluation.id, 'confirm')} className="w-full sm:w-auto">
                     确认最终得分
                   </Button>
                 )}
                 <Button variant="outline" onClick={() => setScoreDialogOpen(false)} className="w-full sm:w-auto">
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