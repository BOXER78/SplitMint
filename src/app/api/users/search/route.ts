import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { getAuthUser } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) return NextResponse.json({ users: [] });

  const db = getDb();
  const users = db
    .prepare(
      `SELECT id, name, email, avatar_color FROM users
       WHERE (name LIKE ? OR email LIKE ?) AND id != ?
       LIMIT 10`
    )
    .all(`%${q}%`, `%${q}%`, auth.userId);

  return NextResponse.json({ users });
}
