"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../components/AuthProvider";
import { UserSearch } from "../../../../../components/UserSearch";
import { Avatar } from "../../../../../components/Avatar";
import { Loading } from "../../../../../components/Loading";
import { toast } from "../../../../../components/Toast";
import { ArrowLeft, Save, Trash2, Users } from "lucide-react";

interface Member {
  id: number;
  name: string;
  email: string;
  avatar_color: string;
}

export default function GroupSettingsPage() {
  const params = useParams();
  const groupId = Number(params.id);
  const router = useRouter();
  const { user } = useAuth();

  const [group, setGroup] = useState<{ id: number; name: string; created_by: number } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();
      setGroup(data.group);
      setName(data.group?.name || "");
      setMembers((data.members || []).filter((m: Member) => m.id !== user?.id));
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => { load(); }, [load]);

  // Redirect non-owners
  useEffect(() => {
    if (group && group.created_by !== user?.id) {
      router.push(`/groups/${groupId}`);
    }
  }, [group, user, groupId, router]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          memberIds: members.map((m) => m.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast("Group updated!", "success");
      router.push(`/groups/${groupId}`);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this group? All expenses will be permanently deleted.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast("Group deleted", "success");
      router.push("/groups");
    } catch (err: any) {
      toast(err.message, "error");
      setDeleting(false);
    }
  };

  if (loading) return <Loading text="Loading settings..." />;

  return (
    <div style={{ padding: "28px", maxWidth: "600px" }}>
      <button
        onClick={() => router.push(`/groups/${groupId}`)}
        style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}
      >
        <ArrowLeft size={14} /> Back to {group?.name}
      </button>

      <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}>Group Settings</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "28px" }}>
        Manage your group details and members
      </p>

      <div className="glass-card" style={{ padding: "24px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>Group Details</h2>
        <div style={{ marginBottom: "20px" }}>
          <label className="form-label">Group name *</label>
          <input
            type="text"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name..."
          />
        </div>

        <div>
          <label className="form-label" style={{ marginBottom: "10px", display: "block" }}>
            Members (max 3 others + you)
          </label>

          {/* Current user (non-removable) */}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "10px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", marginBottom: "10px" }}>
              <Avatar name={user.name} color={user.avatar_color} size="sm" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", fontWeight: "500" }}>{user.name}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{user.email}</p>
              </div>
              <span className="badge-green" style={{ fontSize: "10px" }}>Owner</span>
            </div>
          )}

          <UserSearch
            selected={members}
            onAdd={(u) => setMembers([...members, u])}
            onRemove={(uid) => setMembers(members.filter((m) => m.id !== uid))}
            maxUsers={3}
            excludeIds={user ? [user.id] : []}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        <button onClick={() => router.push(`/groups/${groupId}`)} className="btn-secondary" style={{ flex: 1 }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving || !name.trim()} className="btn-primary" style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <Save size={14} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Danger Zone */}
      <div style={{ padding: "20px", borderRadius: "14px", border: "1px solid rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.04)" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#f87171", marginBottom: "8px" }}>Danger Zone</h3>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px" }}>
          Deleting this group will permanently remove all expenses, splits, and balances. This cannot be undone.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn-danger"
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Trash2 size={14} />
          {deleting ? "Deleting..." : "Delete Group"}
        </button>
      </div>
    </div>
  );
}
