"use client";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function Loading({ size = "md", text }: LoadingProps) {
  const spinnerSize = size === "sm" ? "16px" : size === "lg" ? "32px" : "20px";
  return (
    <div className="flex items-center justify-center gap-3" style={{ margin: "20px 0" }}>
      <div
        className="spinner"
        style={{ width: spinnerSize, height: spinnerSize }}
      />
      {text && <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{text}</span>}
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
        background: "var(--bg-primary)",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "14px",
          background: "linear-gradient(135deg, #4ade80, #22d3ee)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          fontWeight: "bold",
          color: "#0a0d14",
          animation: "pulse-glow 2s ease infinite",
        }}
      >
        S
      </div>
      <div className="spinner" style={{ width: "24px", height: "24px" }} />
    </div>
  );
}
