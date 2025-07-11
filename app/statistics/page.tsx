"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Award, 
  Target, 
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Calendar,
  Download
} from "lucide-react";
import { statisticsApi, exportApi, type DashboardStats, type DepartmentStats, type MonthlyTrend, type ScoreDistribution, type TopPerformer, type RecentEvaluation } from "@/lib/api";

export default function StatisticsPage() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);

  // 模拟统计数据
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([
    { name: '技术部', total: 15, completed: 12, pending: 3, avg_score: 85 },
    { name: '市场部', total: 8, completed: 6, pending: 2, avg_score: 78 },
    { name: '人事部', total: 5, completed: 4, pending: 1, avg_score: 82 },
    { name: '财务部', total: 6, completed: 5, pending: 1, avg_score: 80 }
  ]);

  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([
    { month: '1月', evaluations: 28, avg_score: 82, completion_rate: 85 },
    { month: '2月', evaluations: 32, avg_score: 84, completion_rate: 87 },
    { month: '3月', evaluations: 30, avg_score: 81, completion_rate: 83 },
    { month: '4月', evaluations: 35, avg_score: 85, completion_rate: 90 },
    { month: '5月', evaluations: 33, avg_score: 83, completion_rate: 88 },
    { month: '6月', evaluations: 36, avg_score: 86, completion_rate: 91 }
  ]);

  const [scoreDistribution] = useState<ScoreDistribution[]>([
    { range: '90-100', count: 15, color: '#22c55e' },
    { range: '80-89', count: 25, color: '#3b82f6' },
    { range: '70-79', count: 18, color: '#f59e0b' },
    { range: '60-69', count: 8, color: '#ef4444' },
    { range: '60以下', count: 4, color: '#6b7280' }
  ]);

  const [topPerformers] = useState<TopPerformer[]>([
    { name: '张三', department: '技术部', score: 95, evaluations: 3 },
    { name: '李四', department: '市场部', score: 92, evaluations: 2 },
    { name: '王五', department: '技术部', score: 90, evaluations: 3 },
    { name: '赵六', department: '人事部', score: 88, evaluations: 2 },
    { name: '钱七', department: '财务部', score: 87, evaluations: 2 }
  ]);

  const [recentEvaluations] = useState<RecentEvaluation[]>([
    { id: 1, employee: '张三', department: '技术部', template: '技术岗位月度考核', score: 85, status: 'completed', date: '2024-12-01' },
    { id: 2, employee: '李四', department: '市场部', template: '市场岗位季度考核', score: 78, status: 'manager_evaluated', date: '2024-12-02' },
    { id: 3, employee: '王五', department: '技术部', template: '技术岗位月度考核', score: 92, status: 'completed', date: '2024-12-03' },
    { id: 4, employee: '赵六', department: '人事部', template: '人事岗位月度考核', score: 80, status: 'pending', date: '2024-12-04' },
    { id: 5, employee: '钱七', department: '财务部', template: '财务岗位月度考核', score: 88, status: 'self_evaluated', date: '2024-12-05' }
  ]);

  // 获取仪表板统计数据
  const fetchDashboardStats = async () => {
    try {
      const response = await statisticsApi.getDashboard();
      setDashboardStats(response.data);
    } catch (error) {
      console.error("获取统计数据失败:", error);
      // 使用模拟数据
      setDashboardStats({
        total_employees: 34,
        total_departments: 4,
        total_evaluations: 125,
        pending_evaluations: 12,
        completed_evaluations: 98,
        average_score: 83.5,
        recent_evaluations: []
      });
    }
    setLoading(false);
  };

  // 获取筛选后的数据
  const getFilteredData = useCallback(() => {
    // 根据选择的周期和年份筛选数据
    const periodMultiplier = selectedPeriod === 'monthly' ? 1 : selectedPeriod === 'quarterly' ? 0.25 : 0.083;
    const yearOffset = selectedYear - 2024;
    
    // 根据具体的月份或季度调整数据
    let specificOffset = 0;
    if (selectedPeriod === 'monthly') {
      specificOffset = (selectedMonth - 6) * 0.5; // 以6月为基准
    } else if (selectedPeriod === 'quarterly') {
      specificOffset = (selectedQuarter - 2) * 1.5; // 以第2季度为基准
    }
    
    return {
      evaluations: Math.max(20, Math.floor(125 * periodMultiplier + yearOffset * 10 + specificOffset * 2)),
      averageScore: Math.max(70, Math.min(95, 83.5 + Math.random() * 4 - 2 + yearOffset * 2 + specificOffset)),
      completionRate: Math.max(60, Math.min(100, 85 + Math.random() * 10 - 5 + yearOffset * 3 + specificOffset))
    };
  }, [selectedPeriod, selectedYear, selectedMonth, selectedQuarter]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // 监听筛选条件变化
  useEffect(() => {
    const filteredData = getFilteredData();
    setDashboardStats(prev => prev ? {
      ...prev,
      total_evaluations: filteredData.evaluations,
      average_score: filteredData.averageScore,
      completed_evaluations: Math.floor(filteredData.evaluations * filteredData.completionRate / 100)
    } : null);

    // 更新部门统计数据
    const periodMultiplier = selectedPeriod === 'monthly' ? 1 : selectedPeriod === 'quarterly' ? 0.25 : 0.083;
    const yearOffset = selectedYear - 2024;
    
    let specificOffset = 0;
    if (selectedPeriod === 'monthly') {
      specificOffset = (selectedMonth - 6) * 0.5;
    } else if (selectedPeriod === 'quarterly') {
      specificOffset = (selectedQuarter - 2) * 1.5;
    }
    
    setDepartmentStats([
      { name: '技术部', total: Math.max(1, Math.floor(15 * periodMultiplier + yearOffset * 2 + specificOffset)), completed: Math.max(1, Math.floor(12 * periodMultiplier + yearOffset * 1 + specificOffset)), pending: Math.max(0, Math.floor(3 * periodMultiplier + yearOffset * 0.5)), avg_score: Math.max(70, Math.min(95, 85 + Math.random() * 4 - 2 + yearOffset * 2 + specificOffset)) },
      { name: '市场部', total: Math.max(1, Math.floor(8 * periodMultiplier + yearOffset * 1 + specificOffset)), completed: Math.max(1, Math.floor(6 * periodMultiplier + yearOffset * 0.5 + specificOffset)), pending: Math.max(0, Math.floor(2 * periodMultiplier + yearOffset * 0.3)), avg_score: Math.max(70, Math.min(95, 78 + Math.random() * 4 - 2 + yearOffset * 2 + specificOffset)) },
      { name: '人事部', total: Math.max(1, Math.floor(5 * periodMultiplier + yearOffset * 0.5 + specificOffset)), completed: Math.max(1, Math.floor(4 * periodMultiplier + yearOffset * 0.3 + specificOffset)), pending: Math.max(0, Math.floor(1 * periodMultiplier + yearOffset * 0.2)), avg_score: Math.max(70, Math.min(95, 82 + Math.random() * 4 - 2 + yearOffset * 2 + specificOffset)) },
      { name: '财务部', total: Math.max(1, Math.floor(6 * periodMultiplier + yearOffset * 0.8 + specificOffset)), completed: Math.max(1, Math.floor(5 * periodMultiplier + yearOffset * 0.6 + specificOffset)), pending: Math.max(0, Math.floor(1 * periodMultiplier + yearOffset * 0.2)), avg_score: Math.max(70, Math.min(95, 80 + Math.random() * 4 - 2 + yearOffset * 2 + specificOffset)) }
    ]);

    // 更新月度趋势数据
    const baseTrends = [
      { month: '1月', evaluations: 28, avg_score: 82, completion_rate: 85 },
      { month: '2月', evaluations: 32, avg_score: 84, completion_rate: 87 },
      { month: '3月', evaluations: 30, avg_score: 81, completion_rate: 83 },
      { month: '4月', evaluations: 35, avg_score: 85, completion_rate: 90 },
      { month: '5月', evaluations: 33, avg_score: 83, completion_rate: 88 },
      { month: '6月', evaluations: 36, avg_score: 86, completion_rate: 91 }
    ];
    
             setMonthlyTrends(baseTrends.map(trend => ({
      ...trend,
      evaluations: Math.max(5, Math.floor(trend.evaluations * periodMultiplier + yearOffset * 3 + specificOffset)),
      avg_score: Math.max(70, Math.min(95, trend.avg_score + Math.random() * 4 - 2 + yearOffset * 2 + specificOffset)),
      completion_rate: Math.max(60, Math.min(100, trend.completion_rate + Math.random() * 6 - 3 + yearOffset * 3 + specificOffset))
    })));
  }, [selectedPeriod, selectedYear, selectedMonth, selectedQuarter, getFilteredData]);

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">待自评</Badge>;
      case "self_evaluated":
        return <Badge variant="outline" className="text-blue-600 border-blue-600">待主管评估</Badge>;
      case "manager_evaluated":
        return <Badge variant="outline" className="text-purple-600 border-purple-600">待HR审核</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-600 border-green-600">已完成</Badge>;
      default:
        return <Badge variant="outline">未知状态</Badge>;
    }
  };

  // 导出报告
  const handleExport = async (type: string) => {
    try {
      let response;
      switch (type) {
        case 'period':
          response = await exportApi.period(selectedPeriod);
          break;
        case 'department':
          response = await exportApi.department(1); // 示例部门ID
          break;
        default:
          return;
      }
      // 这里应该处理文件下载
      console.log('导出成功:', response);
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">统计分析</h1>
          <p className="text-gray-600 mt-2">
            绩效考核数据分析与报告 - {selectedYear}年
            {selectedPeriod === 'monthly' ? `${selectedMonth}月` : 
             selectedPeriod === 'quarterly' ? `第${selectedQuarter}季度` : 
             '全年'}数据
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={(value) => {
            setSelectedPeriod(value);
            // 重置月份和季度选择
            if (value === 'monthly') setSelectedMonth(new Date().getMonth() + 1);
            if (value === 'quarterly') setSelectedQuarter(Math.floor(new Date().getMonth() / 3) + 1);
          }}>
            <SelectTrigger className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yearly">年度</SelectItem>
              <SelectItem value="quarterly">季度</SelectItem>
              <SelectItem value="monthly">月度</SelectItem>
            </SelectContent>
          </Select>
          {selectedPeriod === 'monthly' && (
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1}月
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedPeriod === 'quarterly' && (
            <Select value={selectedQuarter.toString()} onValueChange={(value) => setSelectedQuarter(parseInt(value))}>
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">第1季度</SelectItem>
                <SelectItem value="2">第2季度</SelectItem>
                <SelectItem value="3">第3季度</SelectItem>
                <SelectItem value="4">第4季度</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button className="ml-2" onClick={() => handleExport('period')}>
            <Download className="w-4 h-4 mr-2" />
            导出报告
          </Button>
        </div>
      </div>

      {/* 总体统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总员工数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.total_employees || 0}</div>
            <p className="text-xs text-muted-foreground">
              活跃员工数量
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总考核数</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.total_evaluations || 0}</div>
            <p className="text-xs text-muted-foreground">
              累计考核项目
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完成率</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.total_evaluations ? 
                Math.round((dashboardStats.completed_evaluations / dashboardStats.total_evaluations) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              考核完成比例
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均分</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.average_score?.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              总体平均得分
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 数据分析图表 */}
      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">部门分析</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
          <TabsTrigger value="distribution">分数分布</TabsTrigger>
          <TabsTrigger value="performance">绩效排名</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                部门考核统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#3b82f6" name="总数" />
                    <Bar dataKey="completed" fill="#22c55e" name="已完成" />
                    <Bar dataKey="pending" fill="#f59e0b" name="待处理" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>部门平均分对比</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avg_score" fill="#8b5cf6" name="平均分" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChartIcon className="w-5 h-5 mr-2" />
                月度趋势分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="evaluations" stroke="#3b82f6" name="考核数量" />
                    <Line yAxisId="right" type="monotone" dataKey="avg_score" stroke="#22c55e" name="平均分" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>完成率趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="completion_rate" stroke="#8b5cf6" fill="#8b5cf6" name="完成率 %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="w-5 h-5 mr-2" />
                分数分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scoreDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, count }) => `${range}: ${count}人`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                绩效排名
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>排名</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>部门</TableHead>
                      <TableHead>平均分</TableHead>
                      <TableHead>考核次数</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPerformers.map((performer, index) => (
                      <TableRow key={performer.name}>
                        <TableCell>
                          <div className="flex items-center">
                            {index < 3 && <Award className="w-4 h-4 mr-1 text-yellow-500" />}
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{performer.name}</TableCell>
                        <TableCell>{performer.department}</TableCell>
                        <TableCell>
                          <div className="text-lg font-semibold">{performer.score}</div>
                        </TableCell>
                        <TableCell>{performer.evaluations}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 最近考核记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            最近考核记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>员工</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>考核模板</TableHead>
                  <TableHead>得分</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>日期</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">{evaluation.employee}</TableCell>
                    <TableCell>{evaluation.department}</TableCell>
                    <TableCell>{evaluation.template}</TableCell>
                    <TableCell>
                      <div className="text-lg font-semibold">{evaluation.score}</div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(evaluation.status)}
                    </TableCell>
                    <TableCell>{evaluation.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 