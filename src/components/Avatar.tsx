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
      style={{ backgroundColor: color }}
      title={name}
    >
      {initial}
    </div>
  );
}
