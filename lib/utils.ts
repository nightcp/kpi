import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { KPIEvaluation, RecentEvaluation } from "./api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 获取考核周期标签
export function getPeriodLabel(period: string) {
  switch (period) {
    case "monthly":
      return "月度"
    case "quarterly":
      return "季度"
    default:
      return "年度"
  }
}

// 获取考核周期值
export function getPeriodValue(evaluation: KPIEvaluation | RecentEvaluation) {
  const values = [getPeriodLabel(evaluation.period), evaluation.year]
  if (evaluation.month) values.push(`年${evaluation.month}月`)
  if (evaluation.quarter) values.push(`年Q${evaluation.quarter}`)
  return values.join(" ")
}