"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Users, 
  Building, 
  ClipboardList, 
  FileText,
  BarChart3,
  Settings,
  Home
} from "lucide-react";

const navigation = [
  { name: "仪表板", href: "/", icon: Home },
  { name: "部门管理", href: "/departments", icon: Building },
  { name: "员工管理", href: "/employees", icon: Users },
  { name: "KPI模板", href: "/templates", icon: ClipboardList },
  { name: "考核管理", href: "/evaluations", icon: FileText },
  { name: "统计分析", href: "/statistics", icon: BarChart3 },
  { name: "设置", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800">KPI考核系统</h1>
      </div>
      <nav className="mt-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-6 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 