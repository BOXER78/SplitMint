import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/auth";
import { query, queryOne, execute } from "@/lib/db";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await queryOne("SELECT id, email, name, avatar_color FROM users WHERE id = ?", [auth.userId]) as { id: number; email: string; name: string; avatar_color: string } | undefined;

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ user });
}
