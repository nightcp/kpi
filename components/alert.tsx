"use client"

import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface AlertProps extends AlertLayoutProps {
  title?: string
  message?: string
}

export interface AlertItemProps extends AlertProps {
  type?: "alert" | "confirm"
  onConfirm?: () => void
  onClose?: () => void
}

export interface AlertLayoutRef {
  setAlert: (alert: AlertItemProps) => void
}

export interface AlertLayoutProps {
  confirmText?: string
  cancelText?: string
}

const AlertLayout = forwardRef<AlertLayoutRef, AlertLayoutProps>(
  ({ confirmText = "确定", cancelText = "取消" }, ref) => {
    const [waits, setWaits] = useState<AlertItemProps[]>([])
    const [currentAlert, setCurrentAlert] = useState<AlertItemProps | null>(null)

    useImperativeHandle(ref, () => ({
      setAlert: alert => {
        setWaits(waits => [...waits, alert])
      },
    }))

    useEffect(() => {
      if (currentAlert) {
        return
      }
      const current = waits.shift()
      if (current) {
        setCurrentAlert(current)
      }
    }, [waits, currentAlert])

    if (!currentAlert) {
      return null
    }

    return (
      <AlertDialog
        open={!!currentAlert}
        onOpenChange={() => {
          currentAlert.onClose?.()
          setCurrentAlert(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{currentAlert.title}</AlertDialogTitle>
            <AlertDialogDescription>{currentAlert.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {currentAlert.type === "confirm" && (
              <AlertDialogCancel
                onClick={() => {
                  currentAlert.onClose?.()
                  setCurrentAlert(null)
                }}
              >
                {currentAlert.cancelText || cancelText}
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={() => {
                currentAlert.onConfirm?.()
                setCurrentAlert(null)
              }}
            >
              {currentAlert.confirmText || confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
)

AlertLayout.displayName = "AlertLayout"

export default AlertLayout
