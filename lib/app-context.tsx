"use client";

import { createContext, useCallback, useContext, useRef } from "react";
import AlertLayout, { AlertLayoutRef, AlertProps } from "@/components/alert";

interface AppContextType {
  Alert: (title: string | AlertProps, message?: string) => Promise<void>;
  Confirm: (title: string | AlertProps, message?: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const alertLayoutRef = useRef<AlertLayoutRef>(null);

  const Alert = useCallback((title: string | AlertProps, message?: string) => {
    return new Promise<void>((resolve) => {
      alertLayoutRef.current?.setAlert({
        type: "alert",
        message,
        ...(typeof title === "string" ? { title } : title),

        onConfirm: () => {
          resolve();
        },
      });
    });
  }, []);

  const Confirm = useCallback((title: string | AlertProps, message?: string) => {
    return new Promise<boolean>((resolve) => {
      alertLayoutRef.current?.setAlert({
        type: "confirm",
        message,
        ...(typeof title === "string" ? { title } : title),

        onConfirm: () => {
          resolve(true);
        },
        onClose: () => {
          resolve(false);
        },
      });
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        Alert,
        Confirm,
      }}
    >
      {children}

      {/* 弹出框 */}
      <AlertLayout ref={alertLayoutRef} />
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
