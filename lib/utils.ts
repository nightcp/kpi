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

// 评分输入验证
export function scoreInputValidation(e: React.FormEvent<HTMLInputElement>, maxScore: number) {
  const input = e.target as HTMLInputElement
  const value = parseFloat(input.value)
  if (value > maxScore) {
    input.value = maxScore.toString()
  } else if (value < 0) {
    input.value = "0"
  }
}

// 查找父级滚动容器
export function findScrollContainer(element: HTMLElement) {
  let parent = element.parentElement
  while (parent) {
    const style = window.getComputedStyle(parent)
    if (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
      return parent
    }
    parent = parent.parentElement
  }
}

// 滚动到指定元素
export function scrollToElement(element: HTMLElement, offset: number = 0) {
  const scrollContainer = findScrollContainer(element)
  if (scrollContainer) {
    const containerRect = scrollContainer.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    const targetScrollTop = scrollContainer.scrollTop + elementRect.top - containerRect.top - offset
    scrollContainer.scrollTo({ top: targetScrollTop, behavior: "smooth" })
  } else {
    window.scrollTo({ top: element.offsetTop - offset, behavior: "smooth" })
  }
}