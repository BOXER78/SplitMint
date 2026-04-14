"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { Avatar } from "../../../components/Avatar";
import { Loading } from "../../../components/Loading";
import { ExpenseForm } from "../../../components/ExpenseForm";
import { TrendingUp, TrendingDown, DollarSign, Plus, ArrowRight, Sparkles, RefreshCw } from "lucide-react";

interface GroupBalance {
  groupId: number;
  groupName: string;
  youOwe: number;
  owedToYou: number;
}

interface RecentExpense {
  id: number;
  description: string;
  amount: number;
  date: string;
  paid_by_name: string;
  paid_by_color: string;
  group_name: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<RecentExpense[]>([]);
  const [groupBalances, setGroupBalances] = useState<GroupBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [mintSummary, setMintSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsRes, expensesRes] = await Promise.all([
        fetch("/api/groups"),
        fetch("/api/expenses?limit=5"),
      ]);
      const groupsData = await groupsRes.json();
      const expensesData = await expensesRes.json();
      setGroups(groupsData.groups || []);
      setExpenses((expensesData.expenses || []).slice(0, 6));

      // Compute per-group balances
      const groupList = groupsData.groups || [];
      const balanceResults = await Promise.all(
        groupList.map(async (g: any) => {
          const br = await fetch(`/api/groups/${g.id}/balances`);
          const bd = await br.json();
          const me = user!.id;

          let youOwe = 0;
          let owedToYou = 0;
          for (const s of bd.settlements || []) {
            if (s.fromUserId === me) youOwe += s.amount;
            if (s.toUserId === me) owedToYou += s.amount;
          }
          return { groupId: g.id, groupName: g.name, youOwe, owedToYou };
        })
      );
      setGroupBalances(balanceResults);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const totalOwed = groupBalances.reduce((s, g) => s + g.youOwe, 0);
  const totalOwedToYou = groupBalances.reduce((s, g) => s + g.owedToYou, 0);
  const totalSpent = groups.reduce((s: number, g: any) => s + (g.total_spent || 0), 0);

  const handleMintSense = async () => {
    if (groups.length === 0) return;
    setSummaryLoading(true);
    setMintSummary(null);
    try {
      // Use the first group for summary
      const res = await fetch(`/api/mintsense/summary/${groups[0].id}`);
      const data = await res.json();
      setMintSummary(data.summary || "Unable to generate summary.");
    } catch {
      setMintSummary("Failed to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading) return <Loading text="Loading dashboard..." />;

  return (
    <div style={{ padding: "28px", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "4px" }}>
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Here's your expense overview
          </p>
        </div>
        <button onClick={() => setShowExpenseForm(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
        <div className="stat-card" style={{ borderColor: "rgba(129,140,248,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: "500" }}>
                TOTAL SPENT
              </p>
              <p style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)" }}>
                ₹{totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                across {groups.length} group{groups.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div style={{ background: "rgba(129,140,248,0.1)", padding: "10px", borderRadius: "10px" }}>
              <DollarSign size={20} color="#818cf8" />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: "rgba(248,113,113,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: "500" }}>
                YOU OWE
              </p>
              <p style={{ fontSize: "28px", fontWeight: "700", color: "#f87171" }}>
                ₹{totalOwed.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                {totalOwed > 0 ? "settle up soon" : "you're all clear!"}
              </p>
            </div>
            <div style={{ background: "rgba(248,113,113,0.1)", padding: "10px", borderRadius: "10px" }}>
              <TrendingDown size={20} color="#f87171" />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: "rgba(74,222,128,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: "500" }}>
                OWED TO YOU
              </p>
              <p style={{ fontSize: "28px", fontWeight: "700", color: "#4ade80" }}>
                ₹{totalOwedToYou.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                {totalOwedToYou > 0 ? "pending collection" : "all settled!"}
              </p>
            </div>
            <div style={{ background: "rgba(74,222,128,0.1)", padding: "10px", borderRadius: "10px" }}>
              <TrendingUp size={20} color="#4ade80" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Recent Expenses */}
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600" }}>Recent Expenses</h2>
            <a href="/expenses" style={{ fontSize: "12px", color: "#4ade80", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              View all <ArrowRight size={12} />
            </a>
          </div>
          {expenses.length === 0 ? (
            <div className="empty-state">
              <p>No expenses yet</p>
              <button onClick={() => setShowExpenseForm(true)} className="btn-primary" style={{ fontSize: "13px", padding: "8px 16px" }}>
                Add first expense
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: `${exp.paid_by_color}22`,
                      border: `1px solid ${exp.paid_by_color}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                    }}
                  >
                    💰
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>{exp.description}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {exp.group_name} · {exp.paid_by_name} · {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
                    ₹{exp.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group Balances + MintSense */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Balance per group */}
          <div className="glass-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600" }}>Group Balances</h2>
              <a href="/groups" style={{ fontSize: "12px", color: "#4ade80", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                All groups <ArrowRight size={12} />
              </a>
            </div>
            {groupBalances.length === 0 ? (
              <div className="empty-state">
                <p>No groups yet</p>
                <a href="/groups" className="btn-primary" style={{ fontSize: "13px", padding: "8px 16px", textDecoration: "none", display: "inline-block" }}>
                  Create group
                </a>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {groupBalances.map((gb) => (
                  <a
                    key={gb.groupId}
                    href={`/groups/${gb.groupId}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                      textDecoration: "none",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: "500" }}>{gb.groupName}</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {gb.owedToYou > 0 && (
                        <span className="badge-green">+₹{gb.owedToYou.toFixed(0)}</span>
                      )}
                      {gb.youOwe > 0 && (
                        <span className="badge-red">-₹{gb.youOwe.toFixed(0)}</span>
                      )}
                      {gb.youOwe === 0 && gb.owedToYou === 0 && (
                        <span className="badge-gray">settled</span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* MintSense Summary */}
          <div
            style={{
              padding: "20px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(129,140,248,0.08), rgba(74,222,128,0.05))",
              border: "1px solid rgba(129,140,248,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={16} color="#818cf8" />
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#818cf8" }}>MintSense AI</span>
              </div>
              <button
                onClick={handleMintSense}
                disabled={summaryLoading || groups.length === 0}
                style={{
                  background: "rgba(129,140,248,0.15)",
                  border: "1px solid rgba(129,140,248,0.3)",
                  color: "#818cf8",
                  padding: "5px 10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <RefreshCw size={12} style={{ animation: summaryLoading ? "spin 0.7s linear infinite" : "none" }} />
                {summaryLoading ? "Generating..." : "Generate Summary"}
              </button>
            </div>
            {mintSummary ? (
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>{mintSummary}</p>
            ) : (
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Click "Generate Summary" to get an AI-powered overview of your group expenses.
              </p>
            )}
          </div>
        </div>
      </div>

      {showExpenseForm && (
        <ExpenseForm
          onClose={() => setShowExpenseForm(false)}
          onSaved={load}
          currentUserId={user!.id}
        />
      )}
    </div>
  );
}
