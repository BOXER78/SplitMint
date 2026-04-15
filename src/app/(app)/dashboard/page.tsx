"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { Avatar } from "../../../components/Avatar";
import { Loading } from "../../../components/Loading";
import { ExpenseForm } from "../../../components/ExpenseForm";
import Link from "next/link";
import { TrendingUp, TrendingDown, DollarSign, Plus, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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

const EXPENSE_COLORS = ["#4ade80", "#818cf8", "#f59e0b", "#ec4899", "#3b82f6", "#14b8a6"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<RecentExpense[]>([]);
  const [groupBalances, setGroupBalances] = useState<GroupBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [mintSummary, setMintSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [chartData, setChartData] = useState<{ day: string; amount: number }[]>([]);

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
      const allExpenses = expensesData.expenses || [];
      setExpenses(allExpenses.slice(0, 6));

      // Build chart data from real expenses (last 30 days, grouped by ~2-day buckets)
      const now = new Date();
      const buckets: Record<string, number> = {};
      for (let i = 0; i < 13; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - (i * 2));
        buckets[String(d.getDate()).padStart(2, '0')] = 0;
      }
      for (const exp of allExpenses) {
        const date = new Date(exp.date);
        const dayKey = String(date.getDate()).padStart(2, '0');
        if (dayKey in buckets) {
          buckets[dayKey] += Number(exp.amount || 0);
        }
      }
      const cd = Object.entries(buckets)
        .map(([day, amount]) => ({ day, amount }))
        .sort((a, b) => parseInt(a.day) - parseInt(b.day));
      setChartData(cd);

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

  const totalOwed = groupBalances.reduce((s, g) => s + Number(g.youOwe || 0), 0);
  const totalOwedToYou = groupBalances.reduce((s, g) => s + Number(g.owedToYou || 0), 0);
  const totalSpent = groups.reduce((s: number, g: any) => s + Number(g.total_spent || 0), 0);

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
    <div style={{ padding: "28px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "4px", color: "hsl(var(--foreground))" }}>
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "14px" }}>
            Here's your expense overview
          </p>
        </div>
        <Link
          href="/expenses"
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
        >
          <Plus size={16} />
          Add Expense
        </Link>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div className="stat-card animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "hsl(var(--muted-foreground))", marginBottom: "8px" }}>
                Total Spent
              </p>
              <p style={{ fontSize: "24px", fontWeight: "700", color: "hsl(var(--foreground))" }}>
                ₹{totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginTop: "4px" }}>
                across {groups.length} group{groups.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div style={{ background: "hsl(var(--primary) / 0.1)", padding: "10px", borderRadius: "10px" }}>
              <DollarSign size={18} style={{ color: "hsl(var(--primary))" }} />
            </div>
          </div>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "hsl(var(--muted-foreground))", marginBottom: "8px" }}>
                You Owe
              </p>
              <p style={{ fontSize: "24px", fontWeight: "700", color: "hsl(var(--destructive))" }}>
                ₹{totalOwed.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginTop: "4px" }}>
                {totalOwed > 0 ? "settle up soon" : "you're all clear!"}
              </p>
            </div>
            <div style={{ background: "hsl(0 72% 60% / 0.1)", padding: "10px", borderRadius: "10px" }}>
              <TrendingDown size={18} style={{ color: "hsl(var(--destructive))" }} />
            </div>
          </div>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "hsl(var(--muted-foreground))", marginBottom: "8px" }}>
                Owed To You
              </p>
              <p style={{ fontSize: "24px", fontWeight: "700", color: "hsl(142 70% 60%)" }}>
                ₹{totalOwedToYou.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginTop: "4px" }}>
                {totalOwedToYou > 0 ? "pending collection" : "all settled!"}
              </p>
            </div>
            <div style={{ background: "hsl(142 70% 60% / 0.1)", padding: "10px", borderRadius: "10px" }}>
              <TrendingUp size={18} style={{ color: "hsl(142 70% 60%)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart + MintSense */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Money Flow Chart */}
        <div className="glass-card animate-slide-up" style={{ padding: "24px", animationDelay: "0.4s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "hsl(var(--foreground))" }}>Money Flow</h2>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "20px", background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", fontWeight: "500" }}>
                Expense
              </span>
              <span style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "20px", background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))", fontWeight: "500" }}>
                Monthly
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 30% 16%)" />
              <XAxis
                dataKey="day"
                tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(220 45% 9%)",
                  border: "1px solid hsl(220 30% 16%)",
                  borderRadius: 8,
                  color: "#fff",
                }}
                formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Amount"]}
              />
              <Bar dataKey="amount" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* MintSense AI */}
        <div className="glass-card animate-slide-up" style={{ padding: "24px", animationDelay: "0.5s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Sparkles size={18} style={{ color: "hsl(var(--primary))" }} />
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "hsl(var(--foreground))" }}>MintSense AI</h2>
          </div>
          <button
            onClick={handleMintSense}
            disabled={summaryLoading || groups.length === 0}
            className="btn-primary"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px" }}
          >
            <RefreshCw size={14} style={{ animation: summaryLoading ? "spin 0.7s linear infinite" : "none" }} />
            {summaryLoading ? "Generating..." : "Generate Summary"}
          </button>
          {mintSummary ? (
            <div
              className="animate-fade-in"
              style={{
                fontSize: "13px",
                color: "hsl(var(--muted-foreground))",
                lineHeight: "1.6",
                padding: "16px",
                borderRadius: "10px",
                background: "hsl(var(--primary) / 0.05)",
                border: "1px solid hsl(var(--primary) / 0.1)",
              }}
            >
              {mintSummary}
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", textAlign: "center", padding: "24px 0" }}>
              Click "Generate Summary" for AI-powered expense insights.
            </p>
          )}
        </div>
      </div>

      {/* Bottom Grid: Recent Expenses + Group Balances */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Recent Expenses */}
        <div className="glass-card animate-slide-up" style={{ padding: "24px", animationDelay: "0.6s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "hsl(var(--foreground))" }}>Recent Expenses</h2>
            <Link
              href="/expenses"
              style={{ fontSize: "13px", color: "hsl(var(--primary))", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {expenses.length === 0 ? (
            <div className="empty-state">
              <p>No expenses yet</p>
              <button onClick={() => setShowExpenseForm(true)} className="btn-primary" style={{ fontSize: "13px", padding: "8px 16px" }}>
                Add first expense
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {expenses.map((exp, i) => (
                <div
                  key={exp.id}
                  className="animate-slide-up"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    transition: "all 0.2s ease",
                    cursor: "default",
                    animationDelay: `${0.7 + i * 0.05}s`,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "hsl(var(--secondary) / 0.5)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: `${EXPENSE_COLORS[i % EXPENSE_COLORS.length]}20`,
                      color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                    }}
                  >
                    💰
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {exp.description}
                    </div>
                    <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>
                      {exp.group_name} · {exp.paid_by_name} · {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "hsl(var(--foreground))" }}>
                    ₹{exp.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group Balances */}
        <div className="glass-card animate-slide-up" style={{ padding: "24px", animationDelay: "0.7s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "hsl(var(--foreground))" }}>Group Balances</h2>
            <Link
              href="/groups"
              style={{ fontSize: "13px", color: "hsl(var(--primary))", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
            >
              All groups <ArrowRight size={14} />
            </Link>
          </div>
          {groupBalances.length === 0 ? (
            <div className="empty-state">
              <p>No groups yet</p>
              <Link href="/groups" className="btn-primary" style={{ fontSize: "13px", padding: "8px 16px", textDecoration: "none", display: "inline-block" }}>
                Create group
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {groupBalances.map((gb, i) => (
                <Link
                  key={gb.groupId}
                  href={`/groups/${gb.groupId}`}
                  className="animate-slide-up"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    color: "hsl(var(--foreground))",
                    transition: "all 0.2s ease",
                    animationDelay: `${0.8 + i * 0.05}s`,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "hsl(var(--secondary) / 0.5)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ fontSize: "13px", fontWeight: "500" }}>{gb.groupName}</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {gb.owedToYou > 0 && (
                      <span className="badge-green">+₹{gb.owedToYou.toFixed(0)}</span>
                    )}
                    {gb.youOwe > 0 && (
                      <span className="badge-red">-₹{gb.youOwe.toFixed(0)}</span>
                    )}
                    {gb.youOwe === 0 && gb.owedToYou === 0 && (
                      <span style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", padding: "2px 10px", borderRadius: "20px", background: "hsl(var(--secondary))" }}>
                        settled
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
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
