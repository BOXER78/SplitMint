import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { getAuthUser } from "../../../../lib/auth";

function isMember(db: ReturnType<typeof getDb>, groupId: number, userId: number) {
  return db.prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(groupId, userId);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const groupId = Number(id);
  const db = getDb();

  if (!isMember(db, groupId, auth.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(groupId);
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const members = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.avatar_color, gm.joined_at
       FROM users u JOIN group_members gm ON u.id = gm.user_id
       WHERE gm.group_id = ?`
    )
    .all(groupId);

  return NextResponse.json({ group, members });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const groupId = Number(id);
  const db = getDb();

  const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(groupId) as { created_by: number } | undefined;
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (group.created_by !== auth.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, memberIds } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const allMemberIds: number[] = [auth.userId, ...(memberIds || [])].filter(
    (v, i, a) => a.indexOf(v) === i
  );

  if (allMemberIds.length > 4) {
    return NextResponse.json({ error: "Max 4 members per group" }, { status: 400 });
  }

  db.transaction(() => {
    db.prepare("UPDATE groups SET name = ? WHERE id = ?").run(name.trim(), groupId);
    db.prepare("DELETE FROM group_members WHERE group_id = ?").run(groupId);
    for (const uid of allMemberIds) {
      db.prepare("INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)").run(groupId, uid);
    }
  })();

  const updated = db.prepare("SELECT * FROM groups WHERE id = ?").get(groupId);
  return NextResponse.json({ group: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const groupId = Number(id);
  const db = getDb();

  const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(groupId) as { created_by: number } | undefined;
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (group.created_by !== auth.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  db.prepare("DELETE FROM groups WHERE id = ?").run(groupId);
  return NextResponse.json({ success: true });
}
