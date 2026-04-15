"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

let addToastFn: ((toast: Omit<Toast, "id">) => void) | null = null;

export function toast(message: string, type: Toast["type"] = "info") {
  addToastFn?.({ message, type });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (t) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons: Record<Toast["type"], React.ReactNode> = {
    success: <CheckCircle size={18} style={{ color: "hsl(142 70% 60%)" }} />,
    error: <AlertCircle size={18} style={{ color: "hsl(0 72% 60%)" }} />,
    info: <Info size={18} style={{ color: "hsl(168 80% 55%)" }} />,
  };

  const colors: Record<Toast["type"], string> = {
    success: "hsl(142 70% 60% / 0.1)",
    error: "hsl(0 72% 60% / 0.1)",
    info: "hsl(168 80% 55% / 0.1)",
  };

  const borders: Record<Toast["type"], string> = {
    success: "hsl(142 70% 60% / 0.2)",
    error: "hsl(0 72% 60% / 0.2)",
    info: "hsl(168 80% 55% / 0.2)",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        zIndex: 9999,
        maxWidth: "400px",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-slide-up"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 18px",
            borderRadius: "14px",
            background: colors[t.type],
            border: `1px solid ${borders[t.type]}`,
            backdropFilter: "blur(20px)",
            fontSize: "14px",
            fontWeight: "500",
            color: "hsl(var(--foreground))",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
          }}
        >
          {icons[t.type]}
          <span style={{ flex: 1, lineHeight: "1.4" }}>{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              color: "hsl(var(--muted-foreground))", 
              padding: "4px",
              display: "flex",
              alignItems: "center",
              borderRadius: "6px",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "hsl(var(--foreground))";
              e.currentTarget.style.background = "hsl(var(--secondary) / 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "hsl(var(--muted-foreground))";
              e.currentTarget.style.background = "none";
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
