"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Shield, 
  Database, 
  Bell, 
  Key,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { type SystemSettings, type Message } from "@/lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    // 系统设置
    system_name: "DooTask KPI 绩效管理系统",
    system_version: "1.0.0",
    company_name: "示例公司",
    company_logo: "",
    timezone: "Asia/Shanghai",
    language: "zh-CN",
    date_format: "YYYY-MM-DD",
    
    // 评估设置
    evaluation_auto_create: true,
    evaluation_reminder_days: 3,
    evaluation_timeout_days: 7,
    allow_self_evaluation: true,
    require_manager_approval: true,
    require_hr_approval: true,
    allow_evaluation_comments: true,
    
    // 通知设置
    notification_enabled: true,
    email_notifications: true,
    system_notifications: true,
    reminder_notifications: true,
    
    // 安全设置
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_symbols: false,
    session_timeout: 30,
    max_login_attempts: 5,
    
    // 数据设置
    data_retention_months: 24,
    backup_enabled: true,
    backup_frequency: "daily",
    export_format: "xlsx"
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>({ type: '', content: '' });

  // 保存设置
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // 模拟保存设置
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', content: '设置保存成功！' });
      setTimeout(() => setMessage({ type: '', content: '' }), 3000);
    } catch {
      setMessage({ type: 'error', content: '保存设置失败，请重试。' });
    } finally {
      setLoading(false);
    }
  };

  // 重置设置
  const handleResetSettings = () => {
    if (confirm('确定要重置所有设置吗？这将恢复系统默认配置。')) {
      setSettings({
        system_name: "DooTask KPI 绩效管理系统",
        system_version: "1.0.0",
        company_name: "示例公司",
        company_logo: "",
        timezone: "Asia/Shanghai",
        language: "zh-CN",
        date_format: "YYYY-MM-DD",
        evaluation_auto_create: true,
        evaluation_reminder_days: 3,
        evaluation_timeout_days: 7,
        allow_self_evaluation: true,
        require_manager_approval: true,
        require_hr_approval: true,
        allow_evaluation_comments: true,
        notification_enabled: true,
        email_notifications: true,
        system_notifications: true,
        reminder_notifications: true,
        password_min_length: 8,
        password_require_uppercase: true,
        password_require_lowercase: true,
        password_require_numbers: true,
        password_require_symbols: false,
        session_timeout: 30,
        max_login_attempts: 5,
        data_retention_months: 24,
        backup_enabled: true,
        backup_frequency: "daily",
        export_format: "xlsx"
      });
      setMessage({ type: 'success', content: '设置已重置为默认值。' });
    }
  };

  // 导出配置
  const handleExportConfig = () => {
    const configData = JSON.stringify(settings, null, 2);
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kpi-system-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', content: '配置文件已导出。' });
  };

  // 导入配置
  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings({ ...settings, ...importedSettings });
          setMessage({ type: 'success', content: '配置文件导入成功。' });
        } catch {
          setMessage({ type: 'error', content: '配置文件格式错误。' });
        }
      };
      reader.readAsText(file);
    }
  };

  // 数据库备份
  const handleBackupDatabase = async () => {
    setLoading(true);
    try {
      // 模拟备份操作
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage({ type: 'success', content: '数据库备份完成。' });
    } catch {
      setMessage({ type: 'error', content: '备份失败，请重试。' });
    } finally {
      setLoading(false);
    }
  };

  // 清理数据
  const handleCleanupData = async () => {
    if (confirm('确定要清理过期数据吗？此操作无法撤销。')) {
      setLoading(true);
      try {
        // 模拟清理操作
        await new Promise(resolve => setTimeout(resolve, 1500));
        setMessage({ type: 'success', content: '数据清理完成。' });
      } catch {
        setMessage({ type: 'error', content: '数据清理失败。' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-600 mt-2">管理系统配置和参数</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleResetSettings}>
            <RefreshCw className="w-4 h-4 mr-2" />
            重置设置
          </Button>
          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            保存设置
          </Button>
        </div>
      </div>

      {/* 消息提示 */}
      {message.content && (
        <Alert className={message.type === 'success' ? 'border-green-500' : 'border-red-500'}>
          {message.type === 'success' ? 
            <CheckCircle className="h-4 w-4" /> : 
            <AlertCircle className="h-4 w-4" />
          }
          <AlertDescription>{message.content}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">基本设置</TabsTrigger>
          <TabsTrigger value="evaluation">评估设置</TabsTrigger>
          <TabsTrigger value="notification">通知设置</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
          <TabsTrigger value="data">数据管理</TabsTrigger>
        </TabsList>

        {/* 基本设置 */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                系统基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="system_name">系统名称</Label>
                  <Input
                    id="system_name"
                    value={settings.system_name}
                    onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="system_version">系统版本</Label>
                  <Input
                    id="system_version"
                    value={settings.system_version}
                    disabled
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="company_name">公司名称</Label>
                  <Input
                    id="company_name"
                    value={settings.company_name}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="company_logo">公司Logo URL</Label>
                  <Input
                    id="company_logo"
                    value={settings.company_logo}
                    onChange={(e) => setSettings({ ...settings, company_logo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="timezone">时区</Label>
                  <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Shanghai">Asia/Shanghai (UTC+8)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                      <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="language">语言</Label>
                  <Select value={settings.language} onValueChange={(value) => setSettings({ ...settings, language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">中文（简体）</SelectItem>
                      <SelectItem value="zh-TW">中文（繁体）</SelectItem>
                      <SelectItem value="en-US">English</SelectItem>
                      <SelectItem value="ja-JP">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 评估设置 */}
        <TabsContent value="evaluation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                评估流程设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="evaluation_auto_create">自动创建评估</Label>
                  <Switch
                    id="evaluation_auto_create"
                    checked={settings.evaluation_auto_create}
                    onCheckedChange={(checked) => setSettings({ ...settings, evaluation_auto_create: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow_self_evaluation">允许员工自评</Label>
                  <Switch
                    id="allow_self_evaluation"
                    checked={settings.allow_self_evaluation}
                    onCheckedChange={(checked) => setSettings({ ...settings, allow_self_evaluation: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="require_manager_approval">需要主管审批</Label>
                  <Switch
                    id="require_manager_approval"
                    checked={settings.require_manager_approval}
                    onCheckedChange={(checked) => setSettings({ ...settings, require_manager_approval: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="require_hr_approval">需要HR审批</Label>
                  <Switch
                    id="require_hr_approval"
                    checked={settings.require_hr_approval}
                    onCheckedChange={(checked) => setSettings({ ...settings, require_hr_approval: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow_evaluation_comments">允许评估备注</Label>
                  <Switch
                    id="allow_evaluation_comments"
                    checked={settings.allow_evaluation_comments}
                    onCheckedChange={(checked) => setSettings({ ...settings, allow_evaluation_comments: checked })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="evaluation_reminder_days">评估提醒天数</Label>
                  <Input
                    id="evaluation_reminder_days"
                    type="number"
                    value={settings.evaluation_reminder_days}
                    onChange={(e) => setSettings({ ...settings, evaluation_reminder_days: parseInt(e.target.value) })}
                    min="1"
                    max="30"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="evaluation_timeout_days">评估超时天数</Label>
                  <Input
                    id="evaluation_timeout_days"
                    type="number"
                    value={settings.evaluation_timeout_days}
                    onChange={(e) => setSettings({ ...settings, evaluation_timeout_days: parseInt(e.target.value) })}
                    min="1"
                    max="90"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置 */}
        <TabsContent value="notification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                通知设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notification_enabled">启用通知</Label>
                  <Switch
                    id="notification_enabled"
                    checked={settings.notification_enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, notification_enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email_notifications">邮件通知</Label>
                  <Switch
                    id="email_notifications"
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="system_notifications">系统通知</Label>
                  <Switch
                    id="system_notifications"
                    checked={settings.system_notifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, system_notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="reminder_notifications">提醒通知</Label>
                  <Switch
                    id="reminder_notifications"
                    checked={settings.reminder_notifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, reminder_notifications: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全设置 */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                密码策略
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password_min_length">最小密码长度</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    value={settings.password_min_length}
                    onChange={(e) => setSettings({ ...settings, password_min_length: parseInt(e.target.value) })}
                    min="6"
                    max="32"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="session_timeout">会话超时（分钟）</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) })}
                    min="5"
                    max="480"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password_require_uppercase">需要大写字母</Label>
                  <Switch
                    id="password_require_uppercase"
                    checked={settings.password_require_uppercase}
                    onCheckedChange={(checked) => setSettings({ ...settings, password_require_uppercase: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password_require_lowercase">需要小写字母</Label>
                  <Switch
                    id="password_require_lowercase"
                    checked={settings.password_require_lowercase}
                    onCheckedChange={(checked) => setSettings({ ...settings, password_require_lowercase: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password_require_numbers">需要数字</Label>
                  <Switch
                    id="password_require_numbers"
                    checked={settings.password_require_numbers}
                    onCheckedChange={(checked) => setSettings({ ...settings, password_require_numbers: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password_require_symbols">需要特殊字符</Label>
                  <Switch
                    id="password_require_symbols"
                    checked={settings.password_require_symbols}
                    onCheckedChange={(checked) => setSettings({ ...settings, password_require_symbols: checked })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="max_login_attempts">最大登录尝试次数</Label>
                <Input
                  id="max_login_attempts"
                  type="number"
                  value={settings.max_login_attempts}
                  onChange={(e) => setSettings({ ...settings, max_login_attempts: parseInt(e.target.value) })}
                  min="3"
                  max="10"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 数据管理 */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                数据管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="data_retention_months">数据保留时间（月）</Label>
                  <Input
                    id="data_retention_months"
                    type="number"
                    value={settings.data_retention_months}
                    onChange={(e) => setSettings({ ...settings, data_retention_months: parseInt(e.target.value) })}
                    min="1"
                    max="120"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="export_format">导出格式</Label>
                  <Select value={settings.export_format} onValueChange={(value) => setSettings({ ...settings, export_format: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                      <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="backup_enabled">启用自动备份</Label>
                  <Switch
                    id="backup_enabled"
                    checked={settings.backup_enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, backup_enabled: checked })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="backup_frequency">备份频率</Label>
                  <Select value={settings.backup_frequency} onValueChange={(value) => setSettings({ ...settings, backup_frequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">每天</SelectItem>
                      <SelectItem value="weekly">每周</SelectItem>
                      <SelectItem value="monthly">每月</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>数据操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>配置管理</Label>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleExportConfig}>
                      <Download className="w-4 h-4 mr-1" />
                      导出配置
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('config-import')?.click()}>
                      <Upload className="w-4 h-4 mr-1" />
                      导入配置
                    </Button>
                    <input
                      id="config-import"
                      type="file"
                      accept=".json"
                      onChange={handleImportConfig}
                      className="hidden"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>数据库操作</Label>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleBackupDatabase} disabled={loading}>
                      <Database className="w-4 h-4 mr-1" />
                      立即备份
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCleanupData} disabled={loading}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      清理数据
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 