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
    <div className="modal-overlay animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-scale-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "hsl(var(--foreground))" }}>Create Group</h2>
          <button onClick={onClose} className="btn-secondary" style={{ padding: "6px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none" }}>
            <X size={18} style={{ color: "hsl(var(--muted-foreground))" }} />
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
              placeholder="e.g. Weekend Trip"
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
              <span style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))" }}>{user!.name} (you)</span>
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

  const avatarColors = ["hsl(168 80% 55%)", "hsl(217 91% 60%)", "hsl(38 92% 60%)", "hsl(330 80% 60%)"];

  return (
    <div style={{ padding: "28px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "4px", color: "hsl(var(--foreground))" }}>Groups</h1>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "14px" }}>
            Manage your expense groups
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} />
          Create Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="glass-card animate-slide-up" style={{ padding: "60px 20px" }}>
          <div className="empty-state">
            <div style={{ fontSize: "48px" }}>👥</div>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "hsl(var(--foreground))" }}>No groups yet</h3>
            <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "14px" }}>
              Create a group to start splitting expenses with friends
            </p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create your first group
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {groups.map((group, i) => (
            <div
              key={group.id}
              className="glass-card animate-slide-up group-card-hover"
              style={{
                cursor: "pointer",
                padding: "20px",
                position: "relative",
                animationDelay: `${0.1 + i * 0.1}s`
              }}
              onClick={() => router.push(`/groups/${group.id}`)}
              onMouseEnter={(e) => {
                const icon = e.currentTarget.querySelector('.chevron-icon') as HTMLElement;
                if (icon) icon.style.color = 'hsl(var(--primary))';
              }}
              onMouseLeave={(e) => {
                const icon = e.currentTarget.querySelector('.chevron-icon') as HTMLElement;
                if (icon) icon.style.color = 'hsl(var(--muted-foreground))';
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "hsl(var(--foreground))" }}>{group.name}</h3>
                  {group.created_by === user?.id && (
                    <span className="badge-gray" style={{ fontSize: "10px", padding: "2px 6px" }}>Owner</span>
                  )}
                </div>
                <ChevronRight size={16} className="chevron-icon" style={{ color: "hsl(var(--muted-foreground))", transition: "color 0.2s" }} />
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "14px", color: "hsl(var(--muted-foreground))" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Users size={14} /> {group.member_count} members
                </span>
                <span>₹{(group.total_spent || 0).toLocaleString("en-IN")} spent</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "16px" }}>
                <div style={{ display: "flex" }}>
                  {[...Array(Math.min(group.member_count, 4))].map((_, j) => (
                    <div
                      key={j}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "2px solid hsl(var(--card))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: "600",
                        background: avatarColors[j % 4],
                        color: "#000",
                        marginLeft: j > 0 ? "-8px" : "0",
                      }}
                    >
                      {String.fromCharCode(65 + j)}
                    </div>
                  ))}
                  {group.member_count > 4 && (
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "2px solid hsl(var(--card))",
                        background: "hsl(var(--secondary))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: "500",
                        color: "hsl(var(--muted-foreground))",
                        marginLeft: "-8px",
                      }}
                    >
                      +{group.member_count - 4}
                    </div>
                  )}
                </div>
                
                {group.created_by === user?.id && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/groups/${group.id}/settings`);
                      }}
                      className="btn-secondary"
                      style={{ padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title="Settings"
                    >
                      <Settings size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(group.id, e)}
                      className="btn-danger"
                      style={{ padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsl(0 72% 60% / 0.1)", border: "1px solid hsl(0 72% 60% / 0.2)", color: "hsl(0 72% 60%)" }}
                      title="Delete group"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
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
