"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../components/AuthProvider";
import { Avatar } from "../../../../components/Avatar";
import { Loading } from "../../../../components/Loading";
import { ExpenseForm } from "../../../../components/ExpenseForm";
import { toast } from "../../../../components/Toast";
import {
  Plus, Settings, ArrowLeft, TrendingUp, TrendingDown, Users,
  Sparkles, RefreshCw, ArrowRight, Trash2, Edit2, ChevronUp, ChevronDown,
  CheckCircle
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Member {
  id: number;
  name: string;
  email: string;
  avatar_color: string;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  paid_by_name: string;
  paid_by_color: string;
  split_mode: string;
  splits: { user_id: number; user_name: string; amount: number; avatar_color: string }[];
}

interface Settlement {
  fromUserId: number;
  fromUserName: string;
  toUserId: number;
  toUserName: string;
  amount: number;
}

interface NetBalance {
  userId: number;
  userName: string;
  netAmount: number;
}

interface MemberContribution {
  id: number;
  name: string;
  avatar_color: string;
  paid: number;
}

const COLORS = ["#4ade80", "#818cf8", "#f59e0b", "#f87171", "#22d3ee"];

export default function GroupDashboardPage() {
  const params = useParams();
  const groupId = Number(params.id);
  const router = useRouter();
  const { user } = useAuth();

  const [group, setGroup] = useState<{ id: number; name: string; created_by: number } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [netBalances, setNetBalances] = useState<NetBalance[]>([]);
  const [memberContributions, setMemberContributions] = useState<MemberContribution[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<number | undefined>();
  const [mintSummary, setMintSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"expenses" | "balances" | "settlements">("expenses");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [groupRes, expensesRes, balancesRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch(`/api/expenses?groupId=${groupId}`),
        fetch(`/api/groups/${groupId}/balances`),
      ]);

      if (!groupRes.ok || !expensesRes.ok || !balancesRes.ok) {
        const errorRes = !groupRes.ok ? groupRes : !expensesRes.ok ? expensesRes : balancesRes;
        const errData = await errorRes.json().catch(() => ({ error: "Unknown server error" }));
        throw new Error(errData.error || `Error: ${errorRes.status} ${errorRes.statusText}`);
      }

      const groupData = await groupRes.json();
      const expData = await expensesRes.json();
      const balData = await balancesRes.json();

      setGroup(groupData.group);
      setMembers(groupData.members || []);
      setExpenses(expData.expenses || []);
      setSettlements(balData.settlements || []);
      setNetBalances(balData.netBalances || []);
      setMemberContributions(balData.memberContributions || []);
      setTotalSpent(balData.totalSpent || 0);
    } catch (err: any) {
      console.error("Load Error:", err);
      toast(err.message || "Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteExpense = async (id: number) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      toast("Expense deleted", "success");
      load();
    } catch {
      toast("Failed to delete", "error");
    }
  };

  const handleMintSense = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch(`/api/mintsense/summary/${groupId}`);
      const data = await res.json();
      setMintSummary(data.summary);
    } catch {
      setMintSummary("Failed to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const myNetBalance = netBalances.find((b) => b.userId === user?.id);

  if (loading) return <Loading text="Loading group..." />;
  if (!group) return <div style={{ padding: "28px", color: "hsl(var(--muted-foreground))" }}>Group not found</div>;

  const chartData = memberContributions
    .filter((m) => m.paid > 0)
    .map((m) => ({ name: m.name, value: Math.round(m.paid) }));

  return (
    <div style={{ padding: "28px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: "24px" }}>
        <button
          onClick={() => router.push("/groups")}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", fontSize: "13px", marginBottom: "16px" }}
        >
          <ArrowLeft size={14} /> All Groups
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "6px", color: "hsl(var(--foreground))" }}>{group.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {members.slice(0, 4).map((m) => (
                  <Avatar key={m.id} name={m.name} color={m.avatar_color} size="sm" />
                ))}
              </div>
              <span style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))" }}>
                {members.length} member{members.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {group.created_by === user?.id && (
              <button
                onClick={() => router.push(`/groups/${groupId}/settings`)}
                className="btn-secondary"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
              >
                <Settings size={14} /> Settings
              </button>
            )}
            <button
              onClick={() => { setEditExpenseId(undefined); setShowExpenseForm(true); }}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="animate-slide-up" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px", animationDelay: "0.1s" }}>
        <div className="stat-card">
          <p style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginBottom: "6px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>TOTAL SPENT</p>
          <p style={{ fontSize: "24px", fontWeight: "700", color: "hsl(var(--foreground))" }}>₹{totalSpent.toLocaleString("en-IN")}</p>
        </div>
        <div className="stat-card" style={{ borderColor: myNetBalance && myNetBalance.netAmount > 0 ? "hsl(142 70% 60% / 0.3)" : myNetBalance && myNetBalance.netAmount < 0 ? "hsl(0 72% 60% / 0.3)" : "hsl(var(--border))" }}>
          <p style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginBottom: "6px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>YOUR BALANCE</p>
          <p style={{ fontSize: "24px", fontWeight: "700", color: myNetBalance && myNetBalance.netAmount > 0 ? "hsl(142 70% 60%)" : myNetBalance && myNetBalance.netAmount < 0 ? "hsl(0 72% 60%)" : "hsl(var(--foreground))" }}>
            {myNetBalance
              ? myNetBalance.netAmount > 0
                ? `+₹${myNetBalance.netAmount}`
                : myNetBalance.netAmount < 0
                  ? `-₹${Math.abs(myNetBalance.netAmount)}`
                  : "Settled"
              : "—"}
          </p>
        </div>
        <div className="stat-card">
          <p style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginBottom: "6px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>EXPENSES</p>
          <p style={{ fontSize: "24px", fontWeight: "700", color: "hsl(var(--foreground))" }}>{expenses.length}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
        {/* Main content */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "16px", background: "hsl(var(--secondary) / 0.5)", padding: "4px", borderRadius: "10px", border: "1px solid hsl(var(--border))" }}>
            {(["expenses", "balances", "settlements"] as const).map((tab) => (
              <button
                key={tab}
                className={`tab-button ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
                style={{ flex: 1, textTransform: "capitalize" }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Expenses Tab */}
          {activeTab === "expenses" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {expenses.length === 0 ? (
                <div className="glass-card">
                  <div className="empty-state">
                    <p>No expenses yet</p>
                    <button onClick={() => setShowExpenseForm(true)} className="btn-primary" style={{ fontSize: "13px", padding: "8px 16px" }}>
                      Add expense
                    </button>
                  </div>
                </div>
              ) : (
                expenses.map((exp) => (
                  <div key={exp.id} className="glass-card" style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${exp.paid_by_color}22`, border: `1px solid ${exp.paid_by_color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        💰
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ fontWeight: "600", fontSize: "14px", marginBottom: "2px", color: "hsl(var(--foreground))" }}>{exp.description}</p>
                            <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>
                              <span style={{ color: "hsl(var(--foreground))" }}>{exp.paid_by_name}</span> paid · {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {exp.split_mode} split
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontWeight: "700", fontSize: "16px", color: "hsl(var(--foreground))" }}>₹{exp.amount.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                        {/* Split details */}
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                          {exp.splits.map((s) => (
                            <span key={s.user_id} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                              {s.user_name}: ₹{s.amount}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        <button onClick={() => { setEditExpenseId(exp.id); setShowExpenseForm(true); }} className="btn-secondary" style={{ padding: "5px 8px" }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDeleteExpense(exp.id)} className="btn-danger" style={{ padding: "5px 8px" }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Balances Tab */}
          {activeTab === "balances" && (
            <div className="glass-card" style={{ overflow: "hidden" }}>
              {netBalances.length === 0 ? (
                <div className="empty-state"><p>No balance data</p></div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "hsl(var(--muted-foreground))", fontWeight: "600" }}>MEMBER</th>
                      <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "hsl(var(--muted-foreground))", fontWeight: "600" }}>NET BALANCE</th>
                      <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "hsl(var(--muted-foreground))", fontWeight: "600" }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {netBalances.map((nb, i) => (
                      <tr key={nb.userId} style={{ borderBottom: i < netBalances.length - 1 ? "1px solid hsl(var(--border))" : "none" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Avatar
                              name={nb.userName}
                              color={members.find((m) => m.id === nb.userId)?.avatar_color || "#6366f1"}
                              size="sm"
                            />
                            <span style={{ fontSize: "14px", fontWeight: nb.userId === user?.id ? "600" : "400", color: "hsl(var(--foreground))" }}>
                              {nb.userName}
                              {nb.userId === user?.id && <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginLeft: "4px" }}>(you)</span>}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <span style={{ fontWeight: "700", fontSize: "15px", color: nb.netAmount > 0 ? "hsl(142 70% 60%)" : nb.netAmount < 0 ? "hsl(0 72% 60%)" : "hsl(var(--muted-foreground))" }}>
                            {nb.netAmount > 0 ? `+₹${nb.netAmount}` : nb.netAmount < 0 ? `-₹${Math.abs(nb.netAmount)}` : "₹0"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          {nb.netAmount > 0 ? (
                            <span className="badge-green">Gets back</span>
                          ) : nb.netAmount < 0 ? (
                            <span className="badge-red">Owes</span>
                          ) : (
                            <span className="badge-gray">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Settlements Tab */}
          {activeTab === "settlements" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {settlements.length === 0 ? (
                <div className="glass-card">
                  <div className="empty-state">
                    <CheckCircle size={32} color="hsl(142 70% 60%)" />
                    <p style={{ color: "hsl(var(--foreground))", fontWeight: "600" }}>All settled up!</p>
                    <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "13px" }}>No pending payments in this group</p>
                  </div>
                </div>
              ) : (
                settlements.map((s, i) => (
                  <div key={i} className="glass-card" style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Avatar name={s.fromUserName} color={members.find((m) => m.id === s.fromUserId)?.avatar_color || "#6366f1"} size="sm" />
                      <span style={{ fontSize: "14px", color: "hsl(var(--foreground))", fontWeight: s.fromUserId === user?.id ? "600" : "400" }}>
                        {s.fromUserId === user?.id ? "You" : s.fromUserName}
                      </span>
                      <ArrowRight size={14} color="hsl(var(--muted-foreground))" />
                      <Avatar name={s.toUserName} color={members.find((m) => m.id === s.toUserId)?.avatar_color || "#6366f1"} size="sm" />
                      <span style={{ fontSize: "14px", color: "hsl(var(--foreground))", fontWeight: s.toUserId === user?.id ? "600" : "400" }}>
                        {s.toUserId === user?.id ? "You" : s.toUserName}
                      </span>
                      <div style={{ marginLeft: "auto" }}>
                        <span style={{ fontWeight: "700", fontSize: "16px", color: s.fromUserId === user?.id ? "hsl(0 72% 60%)" : "hsl(142 70% 60%)" }}>
                          ₹{s.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: "16px", animationDelay: "0.3s" }}>
          {/* Contribution chart */}
          <div className="glass-card" style={{ padding: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "hsl(var(--foreground))" }}>Contributions</h3>
            {chartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                      {chartData.map((_, i) => (
                         <Cell key={`cell-${i}`} fill={`hsl(168 80% ${40 + i * 15}%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => `₹${v}`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {memberContributions.map((m, i) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: `hsl(168 80% ${40 + i * 15}%)` }} />
                       <Avatar name={m.name} color={m.avatar_color} size="sm" />
                      <span style={{ flex: 1, fontSize: "12px", color: "hsl(var(--foreground))" }}>{m.name}</span>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "hsl(var(--foreground))" }}>₹{Math.round(m.paid).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", textAlign: "center", padding: "16px 0" }}>
                No expenses yet
              </p>
            )}
          </div>

          {/* MintSense */}
          <div style={{ padding: "16px", borderRadius: "16px", background: "hsl(168 80% 55% / 0.05)", border: "1px solid hsl(168 80% 55% / 0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={14} style={{ color: "hsl(168 80% 55%)" }} />
                <span style={{ fontSize: "13px", fontWeight: "600", color: "hsl(168 80% 55%)" }}>MintSense AI</span>
              </div>
              <button
                onClick={handleMintSense}
                disabled={summaryLoading}
                style={{ background: "hsl(168 80% 55% / 0.1)", border: "1px solid hsl(168 80% 55% / 0.2)", color: "hsl(168 80% 55%)", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "11px" }}
              >
                <RefreshCw size={10} style={{ animation: summaryLoading ? "spin 0.7s linear infinite" : "none", display: "inline", marginRight: "4px" }} />
                {summaryLoading ? "..." : "Summarize"}
              </button>
            </div>
            {mintSummary ? (
              <p className="animate-fade-in" style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", lineHeight: "1.6" }}>{mintSummary}</p>
            ) : (
              <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>
                Generate an AI summary of this group's expenses.
              </p>
            )}
          </div>

          {/* Members list */}
          <div className="glass-card" style={{ padding: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "hsl(var(--foreground))" }}>Members</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {members.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Avatar name={m.name} color={m.avatar_color} size="sm" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: "500", color: "hsl(var(--foreground))" }}>{m.name}</p>
                    <p style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{m.email}</p>
                  </div>
                  {m.id === user?.id && <span className="badge-gray" style={{ fontSize: "10px" }}>you</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showExpenseForm && (
        <ExpenseForm
          onClose={() => { setShowExpenseForm(false); setEditExpenseId(undefined); }}
          onSaved={load}
          currentUserId={user!.id}
          defaultGroupId={groupId}
          editExpenseId={editExpenseId}
        />
      )}
    </div>
  );
}
