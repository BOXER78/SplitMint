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
    success: <CheckCircle size={16} color="#4ade80" />,
    error: <AlertCircle size={16} color="#f87171" />,
    info: <Info size={16} color="#818cf8" />,
  };

  const colors: Record<Toast["type"], string> = {
    success: "rgba(74, 222, 128, 0.1)",
    error: "rgba(248, 113, 113, 0.1)",
    info: "rgba(129, 140, 248, 0.1)",
  };

  const borders: Record<Toast["type"], string> = {
    success: "rgba(74, 222, 128, 0.3)",
    error: "rgba(248, 113, 113, 0.3)",
    info: "rgba(129, 140, 248, 0.3)",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        zIndex: 9999,
        maxWidth: "360px",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="fade-in"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "12px",
            background: colors[t.type],
            border: `1px solid ${borders[t.type]}`,
            backdropFilter: "blur(12px)",
            fontSize: "14px",
            color: "var(--text-primary)",
          }}
        >
          {icons[t.type]}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px" }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
