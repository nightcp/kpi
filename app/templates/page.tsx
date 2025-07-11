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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, ClipboardList, Settings, Eye } from "lucide-react";
import { templateApi, type KPITemplate, type KPIItem } from "@/lib/api";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<KPITemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<KPITemplate | null>(null);
  const [items, setItems] = useState<KPIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<KPITemplate | null>(null);
  const [editingItem, setEditingItem] = useState<KPIItem | null>(null);
  const [templateFormData, setTemplateFormData] = useState({
    name: "",
    description: "",
    period: "monthly"
  });
  const [itemFormData, setItemFormData] = useState({
    name: "",
    description: "",
    max_score: 0,
    order: 1
  });

  // 获取模板列表
  const fetchTemplates = async () => {
    try {
      const response = await templateApi.getAll();
      setTemplates(response.data || []);
    } catch (error) {
      console.error("获取模板列表失败:", error);
      // 模拟数据
      setTemplates([
        { id: 1, name: "技术岗位月度考核", description: "适用于技术人员的月度绩效考核", period: "monthly", is_active: true, created_at: "2024-01-01T00:00:00Z" },
        { id: 2, name: "市场岗位季度考核", description: "适用于市场人员的季度绩效考核", period: "quarterly", is_active: true, created_at: "2024-01-01T00:00:00Z" },
        { id: 3, name: "管理岗位年度考核", description: "适用于管理人员的年度绩效考核", period: "yearly", is_active: true, created_at: "2024-01-01T00:00:00Z" }
      ]);
    }
    setLoading(false);
  };

  // 获取模板的KPI项目
  const fetchTemplateItems = async (templateId: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/templates/${templateId}/items`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.data || []);
      }
    } catch (error) {
      console.error("获取KPI项目失败:", error);
      // 模拟数据
      if (templateId === 1) {
        setItems([
          { id: 1, template_id: 1, name: "代码质量", description: "代码规范性、可维护性评估", max_score: 20, order: 1, created_at: "2024-01-01T00:00:00Z" },
          { id: 2, template_id: 1, name: "任务完成度", description: "按时完成分配的开发任务", max_score: 25, order: 2, created_at: "2024-01-01T00:00:00Z" },
          { id: 3, template_id: 1, name: "技术创新", description: "技术方案创新和改进", max_score: 15, order: 3, created_at: "2024-01-01T00:00:00Z" },
          { id: 4, template_id: 1, name: "团队协作", description: "与团队成员的协作配合", max_score: 20, order: 4, created_at: "2024-01-01T00:00:00Z" },
          { id: 5, template_id: 1, name: "学习成长", description: "技术学习和个人提升", max_score: 20, order: 5, created_at: "2024-01-01T00:00:00Z" }
        ]);
      } else {
        setItems([]);
      }
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // 创建或更新模板
  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTemplate 
        ? `http://localhost:8080/api/templates/${editingTemplate.id}`
        : "http://localhost:8080/api/templates";
      
      const method = editingTemplate ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateFormData),
      });

      if (response.ok) {
        fetchTemplates();
        setTemplateDialogOpen(false);
        setEditingTemplate(null);
        setTemplateFormData({ name: "", description: "", period: "monthly" });
      }
    } catch (error) {
      console.error("保存模板失败:", error);
    }
  };

  // 创建或更新KPI项目
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    
    try {
      const url = editingItem 
        ? `http://localhost:8080/api/items/${editingItem.id}`
        : "http://localhost:8080/api/items";
      
      const method = editingItem ? "PUT" : "POST";
      
      const submitData = {
        ...itemFormData,
        template_id: selectedTemplate.id
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        fetchTemplateItems(selectedTemplate.id);
        setItemDialogOpen(false);
        setEditingItem(null);
        setItemFormData({ name: "", description: "", max_score: 0, order: 1 });
      }
    } catch (error) {
      console.error("保存KPI项目失败:", error);
    }
  };

  // 删除模板
  const handleDeleteTemplate = async (id: number) => {
    if (confirm("确定要删除这个模板吗？")) {
      try {
        const response = await fetch(`http://localhost:8080/api/templates/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchTemplates();
          if (selectedTemplate?.id === id) {
            setSelectedTemplate(null);
            setItems([]);
          }
        }
      } catch (error) {
        console.error("删除模板失败:", error);
      }
    }
  };

  // 删除KPI项目
  const handleDeleteItem = async (id: number) => {
    if (confirm("确定要删除这个KPI项目吗？")) {
      try {
        const response = await fetch(`http://localhost:8080/api/items/${id}`, {
          method: "DELETE",
        });
        if (response.ok && selectedTemplate) {
          fetchTemplateItems(selectedTemplate.id);
        }
      } catch (error) {
        console.error("删除KPI项目失败:", error);
      }
    }
  };

  // 选择模板并加载其KPI项目
  const handleSelectTemplate = (template: KPITemplate) => {
    setSelectedTemplate(template);
    fetchTemplateItems(template.id);
  };

  // 打开编辑模板对话框
  const handleEditTemplate = (template: KPITemplate) => {
    setEditingTemplate(template);
    setTemplateFormData({
      name: template.name,
      description: template.description,
      period: template.period
    });
    setTemplateDialogOpen(true);
  };

  // 打开编辑KPI项目对话框
  const handleEditItem = (item: KPIItem) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      description: item.description,
      max_score: item.max_score,
      order: item.order
    });
    setItemDialogOpen(true);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "monthly": return "月度";
      case "quarterly": return "季度";
      case "yearly": return "年度";
      default: return period;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">KPI模板管理</h1>
          <p className="text-gray-600 mt-2">创建和管理KPI考核模板</p>
        </div>
        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              创建模板
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "编辑模板" : "创建模板"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleTemplateSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">模板名称</Label>
                <Input
                  id="name"
                  value={templateFormData.name}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">模板描述</Label>
                <Input
                  id="description"
                  value={templateFormData.description}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="period">考核周期</Label>
                <Select value={templateFormData.period} onValueChange={(value) => setTemplateFormData({ ...templateFormData, period: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择考核周期" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">月度</SelectItem>
                    <SelectItem value="quarterly">季度</SelectItem>
                    <SelectItem value="yearly">年度</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">
                  {editingTemplate ? "更新" : "创建"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">模板列表</TabsTrigger>
          <TabsTrigger value="items" disabled={!selectedTemplate}>
            KPI项目 {selectedTemplate && `(${selectedTemplate.name})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="w-5 h-5 mr-2" />
                模板列表
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">加载中...</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无模板数据
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>模板名称</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>考核周期</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>{template.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getPeriodLabel(template.period)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? "活跃" : "停用"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(template.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectTemplate(template)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    KPI项目配置
                  </div>
                  <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        添加项目
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingItem ? "编辑KPI项目" : "添加KPI项目"}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleItemSubmit} className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="item-name">项目名称</Label>
                          <Input
                            id="item-name"
                            value={itemFormData.name}
                            onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="item-description">项目描述</Label>
                          <Input
                            id="item-description"
                            value={itemFormData.description}
                            onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="max-score">满分</Label>
                          <Input
                            id="max-score"
                            type="number"
                            value={itemFormData.max_score}
                            onChange={(e) => setItemFormData({ ...itemFormData, max_score: parseInt(e.target.value) })}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="order">排序</Label>
                          <Input
                            id="order"
                            type="number"
                            value={itemFormData.order}
                            onChange={(e) => setItemFormData({ ...itemFormData, order: parseInt(e.target.value) })}
                            required
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setItemDialogOpen(false)}>
                            取消
                          </Button>
                          <Button type="submit">
                            {editingItem ? "更新" : "创建"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    当前模板: <span className="font-semibold">{selectedTemplate.name}</span>
                  </p>
                </div>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    暂无KPI项目，请点击&quot;添加项目&quot;创建
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>排序</TableHead>
                        <TableHead>项目名称</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead>满分</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Badge variant="outline">{item.order}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.max_score}分</Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 