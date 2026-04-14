"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthProvider, useAuth } from "../../components/AuthProvider";
import { ToastContainer, toast } from "../../components/Toast";
import { Eye, EyeOff } from "lucide-react";

const AVATAR_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6",
];

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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label className="form-label">Full name</label>
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
        <label className="form-label">Email</label>
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
        <label className="form-label">Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showPass ? "text" : "password"}
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {password && password.length < 6 && (
          <p style={{ fontSize: "11px", color: "#f87171", marginTop: "4px" }}>At least 6 characters required</p>
        )}
      </div>
      <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: "4px", padding: "12px" }}>
        {loading ? "Creating account..." : "Create Account"}
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
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)", top: "-100px", right: "-100px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%)", bottom: "-100px", left: "-100px", pointerEvents: "none" }} />

        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "linear-gradient(135deg, #4ade80, #22d3ee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "800", color: "#0a0d14" }}>S</div>
              <span style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px" }}>
                Split<span className="gradient-text">Mint</span>
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Split expenses. Stay friends.</p>
          </div>

          <div className="glass-card" style={{ padding: "32px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "6px" }}>Create account</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
              Join SplitMint and simplify group expenses
            </p>
            <RegisterForm />
            <div className="divider" />
            <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-secondary)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#4ade80", textDecoration: "none", fontWeight: "600" }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      <ToastContainer />
    </AuthProvider>
  );
}
