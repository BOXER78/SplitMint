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
              className="animate-scale-in"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px 6px 6px",
                background: "hsl(var(--primary) / 0.1)",
                border: "1px solid hsl(var(--primary) / 0.3)",
                borderRadius: "12px",
                fontSize: "13px",
              }}
            >
              <Avatar name={u.name} color={u.avatar_color} size="sm" />
              <span style={{ color: "hsl(var(--foreground))", fontWeight: "600" }}>{u.name}</span>
              <button
                type="button"
                onClick={() => onRemove(u.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "hsl(var(--muted-foreground))",
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                  borderRadius: "4px",
                  transition: "color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "hsl(var(--foreground))"}
                onMouseLeave={(e) => e.currentTarget.style.color = "hsl(var(--muted-foreground))"}
              >
                <X size={14} />
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
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "hsl(var(--muted-foreground))",
              }}
            />
            <input
              type="text"
              className="input-field"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type name or email to add..."
              style={{ paddingLeft: "38px", height: "42px" }}
            />
          </div>

          {loading && (
            <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
              <Loading size="sm" />
            </div>
          )}

          {results.length > 0 && (
            <div
              className="glass-card animate-slide-up"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,
                zIndex: 50,
                maxHeight: "260px",
                overflowY: "auto",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
                padding: "4px"
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
                    gap: "12px",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    borderRadius: "8px",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "hsl(var(--primary) / 0.1)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <Avatar name={u.name} color={u.avatar_color} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", color: "hsl(var(--foreground))", fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>{u.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.length >= 2 && !loading && results.length === 0 && (
            <div
              className="glass-card"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,
                padding: "16px",
                fontSize: "13px",
                color: "hsl(var(--muted-foreground))",
                textAlign: "center",
                zIndex: 10
              }}
            >
              No users found for "{query}"
            </div>
          )}
        </div>
      )}

      {!canAdd && (
        <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginTop: "8px", background: "hsl(var(--secondary) / 0.5)", padding: "8px 12px", borderRadius: "10px", border: "1px dashed hsl(var(--border))" }}>
          Maximum {maxUsers} other members reached.
        </p>
      )}
    </div>
  );
}
