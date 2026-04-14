import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../lib/db";
import { getAuthUser } from "../../../lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const groups = db
    .prepare(
      `SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
        (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE group_id = g.id) as total_spent
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = ?
       ORDER BY g.created_at DESC`
    )
    .all(auth.userId);

  return NextResponse.json({ groups });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, memberIds } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Group name required" }, { status: 400 });
  }

  const allMemberIds: number[] = [auth.userId, ...(memberIds || [])].filter(
    (v, i, a) => a.indexOf(v) === i
  );

  if (allMemberIds.length > 4) {
    return NextResponse.json({ error: "Max 4 members per group" }, { status: 400 });
  }

  const db = getDb();
  const insertGroup = db.prepare("INSERT INTO groups (name, created_by) VALUES (?, ?)");
  const insertMember = db.prepare("INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)");

  const result = db.transaction(() => {
    const r = insertGroup.run(name.trim(), auth.userId);
    const groupId = Number(r.lastInsertRowid);
    for (const uid of allMemberIds) {
      insertMember.run(groupId, uid);
    }
    return groupId;
  })();

  const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(result);
  return NextResponse.json({ group }, { status: 201 });
}
