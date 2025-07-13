"use client"

import { Loader2 } from "lucide-react"

export default function Loading({ message = "正在加载..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

export function LoadingInline({
  message = undefined,
  className = "",
}: {
  message?: string
  className?: string
}) {
  return (
    <div className={`flex items-center justify-center gap-2 text-muted-foreground ${className}`}>
      <Loader2 className="w-4 h-4 animate-spin" />
      {message && <div>{message}</div>}
    </div>
  )
}