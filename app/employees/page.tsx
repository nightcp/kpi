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
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { employeeApi, departmentApi, type Employee, type Department } from "@/lib/api";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "",
    department_id: "",
    manager_id: "",
    role: "employee"
  });

  // 获取员工列表
  const fetchEmployees = async () => {
    try {
      const response = await employeeApi.getAll();
      setEmployees(response.data || []);
    } catch (error) {
      console.error("获取员工列表失败:", error);
      // 模拟数据
      setEmployees([
        { id: 1, name: "张三", email: "zhangsan@company.com", position: "技术总监", department_id: 1, role: "manager", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "技术部" } },
        { id: 2, name: "李四", email: "lisi@company.com", position: "高级开发工程师", department_id: 1, manager_id: 1, role: "employee", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "技术部" }, manager: { name: "张三" } },
        { id: 3, name: "王五", email: "wangwu@company.com", position: "前端开发工程师", department_id: 1, manager_id: 1, role: "employee", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "技术部" }, manager: { name: "张三" } },
        { id: 4, name: "赵六", email: "zhaoliu@company.com", position: "市场总监", department_id: 2, role: "manager", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "市场部" } },
        { id: 5, name: "钱七", email: "qianqi@company.com", position: "市场专员", department_id: 2, manager_id: 4, role: "employee", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "市场部" }, manager: { name: "赵六" } },
        { id: 6, name: "孙八", email: "sunba@company.com", position: "HR经理", department_id: 3, role: "hr", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "人事部" } },
        { id: 7, name: "周九", email: "zhoujiu@company.com", position: "财务经理", department_id: 4, role: "manager", is_active: true, created_at: "2024-01-01T00:00:00Z", department: { name: "财务部" } }
      ]);
    }
    setLoading(false);
  };

  // 获取部门列表
  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAll();
      setDepartments(response.data || []);
    } catch (error) {
      console.error("获取部门列表失败:", error);
      setDepartments([
        { id: 1, name: "技术部", description: "技术部", created_at: "2024-01-01T00:00:00Z" },
        { id: 2, name: "市场部", description: "市场部", created_at: "2024-01-01T00:00:00Z" },
        { id: 3, name: "人事部", description: "人事部", created_at: "2024-01-01T00:00:00Z" },
        { id: 4, name: "财务部", description: "财务部", created_at: "2024-01-01T00:00:00Z" }
      ]);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  // 根据选择的部门获取可能的上级
  useEffect(() => {
    if (formData.department_id) {
      const departmentEmployees = employees.filter(
        emp => emp.department_id === parseInt(formData.department_id) && 
               emp.role === "manager" && 
               emp.id !== editingEmployee?.id
      );
      setManagers(departmentEmployees);
    }
  }, [formData.department_id, employees, editingEmployee]);

  // 创建或更新员工
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        department_id: parseInt(formData.department_id),
        manager_id: formData.manager_id ? parseInt(formData.manager_id) : undefined,
        is_active: true
      };

      if (editingEmployee) {
        await employeeApi.update(editingEmployee.id, submitData);
      } else {
        await employeeApi.create(submitData);
      }

      fetchEmployees();
      setDialogOpen(false);
      setEditingEmployee(null);
      setFormData({ name: "", email: "", position: "", department_id: "", manager_id: "", role: "employee" });
    } catch (error) {
      console.error("保存员工失败:", error);
    }
  };

  // 删除员工
  const handleDelete = async (id: number) => {
    if (confirm("确定要删除这个员工吗？")) {
      try {
        await employeeApi.delete(id);
        fetchEmployees();
      } catch (error) {
        console.error("删除员工失败:", error);
      }
    }
  };

  // 打开编辑对话框
  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      position: employee.position,
      department_id: employee.department_id.toString(),
      manager_id: employee.manager_id?.toString() || "",
      role: employee.role
    });
    setDialogOpen(true);
  };

  // 打开新增对话框
  const handleAdd = () => {
    setEditingEmployee(null);
    setFormData({ name: "", email: "", position: "", department_id: "", manager_id: "", role: "employee" });
    setDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "manager":
        return <Badge variant="default">经理</Badge>;
      case "hr":
        return <Badge variant="secondary">HR</Badge>;
      default:
        return <Badge variant="outline">员工</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">员工管理</h1>
          <p className="text-gray-600 mt-2">管理员工信息和组织架构</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              添加员工
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "编辑员工" : "添加员工"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="position">职位</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="department">部门</Label>
                <Select value={formData.department_id} onValueChange={(value) => setFormData({ ...formData, department_id: value, manager_id: "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择部门" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="role">角色</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">员工</SelectItem>
                    <SelectItem value="manager">经理</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.role === "employee" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="manager">直属上级</Label>
                  <Select value={formData.manager_id} onValueChange={(value) => setFormData({ ...formData, manager_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择上级" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id.toString()}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">
                  {editingEmployee ? "更新" : "创建"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            员工列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无员工数据
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>职位</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>直属上级</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department?.name}</TableCell>
                    <TableCell>{employee.manager?.name || "-"}</TableCell>
                    <TableCell>{getRoleBadge(employee.role)}</TableCell>
                    <TableCell>
                      <Badge variant={employee.is_active ? "default" : "secondary"}>
                        {employee.is_active ? "活跃" : "停用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(employee.id)}
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
    </div>
  );
} 