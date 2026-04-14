import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db";
import { getAuthUser } from "../../../../lib/auth";

async function await isMember(db: ReturnType<typeof getDb>, groupId: number, userId: number) {
  return await query("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(groupId, userId);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const groupId = Number(id);
  if (!await isMember(db, groupId, auth.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const group = await queryOne("SELECT * FROM groups WHERE id = ?", [groupId]);
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const members = await queryOne(`SELECT u.id, u.name, u.email, u.avatar_color, gm.joined_at
       FROM users u JOIN group_members gm ON u.id = gm.user_id
       WHERE gm.group_id = ?`, [groupId]);

  return NextResponse.json({ group, members });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const groupId = Number(id);
  const group = await execute("SELECT * FROM groups WHERE id = ?", [groupId]) as { created_by: number } | undefined;
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
    await queryOne("UPDATE groups SET name = ? WHERE id = ?", [name.trim(]), groupId);
    await execute("DELETE FROM group_members WHERE group_id = ?", [groupId]);
    for (const uid of allMemberIds) {
      await execute("INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)", [groupId, uid]);
    }
  })();

  const updated = await execute("SELECT * FROM groups WHERE id = ?", [groupId]);
  return NextResponse.json({ group: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const groupId = Number(id);
  const group = await queryOne("SELECT * FROM groups WHERE id = ?", [groupId]) as { created_by: number } | undefined;
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (group.created_by !== auth.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  db.prepare("DELETE FROM groups WHERE id = ?", [groupId]);
  return NextResponse.json({ success: true });
}
