"use client";

import { createContext, useCallback, useContext, useRef } from "react";
import AlertLayout, { AlertLayoutRef, AlertProps } from "@/components/alert";

interface AppContextType {
  Alert: (message: string | AlertProps) => Promise<void>;
  Confirm: (message: string | AlertProps) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const alertLayoutRef = useRef<AlertLayoutRef>(null);

  const Alert = useCallback((message: string | AlertProps) => {
    return new Promise<void>((resolve) => {
      alertLayoutRef.current?.setAlert({
        type: "alert",
        ...(typeof message === "string" ? { title: message } : message),

        onConfirm: () => {
          resolve();
        },
      });
    });
  }, []);

  const Confirm = useCallback((message: string | AlertProps) => {
    return new Promise<boolean>((resolve) => {
      alertLayoutRef.current?.setAlert({
        type: "confirm",
        ...(typeof message === "string" ? { title: message } : message),

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
