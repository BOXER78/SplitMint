"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthProvider, useAuth } from "../../components/AuthProvider";
import { ToastContainer, toast } from "../../components/Toast";
import { Eye, EyeOff } from "lucide-react";

function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }
    setLoading(true);
    const error = await register(email, name, password);
    setLoading(false);
    if (error) {
      toast(error, "error");
    } else {
      toast("Account created! Welcome to SplitMint 🎉", "success");
      router.push("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <label style={{ fontSize: "13px", fontWeight: "500", color: "hsl(var(--muted-foreground))", marginBottom: "6px", display: "block" }}>Full name</label>
        <input
          type="text"
          className="input-field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          autoFocus
        />
      </div>
      <div>
        <label style={{ fontSize: "13px", fontWeight: "500", color: "hsl(var(--muted-foreground))", marginBottom: "6px", display: "block" }}>Email</label>
        <input
          type="email"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label style={{ fontSize: "13px", fontWeight: "500", color: "hsl(var(--muted-foreground))", marginBottom: "6px", display: "block" }}>Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showPass ? "text" : "password"}
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            required
            minLength={6}
            style={{ paddingRight: "40px" }}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "hsl(var(--muted-foreground))",
              display: "flex",
              alignItems: "center",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "hsl(var(--foreground))"}
            onMouseLeave={(e) => e.currentTarget.style.color = "hsl(var(--muted-foreground))"}
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {password && password.length < 6 && (
          <p style={{ fontSize: "11px", color: "hsl(var(--destructive))", marginTop: "4px" }}>At least 6 characters required</p>
        )}
      </div>
      <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", padding: "12px" }}>
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          background: "hsl(var(--background))",
        }}
      >
        {/* Animated background blobs */}
        <div
          className="animate-float"
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            opacity: 0.2,
            background: "radial-gradient(circle, hsl(168 80% 55% / 0.3), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          className="animate-float"
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            opacity: 0.15,
            background: "radial-gradient(circle, hsl(217 91% 60% / 0.3), transparent 70%)",
            animationDelay: "3s",
            pointerEvents: "none",
          }}
        />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="animate-float"
            style={{
              position: "absolute",
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "hsl(var(--primary) / 0.3)",
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + i}s`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Logo */}
        <div className="animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div
            className="animate-pulse-glow"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "800",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            S
          </div>
          <span style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px", color: "hsl(var(--foreground))" }}>
            Split<span className="gradient-text">Mint</span>
          </span>
        </div>
        <p className="animate-fade-in" style={{ color: "hsl(var(--muted-foreground))", fontSize: "14px", marginBottom: "32px", animationDelay: "0.1s" }}>
          Split expenses. Stay friends.
        </p>

        {/* Card */}
        <div className="glass-card animate-scale-in" style={{ width: "100%", maxWidth: "420px", padding: "32px", animationDelay: "0.2s" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "4px", color: "hsl(var(--foreground))" }}>Create account</h1>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "14px", marginBottom: "24px" }}>
            Join SplitMint and start splitting
          </p>
          <RegisterForm />
          <div style={{ height: "1px", background: "hsl(var(--border))", margin: "20px 0" }} />
          <p style={{ textAlign: "center", fontSize: "14px", color: "hsl(var(--muted-foreground))" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "hsl(var(--primary))", textDecoration: "none", fontWeight: "600" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <ToastContainer />
    </AuthProvider>
  );
}
