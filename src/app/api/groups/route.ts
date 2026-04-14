import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db";
import { getAuthUser } from "../../../lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const groups = await query(`SELECT g.*, 
        CAST((SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS INTEGER) as member_count,
        CAST((SELECT COALESCE(SUM(amount),0) FROM expenses WHERE group_id = g.id) AS DECIMAL) as total_spent
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = ?
       ORDER BY g.created_at DESC`, [auth.userId]);

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
  const result = await queryOne("INSERT INTO groups (name, created_by) VALUES (?, ?) RETURNING id", [name.trim(), auth.userId]);
  const groupId = result.id;

  for (const uid of allMemberIds) {
    await execute("INSERT INTO group_members (group_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING", [groupId, uid]);
  }

  const group = await queryOne("SELECT * FROM groups WHERE id = ?", [groupId]);
  return NextResponse.json({ group }, { status: 201 });
}
