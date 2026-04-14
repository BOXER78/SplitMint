"use client";

import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { Avatar } from "./Avatar";
import { Loading } from "./Loading";

interface User {
  id: number;
  name: string;
  email: string;
  avatar_color: string;
}

interface UserSearchProps {
  selected: User[];
  onAdd: (user: User) => void;
  onRemove: (userId: number) => void;
  maxUsers?: number;
  excludeIds?: number[];
}

export function UserSearch({ selected, onAdd, onRemove, maxUsers = 3, excludeIds = [] }: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        const filtered = (data.users || []).filter(
          (u: User) =>
            !selected.find((s) => s.id === u.id) &&
            !excludeIds.includes(u.id)
        );
        setResults(filtered);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selected, excludeIds]);

  const canAdd = selected.length < maxUsers;

  return (
    <div>
      {/* Selected members */}
      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          {selected.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 10px 5px 6px",
                background: "rgba(74, 222, 128, 0.08)",
                border: "1px solid rgba(74, 222, 128, 0.2)",
                borderRadius: "20px",
                fontSize: "13px",
              }}
            >
              <Avatar name={u.name} color={u.avatar_color} size="sm" />
              <span style={{ color: "var(--text-primary)" }}>{u.name}</span>
              <button
                type="button"
                onClick={() => onRemove(u.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 2px",
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <div style={{ position: "relative" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              className="input-field"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              style={{ paddingLeft: "34px" }}
            />
          </div>

          {loading && <Loading size="sm" />}

          {results.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                background: "#151b2e",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                overflow: "hidden",
                zIndex: 10,
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    onAdd(u);
                    setQuery("");
                    setResults([]);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <Avatar name={u.name} color={u.avatar_color} size="sm" />
                  <div>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{u.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.length >= 2 && !loading && results.length === 0 && (
            <div
              style={{
                marginTop: "6px",
                fontSize: "12px",
                color: "var(--text-muted)",
                paddingLeft: "4px",
              }}
            >
              No users found
            </div>
          )}
        </div>
      )}

      {!canAdd && (
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Maximum {maxUsers} members added (max group size: {maxUsers + 1} including you)
        </p>
      )}
    </div>
  );
}
