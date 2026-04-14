"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { Avatar } from "../../../components/Avatar";
import { Loading } from "../../../components/Loading";
import { ExpenseForm } from "../../../components/ExpenseForm";
import { toast } from "../../../components/Toast";
import { Plus, Search, Filter, Edit2, Trash2, X, Calendar, DollarSign } from "lucide-react";

interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  paid_by_name: string;
  paid_by_color: string;
  group_name: string;
  group_id: number;
  split_mode: string;
  splits: { user_id: number; user_name: string; amount: number }[];
}

interface Group {
  id: number;
  name: string;
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterGroup) params.set("groupId", filterGroup);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (amountMin) params.set("amountMin", amountMin);
      if (amountMax) params.set("amountMax", amountMax);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      const data = await res.json();
      setExpenses(data.expenses || []);
    } finally {
      setLoading(false);
    }
  }, [search, filterGroup, dateFrom, dateTo, amountMin, amountMax]);

  useEffect(() => {
    fetch("/api/groups").then((r) => r.json()).then((d) => setGroups(d.groups || []));
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      toast("Expense deleted", "success");
      load();
    } catch {
      toast("Failed to delete", "error");
    }
  };

  const totalFiltered = expenses.reduce((s, e) => s + e.amount, 0);
  const hasFilters = search || filterGroup || dateFrom || dateTo || amountMin || amountMax;

  const clearFilters = () => {
    setSearch("");
    setFilterGroup("");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
  };

  const splitModeLabel: Record<string, string> = {
    equal: "Equal",
    custom: "Custom",
    percentage: "Percentage",
  };

  // Group expenses by date
  const grouped: Record<string, Expense[]> = {};
  for (const exp of expenses) {
    const dateKey = new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(exp);
  }

  return (
    <div style={{ padding: "28px", maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "4px" }}>Expenses</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            All your expense transactions
          </p>
        </div>
        <button onClick={() => { setEditId(undefined); setShowForm(true); }} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      {/* Search + Filters */}
      <div className="glass-card" style={{ padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              className="input-field"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by description..."
              style={{ paddingLeft: "34px" }}
            />
          </div>
          <select
            className="input-field"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            style={{ width: "180px" }}
          >
            <option value="">All groups</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary`}
            style={{
              display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap",
              ...(showFilters ? { borderColor: "rgba(74,222,128,0.4)", color: "#4ade80" } : {})
            }}
          >
            <Filter size={14} />
            Filters
            {hasFilters && (
              <span style={{ background: "#4ade80", color: "#0a0d14", borderRadius: "10px", padding: "1px 6px", fontSize: "11px", fontWeight: "700" }}>
                {[dateFrom, dateTo, amountMin, amountMax].filter(Boolean).length}
              </span>
            )}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-danger" style={{ padding: "8px 10px" }}>
              <X size={14} />
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
            <div>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Calendar size={11} /> From date
              </label>
              <input type="date" className="input-field" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Calendar size={11} /> To date
              </label>
              <input type="date" className="input-field" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <DollarSign size={11} /> Min amount
              </label>
              <input type="number" className="input-field" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} placeholder="₹0" />
            </div>
            <div>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <DollarSign size={11} /> Max amount
              </label>
              <input type="number" className="input-field" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} placeholder="₹∞" />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {expenses.length > 0 && (
        <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
          <div style={{ padding: "10px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", fontSize: "13px" }}>
            <span style={{ color: "var(--text-muted)" }}>Showing </span>
            <strong>{expenses.length}</strong>
            <span style={{ color: "var(--text-muted)" }}> expense{expenses.length !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ padding: "10px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", fontSize: "13px" }}>
            <span style={{ color: "var(--text-muted)" }}>Total </span>
            <strong>₹{totalFiltered.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
          </div>
        </div>
      )}

      {/* Expense List */}
      {loading ? (
        <Loading text="Loading expenses..." />
      ) : expenses.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div style={{ fontSize: "40px" }}>💸</div>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>
              {hasFilters ? "No expenses match your filters" : "No expenses yet"}
            </h3>
            {hasFilters ? (
              <button onClick={clearFilters} className="btn-secondary" style={{ fontSize: "13px" }}>Clear filters</button>
            ) : (
              <button onClick={() => setShowForm(true)} className="btn-primary" style={{ fontSize: "13px" }}>Add expense</button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {Object.entries(grouped).map(([dateLabel, dateExpenses]) => (
            <div key={dateLabel}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "8px", paddingLeft: "2px" }}>
                {dateLabel}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {dateExpenses.map((exp) => (
                  <div key={exp.id} className="glass-card" style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div
                        style={{
                          width: "42px", height: "42px", borderRadius: "12px",
                          background: `${exp.paid_by_color}22`, border: `1px solid ${exp.paid_by_color}44`,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "18px"
                        }}
                      >
                        💰
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                          <div>
                            <p style={{ fontWeight: "600", fontSize: "15px" }}>{exp.description}</p>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "2px" }}>
                              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                {exp.group_name}
                              </span>
                              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>·</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: exp.paid_by_color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "white", fontWeight: "bold" }}>
                                  {exp.paid_by_name[0]}
                                </div>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{exp.paid_by_name} paid</span>
                              </div>
                              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>·</span>
                              <span className="badge-gray" style={{ fontSize: "10px", padding: "1px 6px" }}>{splitModeLabel[exp.split_mode]}</span>
                            </div>
                          </div>
                          <p style={{ fontWeight: "700", fontSize: "17px", color: "var(--text-primary)" }}>
                            ₹{exp.amount.toLocaleString("en-IN")}
                          </p>
                        </div>
                        {/* My share */}
                        {exp.splits.find((s) => s.user_id === user?.id) && (
                          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                            Your share: ₹{exp.splits.find((s) => s.user_id === user?.id)?.amount.toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        <button onClick={() => { setEditId(exp.id); setShowForm(true); }} className="btn-secondary" style={{ padding: "6px 8px" }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDelete(exp.id)} className="btn-danger" style={{ padding: "6px 8px" }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ExpenseForm
          onClose={() => { setShowForm(false); setEditId(undefined); }}
          onSaved={load}
          currentUserId={user!.id}
          editExpenseId={editId}
        />
      )}
    </div>
  );
}
