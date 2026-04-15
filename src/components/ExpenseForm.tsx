"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Loader, ChevronDown, Mic } from "lucide-react";
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
  const [isRecording, setIsRecording] = useState(false);

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

  const toggleRecording = () => {
    if (isRecording) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast("Voice recognition not supported in your browser.", "error");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMintText((prev) => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') toast("Microphone error: " + event.error, "error");
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.groupId || !form.amount || !form.description || selectedParticipants.length === 0) {
      toast("Please fill in all required fields", "error");
      return;
    }

    const splits = computeSplits();

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
    <div className="modal-overlay animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-scale-in" style={{ maxWidth: "580px", background: "hsl(var(--card))", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "hsl(var(--foreground))" }}>
            {editExpenseId ? "Edit Expense" : "Add Expense"}
          </h2>
          <button onClick={onClose} className="btn-secondary" style={{ padding: "6px", borderRadius: "8px", border: "none", background: "transparent" }}>
            <X size={20} style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </div>

        {/* MintSense */}
        {!editExpenseId && (
          <div
            className="animate-pulse-glow"
            style={{
              marginBottom: "24px",
              padding: "16px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, hsl(168 80% 55% / 0.1), hsl(217 91% 60% / 0.1))",
              border: "1px solid hsl(168 80% 55% / 0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Sparkles size={16} style={{ color: "hsl(168 80% 55%)" }} />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "hsl(168 80% 55%)" }}>MintSense AI</span>
              <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginLeft: "auto" }}>Try: "I paid ₹500 for coffee"</span>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text"
                  className="input-field"
                  value={mintText}
                  onChange={(e) => setMintText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleMintSense()}
                  placeholder={isRecording ? "Listening..." : "Tell AI what happened..."}
                  style={{ fontSize: "13px", paddingRight: "44px", height: "42px" }}
                  disabled={!form.groupId}
                />
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={!form.groupId || isRecording}
                  style={{
                    position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: isRecording ? "hsl(0 72% 60%)" : "hsl(var(--muted-foreground))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "8px", borderRadius: "50%", transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "hsl(168 80% 55%)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = isRecording ? "hsl(0 72% 60%)" : "hsl(var(--muted-foreground))"}
                >
                  <Mic size={18} className={isRecording ? "animate-pulse" : ""} />
                </button>
              </div>
              <button
                type="button"
                onClick={handleMintSense}
                disabled={!mintText.trim() || !form.groupId || mintLoading}
                className="btn-primary"
                style={{ whiteSpace: "nowrap", padding: "0 16px", height: "42px", fontSize: "13px" }}
              >
                {mintLoading ? <Loader size={16} className="spinner" /> : "Fill Form"}
              </button>
            </div>
            {!form.groupId && (
              <p style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", marginTop: "8px", textAlign: "center" }}>
                Select a group to activate AI parsing
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Group Search/Select */}
          <div>
            <label className="form-label" style={{ color: "hsl(var(--muted-foreground))" }}>Group *</label>
            <select
              className="input-field"
              value={form.groupId}
              onChange={(e) => setForm({ ...form, groupId: e.target.value })}
              required
              disabled={!!editExpenseId}
              style={{ height: "42px" }}
            >
              <option value="">Select a group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "12px" }}>
            <div>
              <label className="form-label" style={{ color: "hsl(var(--muted-foreground))" }}>Amount (₹) *</label>
              <input
                type="number"
                className="input-field"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                style={{ height: "42px" }}
              />
            </div>
            <div>
              <label className="form-label" style={{ color: "hsl(var(--muted-foreground))" }}>Description *</label>
              <input
                type="text"
                className="input-field"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Lunch, Groceries, Trip..."
                required
                style={{ height: "42px" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="form-label" style={{ color: "hsl(var(--muted-foreground))" }}>Date *</label>
              <input
                type="date"
                className="input-field"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                style={{ height: "42px" }}
              />
            </div>
            <div>
              <label className="form-label" style={{ color: "hsl(var(--muted-foreground))" }}>Paid by *</label>
              <select
                className="input-field"
                value={form.paidByUserId}
                onChange={(e) => setForm({ ...form, paidByUserId: e.target.value })}
                required
                style={{ height: "42px" }}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.id === currentUserId ? "You" : m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Participants - Replaced with better pill design */}
          {members.length > 0 && (
            <div>
              <label className="form-label" style={{ color: "hsl(var(--muted-foreground))", marginBottom: "10px" }}>Splitting between</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {members.map((m) => {
                  const isSelected = selectedParticipants.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleParticipant(m.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 12px 6px 6px",
                        borderRadius: "12px",
                        border: "1px solid",
                        borderColor: isSelected ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))",
                        background: isSelected ? "hsl(var(--primary) / 0.1)" : "hsl(var(--secondary) / 0.4)",
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        color: isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"
                      }}
                    >
                      <Avatar name={m.name} color={m.avatar_color} size="sm" />
                      <span style={{ fontSize: "13px", fontWeight: isSelected ? "600" : "400" }}>{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Split Mode Tabs */}
          <div>
            <label className="form-label" style={{ color: "hsl(var(--muted-foreground))", marginBottom: "10px" }}>Split Mode</label>
            <div style={{ display: "flex", gap: "6px", background: "hsl(var(--secondary) / 0.5)", padding: "4px", borderRadius: "12px", border: "1px solid hsl(var(--border))" }}>
              {(["equal", "custom", "percentage"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`tab-button ${form.splitMode === mode ? "active" : ""}`}
                  onClick={() => setForm({ ...form, splitMode: mode })}
                  style={{ flex: 1, textTransform: "capitalize", fontSize: "13px", padding: "8px" }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Table for detailed splits if not equal */}
          {form.splitMode !== "equal" && selectedParticipants.length > 0 && (
            <div className="glass-card" style={{ padding: "16px", background: "hsl(var(--secondary) / 0.2)", borderStyle: "dashed" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "hsl(var(--foreground))" }}>
                   {form.splitMode === "custom" ? "Custom Amounts" : "Percentages"}
                </span>
                <span style={{
                  fontSize: "12px",
                  fontWeight: "700",
                   color: (form.splitMode === "custom" ? (Math.abs(customTotal - (parseFloat(form.amount) || 0)) < 0.5) : (Math.abs(percentTotal - 100) < 0.5)) ? "hsl(142 70% 60%)" : "hsl(0 72% 60%)"
                }}>
                  {form.splitMode === "custom" 
                    ? `₹${customTotal.toFixed(2)} / ₹${(parseFloat(form.amount) || 0).toFixed(2)}`
                    : `${percentTotal.toFixed(1)}% / 100%`}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {members.filter((m) => selectedParticipants.includes(m.id)).map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Avatar name={m.name} color={m.avatar_color} size="sm" />
                    <span style={{ flex: 1, fontSize: "13px", color: "hsl(var(--foreground))" }}>{m.name}</span>
                    <div style={{ position: "relative", width: "120px" }}>
                      {form.splitMode === "custom" && <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))", fontSize: "13px" }}>₹</span>}
                      <input
                        type="number"
                        className="input-field"
                        value={form.splitMode === "custom" ? (customSplits[m.id] || "") : (percentSplits[m.id] || "")}
                        onChange={(e) => {
                          if (form.splitMode === "custom") {
                             setCustomSplits({ ...customSplits, [m.id]: e.target.value });
                          } else {
                             setPercentSplits({ ...percentSplits, [m.id]: e.target.value });
                          }
                        }}
                        placeholder="0"
                        min="0"
                        step={form.splitMode === "custom" ? "0.01" : "0.1"}
                        style={{ paddingLeft: form.splitMode === "custom" ? "22px" : "12px", height: "36px", fontSize: "13px" }}
                      />
                      {form.splitMode === "percentage" && <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))", fontSize: "13px" }}>%</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, height: "46px" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2, height: "46px" }}>
              {loading ? <Loader size={18} className="spinner" /> : (editExpenseId ? "Update Expense" : "Add Expense")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
