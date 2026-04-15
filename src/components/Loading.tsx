"use client";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function Loading({ size = "md", text }: LoadingProps) {
  const spinnerSize = size === "sm" ? "16px" : size === "lg" ? "32px" : "24px";
  return (
    <div className="flex flex-col items-center justify-center gap-3" style={{ margin: "20px 0" }}>
      <div
        className="spinner"
        style={{ width: spinnerSize, height: spinnerSize, borderWidth: size === "sm" ? "2px" : "3px" }}
      />
      {text && <span style={{ color: "hsl(var(--muted-foreground))", fontSize: size === "sm" ? "12px" : "14px", fontWeight: "500" }}>{text}</span>}
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
        gap: "24px",
        background: "hsl(var(--background))",
      }}
    >
      <div
        className="animate-pulse-glow"
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background: "var(--gradient-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
          fontWeight: "800",
          color: "hsl(var(--primary-foreground))",
          boxShadow: "0 0 30px hsl(168 80% 55% / 0.3)",
        }}
      >
        S
      </div>
      <div className="spinner" style={{ width: "28px", height: "28px", borderWidth: "3px" }} />
      <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "14px", letterSpacing: "0.05em", fontWeight: "500" }}>Loading SplitMint...</span>
    </div>
  );
}
