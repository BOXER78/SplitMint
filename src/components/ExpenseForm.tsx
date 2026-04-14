"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Loader, ChevronDown } from "lucide-react";
import { Avatar } from "./Avatar";
import { toast } from "./Toast";

interface Member {
  id: number;
  name: string;
  email: string;
  avatar_color: string;
}

interface Group {
  id: number;
  name: string;
}

interface Split {
  userId: number;
  amount: number;
  percentage?: number;
}

interface ExpenseFormProps {
  onClose: () => void;
  onSaved: () => void;
  currentUserId: number;
  defaultGroupId?: number;
  editExpenseId?: number;
}

export function ExpenseForm({ onClose, onSaved, currentUserId, defaultGroupId, editExpenseId }: ExpenseFormProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [mintLoading, setMintLoading] = useState(false);
  const [mintText, setMintText] = useState("");

  const [form, setForm] = useState({
    groupId: defaultGroupId?.toString() || "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    paidByUserId: currentUserId.toString(),
    splitMode: "equal" as "equal" | "custom" | "percentage",
  });
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [customSplits, setCustomSplits] = useState<Record<number, string>>({});
  const [percentSplits, setPercentSplits] = useState<Record<number, string>>({});

  useEffect(() => {
    fetch("/api/groups").then((r) => r.json()).then((d) => {
      setGroups(d.groups || []);
    });
  }, []);

  useEffect(() => {
    if (!form.groupId) return;
    fetch(`/api/groups/${form.groupId}`).then((r) => r.json()).then((d) => {
      const m = d.members || [];
      setMembers(m);
      setSelectedParticipants(m.map((x: Member) => x.id));
    });
  }, [form.groupId]);

  // Load edit data
  useEffect(() => {
    if (!editExpenseId) return;
    fetch(`/api/expenses/${editExpenseId}`).then((r) => r.json()).then((d) => {
      const e = d.expense;
      if (!e) return;
      setForm({
        groupId: e.group_id.toString(),
        amount: e.amount.toString(),
        description: e.description,
        date: e.date,
        paidByUserId: e.paid_by_user_id.toString(),
        splitMode: e.split_mode,
      });
      setSelectedParticipants(e.splits.map((s: any) => s.user_id));
      if (e.split_mode === "custom") {
        const m: Record<number, string> = {};
        for (const s of e.splits) m[s.user_id] = s.amount.toString();
        setCustomSplits(m);
      }
      if (e.split_mode === "percentage") {
        const m: Record<number, string> = {};
        for (const s of e.splits) m[s.user_id] = (s.percentage ?? 0).toString();
        setPercentSplits(m);
      }
    });
  }, [editExpenseId]);

  const computeSplits = (): Split[] => {
    const amount = parseFloat(form.amount) || 0;
    if (form.splitMode === "equal") {
      const share = Math.round((amount / selectedParticipants.length) * 100) / 100;
      return selectedParticipants.map((uid, i) => ({
        userId: uid,
        amount: i === selectedParticipants.length - 1
          ? Math.round((amount - share * (selectedParticipants.length - 1)) * 100) / 100
          : share,
      }));
    }
    if (form.splitMode === "custom") {
      return selectedParticipants.map((uid) => ({
        userId: uid,
        amount: parseFloat(customSplits[uid] || "0"),
      }));
    }
    if (form.splitMode === "percentage") {
      return selectedParticipants.map((uid) => {
        const pct = parseFloat(percentSplits[uid] || "0");
        return {
          userId: uid,
          amount: Math.round((amount * pct) / 100 * 100) / 100,
          percentage: pct,
        };
      });
    }
    return [];
  };

  const handleMintSense = async () => {
    if (!mintText.trim() || !form.groupId) return;
    setMintLoading(true);
    try {
      const res = await fetch("/api/mintsense/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: mintText, groupId: Number(form.groupId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const parsed = data.parsed;

      setForm((prev) => ({
        ...prev,
        amount: parsed.amount?.toString() || prev.amount,
        description: parsed.description || prev.description,
        date: parsed.date || prev.date,
        paidByUserId: parsed.paidByUserId?.toString() || prev.paidByUserId,
        splitMode: parsed.splitMode || prev.splitMode,
      }));

      if (parsed.participants?.length) {
        setSelectedParticipants(parsed.participants.map((p: any) => p.userId));
      }

      toast(`MintSense parsed: ${parsed.note || "Expense filled!"}`, "success");
      setMintText("");
    } catch (err: any) {
      toast(err.message || "MintSense failed", "error");
    } finally {
      setMintLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.groupId || !form.amount || !form.description || selectedParticipants.length === 0) {
      toast("Please fill in all required fields", "error");
      return;
    }

    const splits = computeSplits();

    // Validate
    if (form.splitMode === "percentage") {
      const totalPct = Object.values(percentSplits).reduce((s, v) => s + parseFloat(v || "0"), 0);
      if (Math.abs(totalPct - 100) > 0.5) {
        toast("Percentages must sum to 100%", "error");
        return;
      }
    }

    setLoading(true);
    try {
      const url = editExpenseId ? `/api/expenses/${editExpenseId}` : "/api/expenses";
      const method = editExpenseId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: Number(form.groupId),
          amount: parseFloat(form.amount),
          description: form.description,
          date: form.date,
          paidByUserId: Number(form.paidByUserId),
          splitMode: form.splitMode,
          splits,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }

      toast(editExpenseId ? "Expense updated!" : "Expense added!", "success");
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err.message || "Failed to save expense", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (uid: number) => {
    setSelectedParticipants((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
  };

  const percentTotal = selectedParticipants.reduce(
    (s, uid) => s + parseFloat(percentSplits[uid] || "0"),
    0
  );
  const customTotal = selectedParticipants.reduce(
    (s, uid) => s + parseFloat(customSplits[uid] || "0"),
    0
  );

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: "580px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700" }}>
            {editExpenseId ? "Edit Expense" : "Add Expense"}
          </h2>
          <button onClick={onClose} className="btn-secondary" style={{ padding: "6px", borderRadius: "8px" }}>
            <X size={16} />
          </button>
        </div>

        {/* MintSense */}
        {!editExpenseId && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(129,140,248,0.08), rgba(74,222,128,0.08))",
              border: "1px solid rgba(129,140,248,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <Sparkles size={14} color="#818cf8" />
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#818cf8" }}>MintSense AI</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                className="input-field"
                value={mintText}
                onChange={(e) => setMintText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMintSense()}
                placeholder={`e.g. "I paid ₹600 for dinner with Alice, split equally"`}
                style={{ fontSize: "13px" }}
                disabled={!form.groupId}
              />
              <button
                type="button"
                onClick={handleMintSense}
                disabled={!mintText.trim() || !form.groupId || mintLoading}
                className="btn-primary"
                style={{ whiteSpace: "nowrap", padding: "8px 14px", fontSize: "13px" }}
              >
                {mintLoading ? <Loader size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : "Parse"}
              </button>
            </div>
            {!form.groupId && (
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                Select a group first to use MintSense
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Group */}
          <div>
            <label className="form-label">Group *</label>
            <select
              className="input-field"
              value={form.groupId}
              onChange={(e) => setForm({ ...form, groupId: e.target.value })}
              required
              disabled={!!editExpenseId}
            >
              <option value="">Select group...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Amount + Description */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
            <div>
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                className="input-field"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="form-label">Description *</label>
              <input
                type="text"
                className="input-field"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What's this expense for?"
                required
              />
            </div>
          </div>

          {/* Date + Paid by */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="input-field"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Paid by *</label>
              <select
                className="input-field"
                value={form.paidByUserId}
                onChange={(e) => setForm({ ...form, paidByUserId: e.target.value })}
                required
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Participants */}
          {members.length > 0 && (
            <div>
              <label className="form-label">Split between</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleParticipant(m.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 12px 5px 6px",
                      borderRadius: "20px",
                      border: selectedParticipants.includes(m.id)
                        ? "1px solid rgba(74, 222, 128, 0.4)"
                        : "1px solid var(--border)",
                      background: selectedParticipants.includes(m.id)
                        ? "rgba(74, 222, 128, 0.08)"
                        : "rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <Avatar name={m.name} color={m.avatar_color} size="sm" />
                    <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{m.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Split Mode */}
          <div>
            <label className="form-label">Split mode</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["equal", "custom", "percentage"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`tab-button ${form.splitMode === mode ? "active" : ""}`}
                  onClick={() => setForm({ ...form, splitMode: mode })}
                  style={{ flex: 1, textTransform: "capitalize" }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Custom splits */}
          {form.splitMode === "custom" && selectedParticipants.length > 0 && (
            <div>
              <label className="form-label">
                Custom amounts
                <span style={{
                  marginLeft: "8px",
                  color: Math.abs(customTotal - parseFloat(form.amount || "0")) < 0.5 ? "#4ade80" : "#f87171",
                  fontSize: "12px"
                }}>
                  ₹{customTotal.toFixed(2)} / ₹{parseFloat(form.amount || "0").toFixed(2)}
                </span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {members.filter((m) => selectedParticipants.includes(m.id)).map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Avatar name={m.name} color={m.avatar_color} size="sm" />
                    <span style={{ flex: 1, fontSize: "13px" }}>{m.name}</span>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "13px" }}>₹</span>
                      <input
                        type="number"
                        className="input-field"
                        value={customSplits[m.id] || ""}
                        onChange={(e) => setCustomSplits({ ...customSplits, [m.id]: e.target.value })}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        style={{ width: "120px", paddingLeft: "22px" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Percentage splits */}
          {form.splitMode === "percentage" && selectedParticipants.length > 0 && (
            <div>
              <label className="form-label">
                Percentages
                <span style={{
                  marginLeft: "8px",
                  color: Math.abs(percentTotal - 100) < 0.5 ? "#4ade80" : "#f87171",
                  fontSize: "12px"
                }}>
                  {percentTotal.toFixed(1)}% / 100%
                </span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {members.filter((m) => selectedParticipants.includes(m.id)).map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Avatar name={m.name} color={m.avatar_color} size="sm" />
                    <span style={{ flex: 1, fontSize: "13px" }}>{m.name}</span>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number"
                        className="input-field"
                        value={percentSplits[m.id] || ""}
                        onChange={(e) => setPercentSplits({ ...percentSplits, [m.id]: e.target.value })}
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.1"
                        style={{ width: "100px", paddingRight: "24px" }}
                      />
                      <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "13px" }}>%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2 }}>
              {loading ? "Saving..." : editExpenseId ? "Update Expense" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
