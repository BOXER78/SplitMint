"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { Avatar } from "../../../components/Avatar";
import { UserSearch } from "../../../components/UserSearch";
import { Loading } from "../../../components/Loading";
import { toast } from "../../../components/Toast";
import { Plus, Users, Trash2, Settings, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Group {
  id: number;
  name: string;
  created_by: number;
  member_count: number;
  total_spent: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar_color: string;
}

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), memberIds: members.map((m) => m.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast("Group created!", "success");
      onCreated();
      onClose();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700" }}>Create Group</h2>
          <button onClick={onClose} className="btn-secondary" style={{ padding: "6px", borderRadius: "8px" }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className="form-label">Group name *</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekend trip, Office lunch..."
              required
              autoFocus
            />
          </div>

          <div>
            <label className="form-label">
              Add members (up to 3)
            </label>
            <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Avatar name={user!.name} color={user!.avatar_color} size="sm" />
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{user!.name} (you)</span>
            </div>
            <UserSearch
              selected={members}
              onAdd={(u) => setMembers([...members, u])}
              onRemove={(uid) => setMembers(members.filter((m) => m.id !== uid))}
              maxUsers={3}
              excludeIds={[user!.id]}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()} className="btn-primary" style={{ flex: 2 }}>
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      setGroups(data.groups || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (groupId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this group? All linked expenses will also be deleted.")) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast("Group deleted", "success");
      load();
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  if (loading) return <Loading text="Loading groups..." />;

  return (
    <div style={{ padding: "28px", maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "4px" }}>Groups</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Manage your expense groups
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} />
          New Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="glass-card" style={{ padding: "60px 20px" }}>
          <div className="empty-state">
            <div style={{ fontSize: "48px" }}>👥</div>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)" }}>No groups yet</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              Create a group to start splitting expenses with friends
            </p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create your first group
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {groups.map((group) => (
            <div
              key={group.id}
              className="glass-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/groups/${group.id}`)}
            >
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
                {/* Group icon */}
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, rgba(74,222,128,0.15), rgba(129,140,248,0.15))",
                    border: "1px solid rgba(74,222,128,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    flexShrink: 0,
                  }}
                >
                  <Users size={20} color="#4ade80" />
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "600" }}>{group.name}</h3>
                    {group.created_by === user?.id && (
                      <span className="badge-gray">Owner</span>
                    )}
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {group.member_count} member{group.member_count !== 1 ? "s" : ""} ·{" "}
                    ₹{(group.total_spent || 0).toLocaleString("en-IN")} total spent
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {group.created_by === user?.id && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/groups/${group.id}/settings`);
                        }}
                        className="btn-secondary"
                        style={{ padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <Settings size={13} />
                        Settings
                      </button>
                      <button
                        onClick={(e) => handleDelete(group.id, e)}
                        className="btn-danger"
                        style={{ padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={load} />
      )}
    </div>
  );
}
