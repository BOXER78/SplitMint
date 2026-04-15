"use client";

interface AvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ name, color, size = "md", className = "" }: AvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  const sizeClass = size === "sm" ? "avatar-sm" : size === "lg" ? "avatar-lg" : "";

  return (
    <div
      className={`avatar ${sizeClass} ${className}`}
      style={{ 
        backgroundColor: color,
        border: "2px solid hsl(var(--card))",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        flexShrink: 0
      }}
      title={name}
    >
      {initial}
    </div>
  );
}
