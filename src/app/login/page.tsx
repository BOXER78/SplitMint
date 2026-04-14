"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthProvider, useAuth } from "../../components/AuthProvider";
import { ToastContainer, toast } from "../../components/Toast";
import { Eye, EyeOff, Sparkles } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const error = await login(email, password);
    setLoading(false);
    if (error) {
      toast(error, "error");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label className="form-label">Email</label>
        <input
          type="email"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoFocus
        />
      </div>
      <div>
        <label className="form-label">Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showPass ? "text" : "password"}
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: "4px", padding: "12px" }}>
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient blobs */}
        <div style={{ position: "absolute", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%)", top: "-100px", left: "-100px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)", bottom: "-100px", right: "-100px", pointerEvents: "none" }} />

        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "linear-gradient(135deg, #4ade80, #22d3ee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "800", color: "#0a0d14" }}>S</div>
              <span style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px" }}>
                Split<span className="gradient-text">Mint</span>
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Split expenses. Stay friends.</p>
          </div>

          {/* Card */}
          <div className="glass-card" style={{ padding: "32px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "6px" }}>Welcome back</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
              Sign in to your SplitMint account
            </p>
            <LoginForm />
            <div className="divider" />
            <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-secondary)" }}>
              Don't have an account?{" "}
              <Link href="/register" style={{ color: "#4ade80", textDecoration: "none", fontWeight: "600" }}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      <ToastContainer />
    </AuthProvider>
  );
}
