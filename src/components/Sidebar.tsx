"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Avatar } from "./Avatar";
import { LayoutDashboard, Users, Receipt, LogOut, Sparkles } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/groups", icon: Users, label: "Groups" },
  { href: "/expenses", icon: Receipt, label: "Expenses" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "hsl(var(--sidebar-background))",
        borderRight: "1px solid hsl(var(--sidebar-border))",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "24px 24px 16px" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "800",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            S
          </div>
          <span style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "-0.3px", color: "hsl(var(--foreground))" }}>
            Split<span className="gradient-text">Mint</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, padding: "0 12px" }}>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${active ? "active" : ""}`}
              style={{
                transition: "all 0.2s ease",
              }}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* MintSense AI Card */}
      <div style={{ padding: "0 12px", marginBottom: "12px" }}>
        <div className="glass-card" style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Sparkles size={16} style={{ color: "hsl(var(--primary))" }} />
            <span style={{ fontSize: "14px", fontWeight: "600", color: "hsl(var(--foreground))" }}>MintSense AI</span>
          </div>
          <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginBottom: "12px" }}>
            Get AI-powered expense insights
          </p>
          <Link
            href="/dashboard"
            className="btn-primary"
            style={{ fontSize: "12px", textAlign: "center", display: "block", padding: "8px", textDecoration: "none" }}
          >
            Try it
          </Link>
        </div>
      </div>

      {/* User + Logout */}
      <div style={{ borderTop: "1px solid hsl(var(--sidebar-border))", padding: "12px" }}>
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "10px",
              background: "hsl(var(--sidebar-accent))",
              marginBottom: "8px",
            }}
          >
            <Avatar name={user.name} color={user.avatar_color} size="sm" />
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "hsl(var(--foreground))",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.name}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "hsl(var(--muted-foreground))",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.email}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="nav-link"
          style={{
            width: "100%",
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "hsl(var(--muted-foreground))",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "hsl(var(--destructive))";
            e.currentTarget.style.background = "hsl(0 72% 60% / 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "hsl(var(--muted-foreground))";
            e.currentTarget.style.background = "none";
          }}
        >
          <LogOut size={18} />
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
