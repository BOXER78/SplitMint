import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";
import { getAuthUser } from "../../../../../lib/auth";
import { computeGroupBalances, computeGroupStats } from "../../../../../lib/balance-engine";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const groupId = Number(id);
  const db = getDb();

  const isMember = db
    .prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?")
    .get(groupId, auth.userId);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { balances, settlements, netBalances } = computeGroupBalances(groupId);
  const { totalSpent, memberContributions } = computeGroupStats(groupId);

  return NextResponse.json({
    balances,
    settlements,
    netBalances,
    totalSpent,
    memberContributions,
  });
}
