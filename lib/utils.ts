import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPeriodLabel(period: string) {
  switch (period) {
    case "monthly": return "月度";
    case "quarterly": return "季度";
    default: return "年度";
  }
}