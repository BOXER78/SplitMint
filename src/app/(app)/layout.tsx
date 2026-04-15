"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { AuthProvider } from "../../components/AuthProvider";
import { Sidebar } from "../../components/Sidebar";
import { ToastContainer } from "../../components/Toast";
import { FullPageLoading } from "../../components/Loading";

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) return <FullPageLoading />;
  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "hsl(var(--background))" }}>
      <Sidebar />
      <main 
        style={{ 
          flex: 1, 
          overflow: "auto", 
          position: "relative",
          zIndex: 1
        }}
      >
        {/* Subtle background glow for the main area */}
        <div style={{ 
          position: "absolute", 
          top: "0", 
          right: "0", 
          width: "400px", 
          height: "400px", 
          background: "radial-gradient(circle, hsl(168 80% 55% / 0.03), transparent 70%)",
          pointerEvents: "none",
          zIndex: -1
        }} />
        
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </AuthProvider>
  );
}
